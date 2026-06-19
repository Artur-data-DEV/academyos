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
