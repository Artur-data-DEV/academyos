import { z } from "zod";

export const authSchema = z.object({
  email: z.email("E-mail inválido"),
  password: z
    .string()
    .min(6, "A senha precisa ter no mínimo 6 caracteres")
    .max(100, "A senha é muito longa"),
});

export type AuthInput = z.infer<typeof authSchema>;

