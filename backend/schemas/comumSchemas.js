import { z } from "zod";

// Aceita também os ids fixos do seed (não só UUID)
export const idParamSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Identificador inválido"),
});