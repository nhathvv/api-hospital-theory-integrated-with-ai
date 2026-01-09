import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EnvService } from '../configs/envs/env-service';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
  },
  namespace: 'api/v1/upload',
  transports: ['polling', 'websocket'],
})
export class UploadGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(UploadGateway.name);
  private readonly envService = EnvService.getInstance();
  private connectedUsers = new Map<string, string[]>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.emit('error', { message: 'No token provided' });
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.envService.getJwtAccessSecret(),
      });

      client.userId = payload.sub;

      const userSockets = this.connectedUsers.get(payload.sub) || [];
      userSockets.push(client.id);
      this.connectedUsers.set(payload.sub, userSockets);

      client.join(`upload:${payload.sub}`);

      this.logger.log(`✅ Upload client connected: ${client.id}, User: ${payload.sub}`);
      client.emit('connected', { userId: payload.sub });
    } catch (error) {
      this.logger.error(`Upload client connection failed: ${error.message}`);
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
    this.logger.log(`Upload client disconnected: ${client.id}`);
  }

  emitUploadProgress(userId: string, data: any) {
    this.server.to(`upload:${userId}`).emit('upload_progress', data);
    this.logger.log(`Emitted upload_progress to user ${userId}: ${JSON.stringify(data)}`);
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

    return (client.handshake.query?.token as string) || null;
  }
}
