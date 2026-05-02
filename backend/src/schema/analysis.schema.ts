import { z } from "zod/v4";

export const recommendationSchema = z.object({});

export const historyQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be a positive number"),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 50, "Limit must be between 1 and 50"),

  sortBy: z
    .string()
    .optional()
    .default("createdAt")
    .refine((val) => ["createdAt", "result"].includes(val), "Invalid sort field"),

  sortOrder: z
    .string()
    .optional()
    .default("desc")
    .refine(
      (val) => ["asc", "desc"].includes(val),
      "Sort order must be 'asc' or 'desc'",
    ),
});

export const deleteAnalysisParamsSchema = z.object({
  analysisId: z
    .string()
    .min(1, "Analysis ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Analysis ID must be a valid MongoDB ObjectId"),
});
