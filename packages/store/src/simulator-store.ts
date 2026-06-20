import { create } from 'zustand';

export type Option = {
  id: string;
  text: string;
};

export type SimulatorQuestion = {
  id: string;
  legacyId?: string | null;
  topic: string;
  questionType: string;
  content: string;
  options: Option[];
  correctAnswers: string[];
  explanation?: string | null;
};

export type SimulatorState = {
  questions: SimulatorQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, string[]>; // questionId -> selectedOptionIds
  isCompleted: boolean;
  
  // Actions
  initSimulation: (questions: SimulatorQuestion[]) => void;
  answerQuestion: (questionId: string, selectedOptions: string[]) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  finishSimulation: () => void;
  resetSimulation: () => void;
};

export const useSimulatorStore = create<SimulatorState>((set) => ({
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  isCompleted: false,

  initSimulation: (questions) => set({ 
    questions, 
    currentQuestionIndex: 0, 
    answers: {}, 
    isCompleted: false 
  }),

  answerQuestion: (questionId, selectedOptions) => set((state) => ({
    answers: { ...state.answers, [questionId]: selectedOptions }
  })),

  nextQuestion: () => set((state) => ({
    currentQuestionIndex: Math.min(state.currentQuestionIndex + 1, state.questions.length - 1)
  })),

  previousQuestion: () => set((state) => ({
    currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0)
  })),

  finishSimulation: () => set({ isCompleted: true }),

  resetSimulation: () => set({ 
    currentQuestionIndex: 0, 
    answers: {}, 
    isCompleted: false 
  })
}));
