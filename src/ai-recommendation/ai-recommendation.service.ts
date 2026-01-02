import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { GeminiService } from './gemini/gemini.service';
import { SymptomInputDto, ChatMessageDto } from './dto/symptom-input.dto';
import {
  RecommendationResponse,
  DoctorContext,
  DoctorWithRecommendation,
  AvailableSlot,
} from './interfaces/recommendation.interface';

@Injectable()
export class AIRecommendationService {
  private readonly logger = new Logger(AIRecommendationService.name);

  constructor(
    private readonly geminiService: GeminiService,
    private readonly prisma: PrismaService,
  ) {}

  async recommendDoctors(dto: SymptomInputDto): Promise<RecommendationResponse> {
    const doctors = await this.getDoctorsForAIContext();

    if (doctors.length === 0) {
      return {
        success: false,
        responseType: 'NO_DATA',
        data: {
          analysis: {
            possibleConditions: [],
            recommendedSpecialties: [],
            urgencyLevel: 'LOW',
          },
          recommendations: [],
          disclaimer: 'Hiện tại không có bác sĩ trong hệ thống.',
        },
      };
    }

    const aiResult = await this.geminiService.analyzeSymptoms(
      dto.symptoms,
      doctors,
      dto.patientInfo,
    );

    if (aiResult.needsMoreInfo) {
      return {
        success: true,
        responseType: 'NEEDS_MORE_INFO',
        followUpQuestion: aiResult.followUpQuestion,
        suggestedQuestions: this.generateSuggestedQuestions(dto.symptoms),
      };
    }

    const recommendations = await this.buildRecommendations(
      aiResult.doctorRecommendations,
      doctors,
      dto.preferredDate,
      dto.examinationType,
    );

    return {
      success: true,
      responseType: 'SUGGESTION',
      data: {
        analysis: aiResult.analysis,
        recommendations,
        disclaimer:
          'Đây chỉ là gợi ý dựa trên AI. Vui lòng tham khảo ý kiến bác sĩ để được chẩn đoán và điều trị chính xác.',
      },
    };
  }

  async chat(dto: ChatMessageDto): Promise<{
    success: boolean;
    data: {
      response: string;
      requiresMoreInfo: boolean;
      suggestedQuestions: string[] | null;
      readyToRecommend: boolean;
    };
  }> {
    const result = await this.geminiService.chat(
      dto.message,
      dto.conversationHistory || [],
    );

    return {
      success: true,
      data: result,
    };
  }

  private async getDoctorsForAIContext(): Promise<DoctorContext[]> {
    const doctors = await this.prisma.doctor.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        bio: true,
        subSpecialty: true,
        professionalTitle: true,
        yearsOfExperience: true,
        consultationFee: true,
        primarySpecialty: {
          select: {
            id: true,
            name: true,
            description: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            fullName: true,
            avatar: true,
          },
        },
        educations: {
          select: {
            school: true,
            degree: true,
            graduationYear: true,
          },
        },
        awards: {
          select: {
            title: true,
            organization: true,
            year: true,
          },
        },
        certifications: {
          select: {
            certificateName: true,
            issuingAuthority: true,
          },
        },
        schedules: {
          where: { isActive: true },
          select: {
            timeSlots: {
              select: {
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                examinationType: true,
                maxPatients: true,
              },
            },
          },
        },
      },
    });

    return doctors.map((d) => ({
      id: d.id,
      fullName: d.user.fullName || '',
      specialty: d.primarySpecialty.name,
      subSpecialty: d.subSpecialty,
      professionalTitle: d.professionalTitle || '',
      yearsOfExperience: d.yearsOfExperience,
      consultationFee: d.consultationFee,
      bio: d.bio || '',
      educations: d.educations.map(
        (e) => `${e.degree} - ${e.school} (${e.graduationYear})`,
      ),
      awards: d.awards.map((a) => `${a.title} - ${a.organization} (${a.year})`),
      certifications: d.certifications.map(
        (c) => `${c.certificateName} - ${c.issuingAuthority}`,
      ),
      schedules: d.schedules.flatMap((s) =>
        s.timeSlots.map((ts) => ({
          dayOfWeek: ts.dayOfWeek,
          startTime: ts.startTime,
          endTime: ts.endTime,
          examinationType: ts.examinationType,
        })),
      ),
    }));
  }

  private async buildRecommendations(
    aiRecommendations: { doctorId: string; matchScore: number; reasons: string[] }[],
    doctors: DoctorContext[],
    preferredDate?: string,
    examinationType?: string,
  ): Promise<DoctorWithRecommendation[]> {
    const doctorMap = new Map(doctors.map((d) => [d.id, d]));
    const recommendations: DoctorWithRecommendation[] = [];

    for (let i = 0; i < aiRecommendations.length; i++) {
      const rec = aiRecommendations[i];
      const doctor = doctorMap.get(rec.doctorId);

      if (!doctor) continue;

      const availableSlots = await this.getAvailableSlots(
        rec.doctorId,
        preferredDate,
        examinationType,
      );

      recommendations.push({
        rank: i + 1,
        doctor: {
          id: doctor.id,
          fullName: doctor.fullName,
          specialty: doctor.specialty,
          subSpecialty: doctor.subSpecialty,
          professionalTitle: doctor.professionalTitle,
          yearsOfExperience: doctor.yearsOfExperience,
          consultationFee: doctor.consultationFee,
          avatar: null,
          bio: doctor.bio,
        },
        matchScore: rec.matchScore,
        matchReasons: rec.reasons,
        availableSlots,
      });
    }

    return recommendations;
  }

  private async getAvailableSlots(
    doctorId: string,
    preferredDate?: string,
    examinationType?: string,
  ): Promise<AvailableSlot[]> {
    const today = new Date();
    const targetDate = preferredDate ? new Date(preferredDate) : today;

    const schedule = await this.prisma.doctorSchedule.findFirst({
      where: {
        doctorId,
        isActive: true,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
      include: {
        timeSlots: {
          where: examinationType ? { examinationType: examinationType as any } : undefined,
        },
      },
    });

    if (!schedule) return [];

    const slots: AvailableSlot[] = [];
    const daysToCheck = 7;

    for (let i = 0; i < daysToCheck; i++) {
      const checkDate = new Date(targetDate);
      checkDate.setDate(checkDate.getDate() + i);

      const dayOfWeek = this.getDayOfWeek(checkDate);

      const matchingSlots = schedule.timeSlots.filter(
        (ts) => ts.dayOfWeek === dayOfWeek,
      );

      for (const slot of matchingSlots) {
        const appointmentCount = await this.prisma.appointment.count({
          where: {
            doctorId,
            appointmentDate: checkDate,
            timeSlotId: slot.id,
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          },
        });

        const remainingSlots = slot.maxPatients - appointmentCount;

        if (remainingSlots > 0) {
          slots.push({
            date: checkDate.toISOString().split('T')[0],
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            remainingSlots,
            examinationType: slot.examinationType,
          });
        }
      }
    }

    return slots.slice(0, 5);
  }

  private getDayOfWeek(date: Date): string {
    const days = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];
    return days[date.getDay()];
  }

  private generateSuggestedQuestions(symptoms: string): string[] {
    const lowerSymptoms = symptoms.toLowerCase();

    if (lowerSymptoms.includes('đau bụng') || lowerSymptoms.includes('bụng')) {
      return [
        'Đau bụng vùng thượng vị, sau khi ăn',
        'Đau bụng dưới bên phải',
        'Đau bụng kèm tiêu chảy hoặc táo bón',
      ];
    }

    if (lowerSymptoms.includes('đau đầu') || lowerSymptoms.includes('đầu')) {
      return [
        'Đau đầu một bên, kèm buồn nôn',
        'Đau đầu cả hai bên, căng thẳng',
        'Đau đầu kèm chóng mặt',
      ];
    }

    if (lowerSymptoms.includes('ho') || lowerSymptoms.includes('họng')) {
      return [
        'Ho khan kéo dài',
        'Ho có đờm màu vàng/xanh',
        'Ho kèm sốt và đau họng',
      ];
    }

    return [
      'Mô tả triệu chứng chi tiết hơn',
      'Triệu chứng kéo dài bao lâu?',
      'Có triệu chứng nào khác không?',
    ];
  }
}

