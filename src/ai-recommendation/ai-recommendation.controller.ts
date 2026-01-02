import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AIRecommendationService } from './ai-recommendation.service';
import { SymptomInputDto, ChatMessageDto } from './dto/symptom-input.dto';
import { JwtAuthGuard } from '../auth/guards';
import { Public } from '../auth/decorators';

@ApiTags('AI Recommendation')
@Controller('ai')
export class AIRecommendationController {
  constructor(private readonly aiRecommendationService: AIRecommendationService) {}

  @Post('recommend-doctor')
  @Public()
  @ApiOperation({
    summary: 'Đề xuất bác sĩ dựa trên triệu chứng',
    description:
      'Sử dụng AI để phân tích triệu chứng và đề xuất bác sĩ phù hợp nhất',
  })
  @ApiResponse({
    status: 200,
    description: 'Đề xuất thành công',
    schema: {
      example: {
        success: true,
        data: {
          analysis: {
            possibleConditions: ['Đau đầu migraine', 'Rối loạn tiền đình'],
            recommendedSpecialties: ['Thần kinh Tổng quát'],
            urgencyLevel: 'MODERATE',
          },
          recommendations: [
            {
              rank: 1,
              doctor: {
                id: 'uuid',
                fullName: 'TS.BS Lê Thị Giang',
                specialty: 'Thần kinh Tổng quát',
                professionalTitle: 'Tiến sĩ, Bác sĩ',
                yearsOfExperience: 16,
                consultationFee: 420000,
              },
              matchScore: 95,
              matchReasons: [
                'Chuyên gia về đau đầu và chóng mặt',
                '16 năm kinh nghiệm',
              ],
              availableSlots: [
                {
                  date: '2026-01-05',
                  dayOfWeek: 'TUESDAY',
                  startTime: '07:30',
                  endTime: '11:00',
                  remainingSlots: 5,
                },
              ],
            },
          ],
          disclaimer: 'Đây chỉ là gợi ý dựa trên AI...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cần thêm thông tin',
    schema: {
      example: {
        success: true,
        requiresMoreInfo: true,
        followUpQuestion: 'Bạn có thể mô tả chi tiết hơn vị trí đau không?',
        suggestedQuestions: [
          'Đau bụng vùng thượng vị',
          'Đau bụng dưới bên phải',
        ],
      },
    },
  })
  async recommendDoctor(@Body() dto: SymptomInputDto) {
    return this.aiRecommendationService.recommendDoctors(dto);
  }

  @Post('chat')
  @Public()
  @ApiOperation({
    summary: 'Chat với AI để tư vấn triệu chứng',
    description:
      'Trò chuyện với AI để được hỗ trợ mô tả triệu chứng và tìm bác sĩ phù hợp',
  })
  @ApiResponse({
    status: 200,
    description: 'Phản hồi từ AI',
    schema: {
      example: {
        success: true,
        data: {
          response:
            'Xin chào! Để giúp bạn tìm bác sĩ phù hợp, tôi cần biết thêm...',
          requiresMoreInfo: true,
          suggestedQuestions: [
            'Đau bụng vùng thượng vị',
            'Đau bụng dưới bên phải',
          ],
          readyToRecommend: false,
        },
      },
    },
  })
  async chat(@Body() dto: ChatMessageDto) {
    return this.aiRecommendationService.chat(dto);
  }

  @Post('recommend-doctor/authenticated')
  @Public()
  @ApiOperation({
    summary: 'Đề xuất bác sĩ (có xác thực)',
    description:
      'Đề xuất bác sĩ cho người dùng đã đăng nhập, có thể tích hợp lịch sử khám bệnh',
  })
  async recommendDoctorAuthenticated(@Body() dto: SymptomInputDto) {
    return this.aiRecommendationService.recommendDoctors(dto);
  }
}

