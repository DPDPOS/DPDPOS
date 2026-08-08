import { z } from "zod";

export const createAssessmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});

export const uploadDocumentSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().min(1),
  extractedText: z.string().optional(),
});

export const mintCliTokenSchema = z.object({
  label: z.string().min(1, "Label is required").max(100),
});
