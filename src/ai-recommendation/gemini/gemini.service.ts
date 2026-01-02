import { Injectable, Logger, OnModuleInit, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { EnvService } from '../../configs/envs/env-service';
import { AIAnalysisResult, PatientInfo } from '../interfaces/recommendation.interface';
import { SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT, buildDoctorContext } from '../prompts/system-prompt';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly envService = EnvService.getInstance();

  onModuleInit() {
    const apiKey = this.envService.getGeminiApiKey();
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not configured');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: this.envService.getGeminiModel(),
    });
    this.logger.log('Gemini AI service initialized');
  }

  async analyzeSymptoms(
    symptoms: string,
    doctorsContext: any[],
    patientInfo?: PatientInfo,
  ): Promise<AIAnalysisResult> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured');
    }

    const doctorsData = buildDoctorContext(doctorsContext);
    const prompt = this.buildAnalysisPrompt(symptoms, doctorsData, patientInfo);

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: this.envService.getGeminiTemperature(),
          maxOutputTokens: this.envService.getGeminiMaxTokens(),
        },
      });

      const response = result.response.text();
      return this.parseAnalysisResponse(response);
    } catch (error) {
      this.handleGeminiError(error, 'Error analyzing symptoms');
    }
  }

  async chat(
    message: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<{ response: string; requiresMoreInfo: boolean; suggestedQuestions: string[] | null; readyToRecommend: boolean }> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured');
    }

    const contents = [
      { role: 'user' as const, parts: [{ text: CHAT_SYSTEM_PROMPT }] },
      { role: 'model' as const, parts: [{ text: 'Tôi hiểu. Tôi sẽ hỗ trợ bệnh nhân một cách thân thiện và chuyên nghiệp.' }] },
      ...conversationHistory.map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: msg.content }],
      })),
      { role: 'user' as const, parts: [{ text: message }] },
    ];

    try {
      const result = await this.model.generateContent({
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
        },
      });

      const response = result.response.text();
      return this.parseChatResponse(response);
    } catch (error) {
      this.handleGeminiError(error, 'Error in chat');
    }
  }

  private handleGeminiError(error: any, context: string): never {
    this.logger.error(`${context}:`, error);

    if (error.status === 429) {
      throw new HttpException(
        'Hệ thống AI đang quá tải. Vui lòng thử lại sau ít phút.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (error.status === 400) {
      throw new HttpException(
        'Yêu cầu không hợp lệ. Vui lòng thử lại.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (error.status === 403) {
      throw new HttpException(
        'Không có quyền truy cập dịch vụ AI.',
        HttpStatus.FORBIDDEN,
      );
    }

    throw new HttpException(
      'Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private buildAnalysisPrompt(
    symptoms: string,
    doctorsData: string,
    patientInfo?: PatientInfo,
  ): string {
    const systemPrompt = SYSTEM_PROMPT.replace('{doctors_data}', doctorsData);

    let patientInfoText = 'Không có thông tin bổ sung';
    if (patientInfo) {
      const parts: string[] = [];
      if (patientInfo.age) parts.push(`Tuổi: ${patientInfo.age}`);
      if (patientInfo.gender) {
        const genderMap = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };
        parts.push(`Giới tính: ${genderMap[patientInfo.gender]}`);
      }
      if (patientInfo.medicalHistory?.length) {
        parts.push(`Tiền sử bệnh: ${patientInfo.medicalHistory.join(', ')}`);
      }
      if (parts.length > 0) patientInfoText = parts.join('\n');
    }

    return `
${systemPrompt}

THÔNG TIN BỆNH NHÂN:
${patientInfoText}

TRIỆU CHỨNG CỦA BỆNH NHÂN:
"${symptoms}"

Hãy phân tích triệu chứng và đề xuất bác sĩ phù hợp. Trả về JSON theo format đã chỉ định.
    `.trim();
  }

  private parseAnalysisResponse(response: string): AIAnalysisResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          needsMoreInfo: parsed.needsMoreInfo || false,
          followUpQuestion: parsed.followUpQuestion || null,
          analysis: {
            possibleConditions: parsed.analysis?.possibleConditions || [],
            recommendedSpecialties: parsed.analysis?.recommendedSpecialties || [],
            urgencyLevel: parsed.analysis?.urgencyLevel || 'LOW',
          },
          doctorRecommendations: parsed.doctorRecommendations || [],
        };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      this.logger.error('Error parsing AI response:', error);
      return {
        needsMoreInfo: true,
        followUpQuestion: 'Xin lỗi, tôi không hiểu rõ triệu chứng của bạn. Bạn có thể mô tả chi tiết hơn được không?',
        analysis: {
          possibleConditions: [],
          recommendedSpecialties: [],
          urgencyLevel: 'LOW',
        },
        doctorRecommendations: [],
      };
    }
  }

  private parseChatResponse(response: string): {
    response: string;
    requiresMoreInfo: boolean;
    suggestedQuestions: string[] | null;
    readyToRecommend: boolean;
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          response: parsed.response || response,
          requiresMoreInfo: parsed.requiresMoreInfo ?? true,
          suggestedQuestions: parsed.suggestedQuestions || null,
          readyToRecommend: parsed.readyToRecommend ?? false,
        };
      }
      return {
        response: response,
        requiresMoreInfo: true,
        suggestedQuestions: null,
        readyToRecommend: false,
      };
    } catch {
      return {
        response: response,
        requiresMoreInfo: true,
        suggestedQuestions: null,
        readyToRecommend: false,
      };
    }
  }
}

