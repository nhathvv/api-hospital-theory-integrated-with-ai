import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EnvService } from '../configs/envs/env-service';
import { ConversationService } from './conversation.service';
import { CreateMessageDto } from './dto';
import { UserRole } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  userId: string;
  userRole: UserRole;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  namespace: 'api/v1/chat',
  transports: ['polling', 'websocket'],
})
export class ConversationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ConversationGateway.name);
  private readonly envService = EnvService.getInstance();
  private connectedUsers = new Map<string, string[]>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly conversationService: ConversationService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`New client attempting to connect: ${client.id}`);
    
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} - No token provided`);
        client.emit('error', { message: 'No token provided' });
        client.disconnect();
        return;
      }

      this.logger.log(`Client ${client.id} - Token received, verifying...`);

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.envService.getJwtAccessSecret(),
      });

      client.userId = payload.sub;
      client.userRole = payload.role as UserRole;

      const userSockets = this.connectedUsers.get(payload.sub) || [];
      userSockets.push(client.id);
      this.connectedUsers.set(payload.sub, userSockets);

      client.join(`user:${payload.sub}`);

      this.logger.log(
        `✅ Client connected: ${client.id}, User: ${payload.sub}, Role: ${payload.role}`,
      );

      client.emit('connected', { userId: payload.sub, role: payload.role });
    } catch (error) {
      this.logger.error(`Client ${client.id} - Token verification failed: ${error.message}`);
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId) || [];
      const updatedSockets = userSockets.filter((id) => id !== client.id);
      if (updatedSockets.length > 0) {
        this.connectedUsers.set(client.userId, updatedSockets);
      } else {
        this.connectedUsers.delete(client.userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.join(room);
    this.logger.log(`User ${client.userId} joined ${room}`);

    await this.conversationService.markMessagesAsRead(
      data.conversationId,
      client.userId,
    );

    return { success: true, room };
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const room = `conversation:${data.conversationId}`;
    client.leave(room);
    this.logger.log(`User ${client.userId} left ${room}`);
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; content: string; messageType?: string },
  ) {
    try {
      const dto: CreateMessageDto = {
        content: data.content,
        messageType: (data.messageType as any) || 'TEXT',
      };

      const message = await this.conversationService.sendMessage(
        data.conversationId,
        client.userId,
        client.userRole,
        dto,
      );

      this.server.to(`conversation:${data.conversationId}`).emit('new_message', {
        conversationId: data.conversationId,
        message,
      });

      this.emitConversationUpdate(data.conversationId);

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: client.userId,
      userRole: client.userRole,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    await this.conversationService.markMessagesAsRead(
      data.conversationId,
      client.userId,
    );

    this.server.to(`conversation:${data.conversationId}`).emit('messages_read', {
      conversationId: data.conversationId,
      readBy: client.userId,
    });

    return { success: true };
  }

  emitNewMessage(conversationId: string, message: any, patientUserId?: string) {
    this.server.to(`conversation:${conversationId}`).emit('new_message', {
      conversationId,
      message,
    });

    if (patientUserId) {
      this.server.to(`user:${patientUserId}`).emit('conversation_update', {
        conversationId,
        type: 'new_message',
      });
    }

    this.server.emit('admin_notification', {
      conversationId,
      type: 'new_message',
    });

    this.emitConversationUpdate(conversationId);
  }

  emitConversationUpdate(conversationId: string) {
    this.server.emit('conversation_list_update', {
      conversationId,
      timestamp: new Date().toISOString(),
    });
  }

  private extractToken(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    const token = client.handshake.auth?.token;
    if (token) {
      return token;
    }

    return client.handshake.query?.token as string || null;
  }
}

