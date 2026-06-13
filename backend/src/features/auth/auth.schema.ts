import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z.string().min(6),
  phone_number: z.string().regex(/^\d{10}$/)
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});