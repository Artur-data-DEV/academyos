import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import type { DashboardMetrics, TopicPerformance } from "@/lib/types/domain";

type SupabaseServerClient = SupabaseClient<Database>;

export async function getDashboardMetrics(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<DashboardMetrics> {
  const db = supabase;

  const [{ data: simulations, error: simulationsError }, { data: questionStats, error: questionStatsError }, { count: totalQuestionsCount, error: totalQuestionsError }] =
    await Promise.all([
      db
        .from("simulations")
        .select("id, user_id, score_percent, status")
        .eq("user_id", userId)
        .eq("status", "completed"),
      db
        .from("user_question_stats")
        .select("question_id, user_id, status, times_seen")
        .eq("user_id", userId),
      db
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

  if (simulationsError) {
    throw new Error(`Erro ao carregar simulados: ${simulationsError.message}`);
  }

  if (questionStatsError) {
    throw new Error(`Erro ao carregar estatísticas: ${questionStatsError.message}`);
  }

  if (totalQuestionsError) {
    throw new Error(
      `Erro ao carregar quantidade total de questões: ${totalQuestionsError.message}`,
    );
  }

  const completedSimulations = (simulations ?? []) as unknown as Array<{
    id: string;
    score_percent: number;
    status: "completed";
  }>;
  const userQuestionStats = (questionStats ?? []) as unknown as Array<{
    question_id: number;
    status: "not_seen" | "wrong" | "correct";
    times_seen: number;
  }>;

  const simulationIds = completedSimulations.map((simulation) => simulation.id);

  let topicPerformance: TopicPerformance[] = [];

  if (simulationIds.length > 0) {
    const { data: simulationQuestions, error: simulationQuestionsError } = await db
      .from("simulation_questions")
      .select("topic, is_correct, simulation_id")
      .in("simulation_id", simulationIds);

    if (simulationQuestionsError) {
      throw new Error(
        `Erro ao carregar desempenho por tópico: ${simulationQuestionsError.message}`,
      );
    }

    const topicMap = new Map<string, { total: number; correct: number }>();

    for (const row of (simulationQuestions ?? []) as unknown as Array<{
      topic: string;
      is_correct: boolean | null;
    }>) {
      const current = topicMap.get(row.topic) ?? { total: 0, correct: 0 };
      current.total += 1;
      current.correct += row.is_correct ? 1 : 0;
      topicMap.set(row.topic, current);
    }

    topicPerformance = Array.from(topicMap.entries())
      .map(([topic, values]) => ({
        topic,
        total: values.total,
        correct: values.correct,
        accuracy: values.total ? (values.correct / values.total) * 100 : 0,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
  }

  const totalSimulations = completedSimulations.length;

  const overallAccuracy = totalSimulations
    ? completedSimulations.reduce((acc, simulation) => acc + simulation.score_percent, 0) /
      totalSimulations
    : 0;

  const questionsSeen = userQuestionStats.filter((row) => row.times_seen > 0).length;
  const totalQuestions = totalQuestionsCount ?? 0;

  return {
    totalSimulations,
    overallAccuracy,
    strongestTopic: topicPerformance[0] ?? null,
    weakestTopic: topicPerformance.at(-1) ?? null,
    questionsSeen,
    pendingQuestions: Math.max(totalQuestions - questionsSeen, 0),
    wrongToReview: userQuestionStats.filter((row) => row.status === "wrong").length,
    topicPerformance,
  };
}

