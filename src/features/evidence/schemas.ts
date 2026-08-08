import { z } from "zod";

/** Upload drawer — file + description + optional control + tags. */
export const evidenceUploadSchema = z.object({
  description: z
    .string()
    .trim()
    .max(2000, "Keep the description under 2,000 characters.")
    .optional(),
  // Plain string — the select's empty default maps to undefined on submit;
  // the backend validates the UUID shape when one is actually sent.
  controlId: z.string().optional(),
  tagsInput: z
    .string()
    .trim()
    .max(120, "Tags are comma-separated and short.")
    .optional(),
});

export type EvidenceUploadFormValues = z.infer<typeof evidenceUploadSchema>;

/** Tag editor on the detail drawer — replaces the tag set. */
export const evidenceTagSchema = z.object({
  tagsInput: z
    .string()
    .trim()
    .min(1, "Add at least one tag.")
    .max(200, "Tags are comma-separated and short."),
  description: z
    .string()
    .trim()
    .max(2000, "Keep the description under 2,000 characters.")
    .optional(),
});

export type EvidenceTagFormValues = z.infer<typeof evidenceTagSchema>;

/** "a, b, c" → ["a", "b", "c"], deduped, trimmed, empty → []. */
export function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 20);
}
