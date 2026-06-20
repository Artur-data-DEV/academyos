import Link from "next/link";

import { AnswerKeyPanel } from "@/components/simulations/answer-key-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  buildFallbackExplanation,
  normalizeDisplayText,
  parseOptions,
  parseQuestionExplanation,
} from "@/lib/server/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database";

export default async function ReviewErrorsPage() {
  const supabase = await createClient();
  const db = supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: stats, error: statsError } = await db
    .from("user_question_stats")
    .select("question_id, user_id, status, times_seen, times_wrong, updated_at")
    .match({ user_id: user.id, status: "wrong" })
    .order("updated_at", { ascending: false })
    .limit(100);

  if (statsError) {
    throw new Error(`Erro ao carregar revisão de erros: ${statsError.message}`);
  }

  const wrongStats = (stats ?? []) as unknown as Array<{
    question_id: number;
    times_seen: number;
    times_wrong: number;
    updated_at: string;
  }>;

  const questionIds = wrongStats.map((row) => row.question_id);
  const questionIdSet = new Set(questionIds);

  const { data: questions, error: questionsError } = questionIds.length
    ? await db
        .from("questions")
        .select("id, topic, question, options_json, correct_answer, source_json")
        .eq("is_active", true)
    : { data: [], error: null };

  if (questionsError) {
    throw new Error(`Erro ao carregar questões para revisão: ${questionsError.message}`);
  }

  const questionRows = ((questions ?? []) as unknown as Array<{
    id: number;
    topic: string;
    question: string;
    options_json: Json;
    correct_answer: string[];
    source_json: Json | null;
  }>).filter((question) => questionIdSet.has(question.id));

  const questionMap = new Map(questionRows.map((question) => [question.id, question]));

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Revisão de erros</CardTitle>
        <CardDescription>
          Questões em que você ainda apresenta inconsistência. Repetição espaçada aplicada.
        </CardDescription>
      </Card>

      {wrongStats.length === 0 ? (
        <Card>
          <p className="text-sm text-[#D1D7DD]">
            Não há questões erradas pendentes agora. Excelente progresso.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-3 inline-flex rounded-xl bg-[#FFD369] px-4 py-2 text-sm font-medium text-[#171819] transition-colors hover:bg-[#EBB91B]"
          >
            Criar novo simulado
          </Link>
        </Card>
      ) : (
        wrongStats.map((stat) => {
          const question = questionMap.get(stat.question_id);
          if (!question) return null;
          const options = parseOptions(question.options_json);
          const explanation =
            parseQuestionExplanation(question.source_json) ??
            buildFallbackExplanation(options, question.correct_answer);

          return (
            <Card key={stat.question_id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="red">Erros: {stat.times_wrong}</Badge>
                <Badge tone="neutral">Vezes vista: {stat.times_seen}</Badge>
                <Badge tone="amber">{question.topic}</Badge>
              </div>

              <p className="mt-3 text-sm font-semibold leading-relaxed text-[#F8F8F8] [overflow-wrap:anywhere]">
                {normalizeDisplayText(question.question)}
              </p>

              <ul className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-2 text-sm text-[#E5E7EB]">
                {options.map((option) => (
                  <li
                    key={option.letter}
                    className="flex gap-3 rounded-lg border border-[#444] bg-[#252628] px-3 py-2"
                  >
                    <strong className="shrink-0 text-[#FFD369]">
                      {option.letter}.
                    </strong>
                    <span className="min-w-0 leading-relaxed [overflow-wrap:anywhere]">
                      {option.text}
                    </span>
                  </li>
                ))}
              </ul>

              <AnswerKeyPanel
                className="mt-3"
                correctAnswers={question.correct_answer}
                explanation={explanation}
              />
            </Card>
          );
        })
      )}
    </div>
  );
}

