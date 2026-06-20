import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { createClient } from "@/lib/supabase/server";
import { formatPercent } from "@/lib/utils/format";

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: completedSimulations }, { data: allQuestions }] = await Promise.all([
    supabase.from("simulations").select("id, user_id, status"),
    supabase.from("questions").select("id, topic"),
  ]);

  const completedRowsRaw = (completedSimulations ?? []) as Array<{
    id: string;
    user_id: string;
    status: "completed" | "in_progress";
  }>;
  const completedRows = completedRowsRaw.filter(
    (row) => row.user_id === user.id && row.status === "completed",
  );
  const allQuestionRows = (allQuestions ?? []) as Array<{ id: number; topic: string }>;

  const simulationIds = completedRows.map((simulation) => simulation.id);

  const [simulationQuestionsResult, seenStatsResult] = await Promise.all([
    supabase
      .from("simulation_questions")
      .select("question_id, topic, is_correct, simulation_id"),
    supabase.from("user_question_stats").select("question_id, times_seen, user_id"),
  ]);

  if (simulationQuestionsResult.error) {
    throw new Error(
      `Erro ao carregar estatísticas por tópico: ${simulationQuestionsResult.error.message}`,
    );
  }

  if (seenStatsResult.error) {
    throw new Error(
      `Erro ao carregar cobertura por tópico: ${seenStatsResult.error.message}`,
    );
  }

  const totalByTopic = new Map<string, number>();
  const questionTopicMap = new Map<number, string>();

  for (const question of allQuestionRows) {
    totalByTopic.set(question.topic, (totalByTopic.get(question.topic) ?? 0) + 1);
    questionTopicMap.set(question.id, question.topic);
  }

  const attemptsByTopic = new Map<string, { attempts: number; correct: number }>();

  const simulationIdSet = new Set(simulationIds);

  for (const row of (simulationQuestionsResult.data ?? []) as Array<{
    question_id: number;
    topic: string;
    is_correct: boolean | null;
    simulation_id: string;
  }>) {
    if (!simulationIdSet.has(row.simulation_id)) {
      continue;
    }

    const current = attemptsByTopic.get(row.topic) ?? { attempts: 0, correct: 0 };
    current.attempts += 1;
    current.correct += row.is_correct ? 1 : 0;
    attemptsByTopic.set(row.topic, current);
  }

  const seenByTopic = new Map<string, Set<number>>();

  for (const row of (seenStatsResult.data ?? []) as Array<{
    question_id: number;
    times_seen: number;
    user_id: string;
  }>) {
    if (row.user_id !== user.id || row.times_seen <= 0) {
      continue;
    }

    const topic = questionTopicMap.get(row.question_id);
    if (!topic) continue;

    const topicSeen = seenByTopic.get(topic) ?? new Set<number>();
    topicSeen.add(row.question_id);
    seenByTopic.set(topic, topicSeen);
  }

  const topics = Array.from(totalByTopic.keys());

  const metrics = topics
    .map((topic) => {
      const poolTotal = totalByTopic.get(topic) ?? 0;
      const attempts = attemptsByTopic.get(topic)?.attempts ?? 0;
      const correct = attemptsByTopic.get(topic)?.correct ?? 0;
      const accuracy = attempts ? (correct / attempts) * 100 : 0;
      const seen = seenByTopic.get(topic)?.size ?? 0;
      const coverage = poolTotal ? (seen / poolTotal) * 100 : 0;

      return {
        topic,
        poolTotal,
        attempts,
        correct,
        accuracy,
        seen,
        coverage,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Estatísticas por tópico</CardTitle>
        <CardDescription>
          Visão completa de acurácia e cobertura da sua base de estudo.
        </CardDescription>
      </Card>

      <div className="grid gap-4">
        {metrics.map((metric) => (
          <Card key={metric.topic}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#F8F8F8]">{metric.topic}</h3>
              <div className="flex gap-2">
                <Badge tone={metric.accuracy >= 70 ? "green" : "red"}>
                  Acurácia: {formatPercent(metric.accuracy)}
                </Badge>
                <Badge tone="blue">Cobertura: {formatPercent(metric.coverage)}</Badge>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-[#555] bg-[#171819] p-3 text-sm text-[#D1D7DD]">
                Tentativas: {metric.attempts}
              </div>
              <div className="rounded-xl border border-[#555] bg-[#171819] p-3 text-sm text-[#D1D7DD]">
                Acertos: {metric.correct}
              </div>
              <div className="rounded-xl border border-[#555] bg-[#171819] p-3 text-sm text-[#D1D7DD]">
                Vistas: {metric.seen}/{metric.poolTotal}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-xs text-[#A2AAB1]">Acurácia</div>
              <ProgressBar value={metric.accuracy} />
              <div className="text-xs text-[#A2AAB1]">Cobertura</div>
              <ProgressBar value={metric.coverage} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

