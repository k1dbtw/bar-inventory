import { z } from "zod";
import { CATEGORIES, UNITS, WRITE_OFF_REASONS } from "./domain";

export const productInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum(CATEGORIES),
  unit: z.enum(UNITS),
  quantity: z.number().min(0).max(1_000_000),
  lowStockThreshold: z.number().min(0).max(1_000_000),
  expirationDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  notes: z.string().max(500).default(""),
});

export const adjustSchema = z.object({
  delta: z.number().refine((value) => value !== 0, "delta must be non-zero"),
});

export const writeOffSchema = z.object({
  amount: z.number().positive(),
  reason: z.enum(WRITE_OFF_REASONS),
});

export const settingsSchema = z.object({
  timezone: z.string().min(1).max(64).optional(),
  expiringSoonWindowDays: z.number().int().min(1).max(30).optional(),
  expirationReminderDays: z.number().int().min(0).max(30).optional(),
  dailyDigestEnabled: z.boolean().optional(),
  dailyDigestHour: z.number().int().min(0).max(23).optional(),
  lowStockAlertsEnabled: z.boolean().optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
});

export const loginSchema = z.object({
  code: z.string().max(200),
});
