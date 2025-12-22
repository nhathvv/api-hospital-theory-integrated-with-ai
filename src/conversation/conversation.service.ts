import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateConversationDto,
  CreateMessageDto,
  QueryConversationDto,
  QueryMessageDto,
  UpdateConversationDto,
} from './dto';
import {
  ConversationStatus,
  ConversationPriority,
  MessageType,
  UserRole,
} from '@prisma/client';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createConversation(patientId: string, dto: CreateConversationDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId, deletedAt: null },
      select: { id: true, userId: true },
    });

    if (!patient) {
      throw new NotFoundException('Không tìm thấy bệnh nhân');
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        patientId,
        subject: dto.subject,
        status: ConversationStatus.OPEN,
        priority: ConversationPriority.NORMAL,
        lastMessageAt: dto.initialMessage ? new Date() : null,
        messages: dto.initialMessage
          ? {
              create: {
                senderId: patient.userId,
                senderRole: UserRole.PATIENT,
                content: dto.initialMessage,
                messageType: MessageType.TEXT,
              },
            }
          : undefined,
      },
      include: this.getConversationIncludes(),
    });

    this.logger.log(`Conversation created: ${conversation.id} by patient ${patientId}`);

    return this.formatConversationResponse(conversation);
  }

  async findAllByPatient(patientId: string, query: QueryConversationDto) {
    const where: any = { patientId };

    if (query.status) {
      where.status = query.status;
    }

    const [conversations, totalItems] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: this.getConversationIncludes(),
        orderBy: { lastMessageAt: 'desc' },
        ...query.getPrismaParams(),
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations.map((c) => this.formatConversationResponse(c)),
      totalItems,
    };
  }

  async findAllByAdmin(query: QueryConversationDto) {
    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.assignedAdminId) {
      where.assignedAdminId = query.assignedAdminId;
    }

    if (query.patientSearch) {
      where.patient = {
        user: {
          OR: [
            { fullName: { contains: query.patientSearch, mode: 'insensitive' } },
            { email: { contains: query.patientSearch, mode: 'insensitive' } },
            { phone: { contains: query.patientSearch, mode: 'insensitive' } },
          ],
        },
      };
    }

    const [conversations, totalItems] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: this.getConversationIncludes(),
        orderBy: query.getPrismaSortParams(),
        ...query.getPrismaParams(),
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations.map((c) => this.formatConversationResponse(c)),
      totalItems,
    };
  }

  async findConversationById(conversationId: string, userId?: string, role?: UserRole) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: this.getConversationIncludes(),
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({
        where: { userId, id: conversation.patientId },
      });
      if (!patient) {
        throw new ForbiddenException('Bạn không có quyền xem cuộc hội thoại này');
      }
    }

    return this.formatConversationResponse(conversation);
  }

  async getMessages(
    conversationId: string,
    query: QueryMessageDto,
    userId?: string,
    role?: UserRole,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, patientId: true },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({
        where: { userId, id: conversation.patientId },
      });
      if (!patient) {
        throw new ForbiddenException('Bạn không có quyền xem cuộc hội thoại này');
      }
    }

    const [messages, totalItems] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        ...query.getPrismaParams(),
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages.map((m) => this.formatMessageResponse(m)),
      totalItems,
    };
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    senderRole: UserRole,
    dto: CreateMessageDto,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, patientId: true, status: true },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (conversation.status === ConversationStatus.CLOSED) {
      throw new BadRequestException('Cuộc hội thoại đã đóng');
    }

    if (senderRole === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({
        where: { userId: senderId, id: conversation.patientId },
      });
      if (!patient) {
        throw new ForbiddenException('Bạn không có quyền gửi tin nhắn trong cuộc hội thoại này');
      }
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          senderRole,
          content: dto.content,
          messageType: dto.messageType || MessageType.TEXT,
          attachmentUrl: dto.attachmentUrl,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          status:
            senderRole === UserRole.ADMIN &&
            conversation.status === ConversationStatus.OPEN
              ? ConversationStatus.IN_PROGRESS
              : undefined,
        },
      }),
    ]);

    this.logger.log(
      `Message sent: ${message.id} in conversation ${conversationId} by ${senderRole}`,
    );

    return this.formatMessageResponse(message);
  }

  async updateConversation(
    conversationId: string,
    adminUserId: string,
    dto: UpdateConversationDto,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        subject: dto.subject,
        status: dto.status,
        priority: dto.priority,
        assignedAdminId: dto.assignedAdminId,
      },
      include: this.getConversationIncludes(),
    });

    this.logger.log(`Conversation updated: ${conversationId} by admin ${adminUserId}`);

    return this.formatConversationResponse(updated);
  }

  async closeConversation(conversationId: string, closedById: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    if (conversation.status === ConversationStatus.CLOSED) {
      throw new BadRequestException('Cuộc hội thoại đã đóng');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.CLOSED,
        closedAt: new Date(),
        closedById,
      },
      include: this.getConversationIncludes(),
    });

    this.logger.log(`Conversation closed: ${conversationId} by ${closedById}`);

    return this.formatConversationResponse(updated);
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc hội thoại');
    }

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async getUnreadCount(userId: string, role: UserRole) {
    let where: any = {
      isRead: false,
      senderId: { not: userId },
    };

    if (role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (patient) {
        where.conversation = { patientId: patient.id };
      }
    }

    const count = await this.prisma.message.count({ where });

    return { unreadCount: count };
  }

  private getConversationIncludes() {
    return {
      patient: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: 'desc' as const },
        select: {
          id: true,
          content: true,
          senderRole: true,
          messageType: true,
          createdAt: true,
          isRead: true,
        },
      },
      _count: {
        select: {
          messages: true,
        },
      },
    };
  }

  private formatConversationResponse(conversation: any) {
    const lastMessage = conversation.messages?.[0] || null;
    const unreadCount = conversation._count?.messages || 0;

    return {
      id: conversation.id,
      subject: conversation.subject,
      status: conversation.status,
      priority: conversation.priority,
      assignedAdminId: conversation.assignedAdminId,
      lastMessageAt: conversation.lastMessageAt?.toISOString() || null,
      closedAt: conversation.closedAt?.toISOString() || null,
      createdAt: conversation.createdAt.toISOString(),
      patient: conversation.patient
        ? {
            id: conversation.patient.id,
            name: conversation.patient.user.fullName,
            email: conversation.patient.user.email,
            phone: conversation.patient.user.phone,
            avatar: conversation.patient.user.avatar,
          }
        : null,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content:
              lastMessage.content.length > 100
                ? lastMessage.content.substring(0, 100) + '...'
                : lastMessage.content,
            senderRole: lastMessage.senderRole,
            messageType: lastMessage.messageType,
            createdAt: lastMessage.createdAt.toISOString(),
            isRead: lastMessage.isRead,
          }
        : null,
      messageCount: unreadCount,
    };
  }

  private formatMessageResponse(message: any) {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderRole: message.senderRole,
      content: message.content,
      messageType: message.messageType,
      attachmentUrl: message.attachmentUrl,
      isRead: message.isRead,
      readAt: message.readAt?.toISOString() || null,
      createdAt: message.createdAt.toISOString(),
    };
  }
}

