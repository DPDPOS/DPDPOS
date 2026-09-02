import type { QuestionnaireQuestion, QuestionnaireStage } from "@/features/assessments/types";
import type { OrganizationResponse } from "@/features/organizations/types";

export interface OnboardingStatus {
  completed: boolean;
  completedAt: string | null;
  profileComplete: boolean;
  missingProfileFields: string[];
  requiredAnswerCount: number;
  answeredRequiredCount: number;
  missingQuestionCodes: string[];
  requiresOnboarding: boolean;
}

export interface OnboardingAnswer {
  questionCode: string;
  value: string | boolean | number | null;
  updatedAt: string;
}

export interface OnboardingQuestionnaire {
  questions: QuestionnaireQuestion[];
  stages: QuestionnaireStage[];
  purpose?: string;
  industryDomain?: string | null;
  industryDomainLabel?: string | null;
  industryHint?: string | null;
  industryOptions?: Array<{ value: string; label: string }>;
  answers: OnboardingAnswer[];
  status: OnboardingStatus;
}

export interface OnboardingProfilePayload {
  industry?: string;
  companySize?: string;
  operatingRegion?: string;
  companyType?: string;
  maturityLevel?: string;
  isSignificantDataFiduciary?: boolean;
}

export interface SaveOnboardingAnswersPayload {
  answers: Array<{
    questionCode: string;
    value: string | boolean | number | null;
  }>;
}

export interface ImportOnboardingExcelPayload {
  contentBase64: string;
  fileName?: string;
}

export interface OnboardingProfileResult {
  organization: OrganizationResponse;
  status: OnboardingStatus;
}

export interface OnboardingAnswersResult {
  saved: number;
  status: OnboardingStatus;
}

export interface OnboardingCompleteResult {
  completed: true;
  completedAt: string | null;
  alreadyComplete: boolean;
}
