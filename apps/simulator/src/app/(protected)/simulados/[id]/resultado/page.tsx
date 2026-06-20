import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AnswerKeyPanel } from "@/components/simulations/answer-key-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  buildFallbackExplanation,
  normalizeDisplayText,
  parseOptions,
  parseQuestionExplanation,
} from "@/lib/server/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database";
import { formatDate, formatDuration, formatPercent } from "@/lib/utils/format";

type Params = Promise<{ id: string }>;

export default async function SimulationResultPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: simulation, error: simulationError } = await db
    .from("simulations")
    .select(
      "id, user_id, mode, status, total_questions, total_correct, score_percent, duration_seconds, created_at",
    )
    .match({ id, user_id: user.id })
    .single();

  if (simulationError || !simulation) {
    notFound();
  }

  const simulationRow = simulation as {
    id: string;
    user_id: string;
    mode: "balanced" | "review_errors" | "random";
    status: "in_progress" | "completed";
    total_questions: number;
    total_correct: number;
    score_percent: number;
    duration_seconds: number;
    created_at: string;
  };

  if (simulationRow.status !== "completed") {
    redirect(`/simulados/${simulationRow.id}`);
  }

  const { data: rows, error: rowsError } = await db
    .from("simulation_questions")
    .select(
      "id, simulation_id, topic, is_correct, selected_answer, correct_answer, question:questions!inner(question, options_json, source_json)",
    )
    .match({ simulation_id: simulationRow.id })
    .order("id", { ascending: true });

  if (rowsError || !rows) {
    throw new Error(rowsError?.message ?? "Erro ao carregar resultado");
  }

  const questionRows = rows as unknown as Array<{
    id: number;
    simulation_id: string;
    topic: string;
    is_correct: boolean | null;
    selected_answer: string[];
    correct_answer: string[];
    question:
      | {
          question: string;
          options_json: Json;
          source_json: Json | null;
        }
      | Array<{
          question: string;
          options_json: Json;
          source_json: Json | null;
        }>;
  }>;

  const topicMap = new Map<string, { total: number; correct: number }>();

  for (const row of questionRows) {
    const topicStats = topicMap.get(row.topic) ?? { total: 0, correct: 0 };
    topicStats.total += 1;
    topicStats.correct += row.is_correct ? 1 : 0;
    topicMap.set(row.topic, topicStats);
  }

  const topicPerformance = Array.from(topicMap.entries()).map(([topic, values]) => ({
    topic,
    total: values.total,
    correct: values.correct,
    accuracy: values.total ? (values.correct / values.total) * 100 : 0,
  }));

  const wrongQuestions = questionRows.filter((row) => !row.is_correct);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardTitle>Nota</CardTitle>
          <CardDescription>
            {simulationRow.total_correct}/{simulationRow.total_questions}
          </CardDescription>
        </Card>
        <Card>
          <CardTitle>Percentual</CardTitle>
          <CardDescription>{formatPercent(simulationRow.score_percent)}</CardDescription>
        </Card>
        <Card>
          <CardTitle>Duração</CardTitle>
          <CardDescription>{formatDuration(simulationRow.duration_seconds)}</CardDescription>
        </Card>
        <Card>
          <CardTitle>Finalizado em</CardTitle>
          <CardDescription>{formatDate(simulationRow.created_at)}</CardDescription>
        </Card>
      </section>

      <Card>
        <CardTitle>Desempenho por tópico</CardTitle>
        <div className="mt-4 space-y-3">
          {topicPerformance.map((topic) => (
            <div key={topic.topic} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#E5E7EB]">{topic.topic}</span>
                <Badge tone={topic.accuracy >= 70 ? "green" : "red"}>
                  {formatPercent(topic.accuracy)}
                </Badge>
              </div>
              <ProgressBar value={topic.accuracy} />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Questões erradas</CardTitle>
        <div className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-2">
          {wrongQuestions.length === 0 ? (
            <p className="text-sm text-emerald-300">
              Excelente. Nenhuma questão errada neste simulado.
            </p>
          ) : (
            wrongQuestions.map((row) => {
              const question = Array.isArray(row.question)
                ? row.question[0]
                : row.question;
              const options = parseOptions(question?.options_json ?? []);
              const explanation =
                parseQuestionExplanation(question?.source_json) ??
                buildFallbackExplanation(options, row.correct_answer);

              return (
                <article
                  key={row.id}
                  className="border-t border-[#444] pt-4 first:border-t-0 first:pt-0"
                >
                  <p className="text-sm font-semibold leading-relaxed text-[#F8F8F8] [overflow-wrap:anywhere]">
                    {normalizeDisplayText(question?.question)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone="red">
                      Sua resposta: {row.selected_answer.join(", ") || "Não respondida"}
                    </Badge>
                    <Badge tone="green">
                      Gabarito: {row.correct_answer.join(", ")}
                    </Badge>
                    <Badge tone="amber">{row.topic}</Badge>
                  </div>
                  <ul className="mt-3 grid gap-2 text-sm text-[#E5E7EB]">
                    {options.map((option) => {
                      const isCorrect = row.correct_answer.includes(option.letter);
                      const isSelected = row.selected_answer.includes(option.letter);

                      return (
                        <li
                          key={option.letter}
                          className={`flex gap-3 rounded-lg border px-3 py-2 ${
                            isCorrect
                              ? "border-emerald-700 bg-[#17271F] text-emerald-100"
                              : isSelected
                                ? "border-rose-700 bg-[#2A171D] text-rose-100"
                                : "border-[#444] bg-[#252628]"
                          }`}
                        >
                          <strong className="shrink-0 text-[#FFD369]">
                            {option.letter}.
                          </strong>
                          <span className="min-w-0 leading-relaxed [overflow-wrap:anywhere]">
                            {option.text}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <AnswerKeyPanel
                    className="mt-3"
                    correctAnswers={row.correct_answer}
                    explanation={explanation}
                  />
                </article>
              );
            })
          )}
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/new?mode=review_errors"
          className="rounded-xl bg-[#FFD369] px-4 py-2 text-sm font-medium text-[#171819] transition-colors hover:bg-[#EBB91B]"
        >
          Revisar erros agora
        </Link>
        <Link
          href="/historico"
          className="rounded-xl border border-[#444] bg-[#303031] px-4 py-2 text-sm font-medium text-[#F8F8F8] transition-colors hover:border-[#FFD369] hover:bg-[#3A3B3D] hover:text-[#FFD369]"
        >
          Ver histórico
        </Link>
      </div>
    </div>
  );
}

