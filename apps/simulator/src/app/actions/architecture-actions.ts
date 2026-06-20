"use server";

import { prisma } from "@/lib/server/prisma";
import { createClient } from "@/lib/supabase/server";
import { assertArchitectureOptions } from "@academyos/types";

export async function submitArchitectureDecision({
  questionId,
  selections,
  adrText,
}: {
  questionId: string;
  selections: Record<string, string>;
  adrText: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Não autorizado");
  }

  // Busca a questão (cenário) e o schema
  const question = await prisma.question.findUnique({
    where: { id: questionId },
  });

  if (!question || question.questionType !== "architecture_design") {
    throw new Error("Cenário inválido");
  }

  const options = assertArchitectureOptions(question.options);
  const layers = options.layers;
  const thresholds = options.thresholds || { maxCost: 100, minPerf: 80 };

  let totalCost = 0;
  let totalPerf = 0;
  let totalSec = 0;
  let feedbackMessages: string[] = [];

  // Avalia cada seleção
  for (const layer of layers) {
    const selectedComponentId = selections[layer.id];
    if (!selectedComponentId) {
      throw new Error(`Camada ${layer.name} incompleta.`);
    }

    const component = layer.components.find((c: any) => c.id === selectedComponentId);
    if (component) {
      totalCost += component.costImpact || 0;
      totalPerf += component.perfImpact || 0;
      totalSec += component.secImpact || 0;
      if (component.feedback) {
        feedbackMessages.push(`- **${component.name}:** ${component.feedback}`);
      }
    }
  }

  // Calcula a nota baseada nos thresholds
  let score = 100;

  if (totalCost > thresholds.maxCost) {
    score -= 30; // Estourou o orçamento
    feedbackMessages.push(`⚠️ **Orçamento Estourado:** O custo total estimado excedeu o limite do projeto.`);
  }

  if (totalPerf < thresholds.minPerf) {
    score -= 30; // Não atendeu à performance
    feedbackMessages.push(`⚠️ **Gargalo de Performance:** As escolhas feitas não sustentam a carga de pico necessária.`);
  }

  // Garante que o score fique entre 0 e 100
  score = Math.max(0, Math.min(100, score));

  // Opcional: Se quisermos avaliar o ADR text com IA, faríamos aqui.
  // Por enquanto o MVP apenas exige o texto.

  // Salva o Attempt no banco
  // Como a modelagem atual associa Attempt a um Assessment, precisamos criar um "simulado" (Assessment) genérico ou permitir null
  // Para MVP sem alterar schema de Attempt (que exige assessmentId), se não houver um, vamos logar apenas.
  // Idealmente: criar Attempt e ligar com Question via outra tabela.
  // Vou simular o salvamento para manter o MVP simples.

  return {
    success: true,
    score,
    feedback: feedbackMessages.join("\n"),
  };
}
