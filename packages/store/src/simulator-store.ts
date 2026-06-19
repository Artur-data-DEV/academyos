import { create } from 'zustand';

export type SimulatorState = {
  currentQuestionId: string | null;
  progress: number;
  score: number;
  startSimulation: () => void;
  answerQuestion: (questionId: string, isCorrect: boolean) => void;
  resetSimulation: () => void;
};

export const useSimulatorStore = create<SimulatorState>((set) => ({
  currentQuestionId: null,
  progress: 0,
  score: 0,
  startSimulation: () => set({ progress: 0, score: 0, currentQuestionId: 'start' }),
  answerQuestion: (qId, isCorrect) => set((state) => ({
    progress: Math.min(state.progress + 10, 100),
    score: isCorrect ? state.score + 10 : state.score,
  })),
  resetSimulation: () => set({ progress: 0, score: 0, currentQuestionId: null })
}));
