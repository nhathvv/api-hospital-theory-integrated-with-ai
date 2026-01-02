export interface PatientInfo {
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string[];
}

export interface AIAnalysisResult {
  needsMoreInfo: boolean;
  followUpQuestion: string | null;
  analysis: {
    possibleConditions: string[];
    recommendedSpecialties: string[];
    urgencyLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'EMERGENCY';
  };
  doctorRecommendations: DoctorRecommendation[];
}

export interface DoctorRecommendation {
  doctorId: string;
  matchScore: number;
  reasons: string[];
}

export interface AvailableSlot {
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  remainingSlots: number;
  examinationType: string;
}

export interface DoctorWithRecommendation {
  rank: number;
  doctor: {
    id: string;
    fullName: string;
    specialty: string;
    subSpecialty: string | null;
    professionalTitle: string;
    yearsOfExperience: number;
    consultationFee: number;
    avatar: string | null;
    bio: string;
  };
  matchScore: number;
  matchReasons: string[];
  availableSlots: AvailableSlot[];
}

export type RecommendationResponseType = 'SUGGESTION' | 'NEEDS_MORE_INFO' | 'NO_DATA';

export interface RecommendationResponse {
  success: boolean;
  responseType: RecommendationResponseType;
  followUpQuestion?: string | null;
  suggestedQuestions?: string[];
  data?: {
    analysis: {
      possibleConditions: string[];
      recommendedSpecialties: string[];
      urgencyLevel: string;
    };
    recommendations: DoctorWithRecommendation[];
    disclaimer: string;
  };
}

export interface DoctorContext {
  id: string;
  fullName: string;
  specialty: string;
  subSpecialty: string | null;
  professionalTitle: string;
  yearsOfExperience: number;
  consultationFee: number;
  bio: string;
  educations: string[];
  awards: string[];
  certifications: string[];
  schedules: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    examinationType: string;
  }[];
}

