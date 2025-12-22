import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConversationService } from '../../conversation/conversation.service';
import { ConversationGateway } from '../../conversation/conversation.gateway';
import {
  CreateMessageDto,
  QueryConversationDto,
  QueryMessageDto,
  UpdateConversationDto,
  CloseConversationDto,
} from '../../conversation/dto';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import { Roles, CurrentUser } from '../../auth/decorators';
import { UserRole } from '../../common/constants';
import { ApiResponse, PaginatedResponse } from '../../common/dto';
import { UserRole as PrismaUserRole } from '@prisma/client';

@ApiTags('Admin - Conversations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/conversations')
export class AdminConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly conversationGateway: ConversationGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả cuộc hội thoại' })
  @ApiResponseSwagger({ status: 200, description: 'Thành công' })
  async findAll(@Query() query: QueryConversationDto) {
    const result = await this.conversationService.findAllByAdmin(query);
    return PaginatedResponse.create(
      result.data,
      result.totalItems,
      query,
      'Lấy danh sách cuộc hội thoại thành công',
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Lấy số tin nhắn chưa đọc' })
  @ApiResponseSwagger({ status: 200, description: 'Thành công' })
  async getUnreadCount(@CurrentUser('sub') userId: string) {
    const result = await this.conversationService.getUnreadCount(
      userId,
      PrismaUserRole.ADMIN,
    );
    return ApiResponse.success(result, 'Lấy số tin nhắn chưa đọc thành công');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết cuộc hội thoại' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  @ApiResponseSwagger({ status: 200, description: 'Thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy cuộc hội thoại' })
  async findById(@Param('id') id: string) {
    const conversation = await this.conversationService.findConversationById(id);
    return ApiResponse.success(conversation, 'Lấy chi tiết cuộc hội thoại thành công');
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Lấy danh sách tin nhắn trong cuộc hội thoại' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  @ApiResponseSwagger({ status: 200, description: 'Thành công' })
  async getMessages(
    @Param('id') id: string,
    @Query() query: QueryMessageDto,
  ) {
    const result = await this.conversationService.getMessages(id, query);
    return PaginatedResponse.create(
      result.data,
      result.totalItems,
      query,
      'Lấy danh sách tin nhắn thành công',
    );
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Gửi tin nhắn trong cuộc hội thoại' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  @ApiResponseSwagger({ status: 201, description: 'Gửi tin nhắn thành công' })
  async sendMessage(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    const message = await this.conversationService.sendMessage(
      id,
      userId,
      PrismaUserRole.ADMIN,
      dto,
    );
    this.conversationGateway.emitNewMessage(id, message);
    return ApiResponse.success(message, 'Gửi tin nhắn thành công');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật cuộc hội thoại' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  @ApiResponseSwagger({ status: 200, description: 'Cập nhật thành công' })
  async update(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    const conversation = await this.conversationService.updateConversation(
      id,
      userId,
      dto,
    );
    return ApiResponse.success(conversation, 'Cập nhật cuộc hội thoại thành công');
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Đóng cuộc hội thoại' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  @ApiResponseSwagger({ status: 200, description: 'Đóng cuộc hội thoại thành công' })
  async close(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Body() dto: CloseConversationDto,
  ) {
    const conversation = await this.conversationService.closeConversation(id, userId);
    return ApiResponse.success(conversation, 'Đóng cuộc hội thoại thành công');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc tin nhắn' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  @ApiResponseSwagger({ status: 200, description: 'Thành công' })
  async markAsRead(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    const result = await this.conversationService.markMessagesAsRead(id, userId);
    return ApiResponse.success(result, 'Đánh dấu đã đọc thành công');
  }
}

