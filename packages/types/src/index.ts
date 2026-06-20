// Aqui centralizamos os tipos customizados e payloads que trafegam entre lms e simulator.
import { type Assessment, type Attempt, type Question } from '@academyos/database';

export interface QuestionPayload {
  id: string;
  content: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect?: boolean; // Oculto dependendo do contexto
  }>;
}

export interface AttemptResult {
  attemptId: string;
  assessmentId: string;
  score: number;
  passed: boolean;
  completedAt: Date;
}

export type { Assessment, Attempt, Question };

export interface ArchitectureComponent {
  id: string;
  name: string;
  costImpact?: number;
  perfImpact?: number;
  secImpact?: number;
  feedback?: string;
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  components: ArchitectureComponent[];
}

export interface ArchitectureThresholds {
  maxCost: number;
  minPerf: number;
}

export interface ArchitectureQuestionOptions {
  layers: ArchitectureLayer[];
  thresholds?: ArchitectureThresholds;
}

export function assertArchitectureOptions(options: any): ArchitectureQuestionOptions {
  if (!options || typeof options !== "object") {
    throw new Error("Opções de arquitetura inválidas: não é um objeto.");
  }
  if (!Array.isArray(options.layers)) {
    throw new Error("Opções de arquitetura inválidas: 'layers' deve ser um array.");
  }
  for (const layer of options.layers) {
    if (!layer.id || !layer.name || !Array.isArray(layer.components)) {
      throw new Error(`Opções de arquitetura inválidas: camada '${layer.name || layer.id}' corrompida.`);
    }
  }
  return options as ArchitectureQuestionOptions;
}
