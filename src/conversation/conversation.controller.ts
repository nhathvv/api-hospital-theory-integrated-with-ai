import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as ApiResponseSwagger,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import { ConversationGateway } from './conversation.gateway';
import {
  CreateConversationDto,
  CreateMessageDto,
  QueryConversationDto,
  QueryMessageDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles, CurrentUser } from '../auth/decorators';
import { UserRole } from '../common/constants';
import { ApiResponse, PaginatedResponse } from '../common/dto';
import { PatientService } from '../patient';
import { ExceptionUtils } from '../common/utils';
import { UserRole as PrismaUserRole } from '@prisma/client';

@ApiTags('Patient - Conversations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PATIENT)
@Controller('patients/conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly patientService: PatientService,
    private readonly conversationGateway: ConversationGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo cuộc hội thoại mới với Admin' })
  @ApiResponseSwagger({ status: 201, description: 'Tạo cuộc hội thoại thành công' })
  @ApiResponseSwagger({ status: 401, description: 'Chưa xác thực' })
  async createConversation(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateConversationDto,
  ) {
    const patient = await this.patientService.getOrCreatePatientByUserId(userId);
    if (!patient) {
      ExceptionUtils.throwNotFound('Không tìm thấy hồ sơ bệnh nhân. Vui lòng đăng ký tài khoản bệnh nhân.');
    }
    const conversation = await this.conversationService.createConversation(
      patient.id,
      dto,
    );
    return ApiResponse.success(conversation, 'Tạo cuộc hội thoại thành công');
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cuộc hội thoại của tôi' })
  @ApiResponseSwagger({ status: 200, description: 'Thành công' })
  async findMyConversations(
    @CurrentUser('sub') userId: string,
    @Query() query: QueryConversationDto,
  ) {
    const patient = await this.patientService.getOrCreatePatientByUserId(userId);
    if (!patient) {
      ExceptionUtils.throwNotFound('Không tìm thấy hồ sơ bệnh nhân. Vui lòng đăng ký tài khoản bệnh nhân.');
    }
    const result = await this.conversationService.findAllByPatient(patient.id, query);
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
      PrismaUserRole.PATIENT,
    );
    return ApiResponse.success(result, 'Lấy số tin nhắn chưa đọc thành công');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết cuộc hội thoại' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  @ApiResponseSwagger({ status: 200, description: 'Thành công' })
  @ApiResponseSwagger({ status: 404, description: 'Không tìm thấy cuộc hội thoại' })
  async findConversationById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    const conversation = await this.conversationService.findConversationById(
      id,
      userId,
      PrismaUserRole.PATIENT,
    );
    return ApiResponse.success(conversation, 'Lấy chi tiết cuộc hội thoại thành công');
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Lấy danh sách tin nhắn trong cuộc hội thoại' })
  @ApiParam({ name: 'id', description: 'ID cuộc hội thoại' })
  @ApiResponseSwagger({ status: 200, description: 'Thành công' })
  async getMessages(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
    @Query() query: QueryMessageDto,
  ) {
    const result = await this.conversationService.getMessages(
      id,
      query,
      userId,
      PrismaUserRole.PATIENT,
    );
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
      PrismaUserRole.PATIENT,
      dto,
    );
    this.conversationGateway.emitNewMessage(id, message);
    return ApiResponse.success(message, 'Gửi tin nhắn thành công');
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

