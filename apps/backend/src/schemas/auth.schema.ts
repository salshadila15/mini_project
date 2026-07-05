import { z } from 'zod';

// Tentukan kriteria data login yang sah
export const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(6, { message: "Password minimal harus 6 karakter" }),
});