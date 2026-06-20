import { z } from "zod";

export const simulationModeSchema = z.enum([
  "balanced",
  "review_errors",
  "random",
]);

export const examTypeSchema = z.enum(["csa", "cad", "cis_df"]);

export const createSimulationSchema = z.object({
  mode: simulationModeSchema,
  topics: z.array(z.string()).default([]),
  exam: examTypeSchema,
  onlyUnseen: z.boolean().default(false),
});

export const finishSimulationSchema = z.object({
  simulationId: z.uuid("Simulado inválido"),
  durationSeconds: z.number().int().min(0),
  allowIncomplete: z.boolean().default(false),
  answers: z.array(
    z.object({
      simulationQuestionId: z.number().int().positive(),
      selectedAnswer: z.array(z.string()).default([]),
    }),
  ),
});

export const saveSimulationAnswerSchema = z.object({
  simulationId: z.uuid("Simulado inválido"),
  simulationQuestionId: z.number().int().positive(),
  selectedAnswer: z.array(z.string()).default([]),
});

export type CreateSimulationPayload = z.infer<typeof createSimulationSchema>;
export type FinishSimulationPayload = z.infer<typeof finishSimulationSchema>;
export type SaveSimulationAnswerPayload = z.infer<
  typeof saveSimulationAnswerSchema
>;
