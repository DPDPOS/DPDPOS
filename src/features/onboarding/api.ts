import { BASE_URL, apiClient } from "@/lib/api/client";
import { useSessionStore } from "@/state/session";
import type {
  ImportOnboardingExcelPayload,
  OnboardingAnswersResult,
  OnboardingCompleteResult,
  OnboardingProfilePayload,
  OnboardingProfileResult,
  OnboardingQuestionnaire,
  OnboardingStatus,
  SaveOnboardingAnswersPayload,
} from "./types";

export const onboardingApi = {
  status: () => apiClient.get<OnboardingStatus>("/onboarding/status"),

  questionnaire: () =>
    apiClient.get<OnboardingQuestionnaire>("/onboarding/questionnaire"),

  updateProfile: (body: OnboardingProfilePayload) =>
    apiClient.patch<OnboardingProfileResult>("/onboarding/profile", body),

  saveAnswers: (body: SaveOnboardingAnswersPayload) =>
    apiClient.put<OnboardingAnswersResult>("/onboarding/answers", body),

  importExcel: (body: ImportOnboardingExcelPayload) =>
    apiClient.post<OnboardingAnswersResult>("/onboarding/questionnaire/import", body),

  complete: () => apiClient.post<OnboardingCompleteResult>("/onboarding/complete"),
};

/**
 * GET /onboarding/questionnaire/template.xlsx — streams the workbook (not an
 * envelope), so this bypasses the JSON client and triggers a download.
 */
export async function downloadOnboardingTemplate(): Promise<void> {
  const accessToken = useSessionStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}/onboarding/questionnaire/template.xlsx`, {
    method: "GET",
    headers: {
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Template download failed (HTTP ${res.status})`);
  }

  const disposition = res.headers.get("content-disposition");
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] ?? "dpdpos-onboarding-questionnaire.xlsx";

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
