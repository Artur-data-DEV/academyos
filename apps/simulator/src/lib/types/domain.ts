import type { Database, TableRow } from "@/lib/types/database";

export type SimulationMode = Database["public"]["Enums"]["simulation_mode"];
export type QuestionStatus = Database["public"]["Enums"]["question_status"];
export type QuestionType = Database["public"]["Enums"]["question_type"];
export type ExamType = Database["public"]["Enums"]["exam_type"];

export type QuestionOption = {
  letter: string;
  text: string;
  id?: string;
};

export type Question = Omit<TableRow<"questions">, "options_json"> & {
  options_json: QuestionOption[];
};

export type UserQuestionStat = TableRow<"user_question_stats">;

export type AdaptiveQuestionCandidate = Pick<
  Question,
  "correct_answer" | "id" | "options_json" | "question" | "topic"
>;

export type CreateSimulationInput = {
  mode: SimulationMode;
  totalQuestions: number;
  topics: string[];
  userId: string;
  exam: ExamType;
  onlyUnseen?: boolean;
};

export type SimulationQuestionAnswerInput = {
  simulationQuestionId: number;
  selectedAnswer: string[];
};

export type TopicPerformance = {
  topic: string;
  total: number;
  correct: number;
  accuracy: number;
};

export type DashboardMetrics = {
  totalSimulations: number;
  overallAccuracy: number;
  strongestTopic: TopicPerformance | null;
  weakestTopic: TopicPerformance | null;
  questionsSeen: number;
  pendingQuestions: number;
  wrongToReview: number;
  topicPerformance: TopicPerformance[];
};

