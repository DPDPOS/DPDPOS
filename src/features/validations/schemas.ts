import { z } from "zod";
import { RULE_CATEGORIES, RULE_SEVERITIES } from "./types";

/**
 * Mirrors createValidationRuleDtoSchema. Empty strings are normalized to
 * undefined on submit so optional fields never send "".
 */
export const validationRuleFormSchema = z.object({
  ruleCode: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(255),
  description: z.string().max(4000).optional(),
  legalBasisRef: z.string().max(255).optional(),
  severity: z.enum(RULE_SEVERITIES).optional(),
  category: z.enum(RULE_CATEGORIES).optional(),
});
export type ValidationRuleFormValues = z.infer<typeof validationRuleFormSchema>;

/** Fields the update DTO accepts (ruleCode + category are immutable). */
export type ValidationRuleEditFormValues = Omit<
  ValidationRuleFormValues,
  "ruleCode" | "category"
>;
