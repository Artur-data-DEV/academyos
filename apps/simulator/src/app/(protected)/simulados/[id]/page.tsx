import { notFound, redirect } from "next/navigation";

import { QuizRunner } from "@/components/simulations/quiz-runner";
import { Card } from "@/components/ui/card";
import {
  buildFallbackExplanation,
  normalizeDisplayText,
  parseOptions,
  parseQuestionExplanation,
} from "@/lib/server/mappers";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/types/database";

type Params = Promise<{ id: string }>;

export default async function SimulationRunPage({
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
    .select("id, user_id, status, mode, total_questions, created_at")
    .match({ id, user_id: user.id })
    .single();

  if (simulationError || !simulation) {
    notFound();
  }

  const simulationRow = simulation as {
    id: string;
    user_id: string;
    status: "in_progress" | "completed";
    mode: "balanced" | "review_errors" | "random";
    total_questions: number;
    created_at: string;
  };

  if (simulationRow.status === "completed") {
    redirect(`/simulados/${simulationRow.id}/resultado`);
  }

  const { data: rows, error: rowsError } = await db
    .from("simulation_questions")
    .select(
      "id, simulation_id, position, question_id, selected_answer, correct_answer, topic, question:questions!inner(id, question, question_type, options_json, source_json)",
    )
    .match({ simulation_id: simulationRow.id })
    .order("position", { ascending: true });

  if (rowsError || !rows) {
    throw new Error(rowsError?.message ?? "Erro ao carregar questões do simulado");
  }

  const questionRows = rows as unknown as Array<{
    id: number;
    simulation_id: string;
    position: number;
    question_id: number;
    selected_answer: string[];
    correct_answer: string[];
    topic: string;
    question:
      | {
          id: number;
          question: string;
          question_type: string;
          options_json: Json;
          source_json: Json | null;
        }
      | Array<{
          id: number;
          question: string;
          question_type: string;
          options_json: Json;
          source_json: Json | null;
        }>;
  }>;

  const questions = questionRows.map((row) => {
    const question = Array.isArray(row.question) ? row.question[0] : row.question;
    const options = parseOptions(question?.options_json ?? []);
    const explanation =
      parseQuestionExplanation(question?.source_json) ??
      buildFallbackExplanation(options, row.correct_answer);

    return {
      simulationQuestionId: row.id,
      questionId: row.question_id,
      topic: row.topic,
      prompt: normalizeDisplayText(question?.question),
      questionType: (question?.question_type ?? "single_choice") as "single_choice" | "multi_select" | "drag_and_drop",
      options,
      correctAnswer: row.correct_answer,
      selectedAnswer: row.selected_answer,
      explanation,
    };
  });

  return (
    <div className="space-y-4">
      <div className="hidden md:block">
        <Card>
          <h2 className="text-xl font-semibold text-[#F8F8F8]">Simulado em andamento</h2>
          <p className="mt-1 text-sm text-[#D1D7DD]">
            Responda todas as questões e finalize para gerar o relatório adaptativo.
          </p>
        </Card>
      </div>

      <QuizRunner
        simulationId={simulationRow.id}
        startedAt={simulationRow.created_at}
        questions={questions}
      />
    </div>
  );
}
