import { apiClient, BASE_URL } from "@/lib/api/client";
import { useSessionStore } from "@/state/session";
import type {
  AssessmentAuditEvent,
  AssessmentDocument,
  AssessmentReport,
  AssessmentResponse,
  AssessmentVersion,
  CliTokenResponse,
  ConfirmDocumentPayload,
  CreateAssessmentPayload,
  EvaluateResponse,
  ImportQuestionnaireExcelPayload,
  ImportQuestionnaireExcelResponse,
  InitiateDocumentPayload,
  QuestionnaireAnswer,
  QuestionnaireCatalog,
  SaveAnswersPayload,
  ScanJob,
  UploadDocumentPayload,
} from "./types";

/**
 * GET /assessments/questionnaire/template.xlsx — binary xlsx (not JSON envelope).
 */
export async function downloadQuestionnaireTemplate(): Promise<void> {
  const accessToken = useSessionStore.getState().accessToken;
  const res = await fetch(`${BASE_URL}/assessments/questionnaire/template.xlsx`, {
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
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition");
  const match = disposition?.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] ?? "questionnaire-template.xlsx";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const assessmentsApi = {
  list: () => apiClient.get<AssessmentResponse[]>("/assessments"),
  getById: (id: string) =>
    apiClient.get<AssessmentResponse>(`/assessments/${id}`),
  create: (body: CreateAssessmentPayload) =>
    apiClient.post<AssessmentResponse>("/assessments", body),
  questionnaireCatalog: () =>
    apiClient.get<QuestionnaireCatalog>("/assessments/questionnaire/catalog"),
  downloadQuestionnaireTemplate,
  importQuestionnaireExcel: (
    id: string,
    body: ImportQuestionnaireExcelPayload,
  ) =>
    apiClient.post<ImportQuestionnaireExcelResponse>(
      `/assessments/${id}/questionnaire/import`,
      body,
    ),
  listDocuments: (id: string) =>
    apiClient.get<AssessmentDocument[]>(`/assessments/${id}/documents`),
  uploadDocument: (id: string, body: UploadDocumentPayload) =>
    apiClient.post<AssessmentDocument>(`/assessments/${id}/documents`, body),
  initiateDocument: (id: string, body: InitiateDocumentPayload) =>
    apiClient.post<{ document: AssessmentDocument; uploadUrl: string }>(
      `/assessments/${id}/documents/initiate`,
      body,
    ),
  confirmDocument: (
    id: string,
    documentId: string,
    body: ConfirmDocumentPayload,
  ) =>
    apiClient.patch<AssessmentDocument>(
      `/assessments/${id}/documents/${documentId}/confirm`,
      body,
    ),
  downloadDocument: (id: string, documentId: string) =>
    apiClient.get<{ downloadUrl: string; fileName: string; mimeType?: string }>(
      `/assessments/${id}/documents/${documentId}/download`,
    ),
  listAnswers: (id: string) =>
    apiClient.get<QuestionnaireAnswer[]>(
      `/assessments/${id}/questionnaire/answers`,
    ),
  saveAnswers: (id: string, body: SaveAnswersPayload) =>
    apiClient.post<{ saved: number; versionNumber: number }>(
      `/assessments/${id}/questionnaire/answers`,
      body,
    ),
  createCliToken: (id: string, body: { label: string; expiresInDays?: number }) =>
    apiClient.post<CliTokenResponse>(`/assessments/${id}/cli/tokens`, body),
  listScans: (id: string) =>
    apiClient.get<ScanJob[]>(`/assessments/${id}/cli/scans`),
  evaluate: (id: string) =>
    apiClient.post<EvaluateResponse>(`/assessments/${id}/controls/evaluate`, {}),
  getReport: (id: string) =>
    apiClient.get<AssessmentReport>(`/assessments/${id}/report`),
  createVersion: (id: string, body?: { label?: string }) =>
    apiClient.post<AssessmentVersion>(`/assessments/${id}/versions`, body ?? {}),
  listAudit: (id: string) =>
    apiClient.get<AssessmentAuditEvent[]>(`/assessments/${id}/audit`),
};
