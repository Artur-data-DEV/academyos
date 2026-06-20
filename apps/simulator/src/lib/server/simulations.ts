import type { SupabaseClient } from "@supabase/supabase-js";

import { selectQuestionsAdaptive } from "@/lib/adaptive/selection";
import { parseOptions } from "@/lib/server/mappers";
import type { Database, TableInsert, TableRow } from "@/lib/types/database";
import type {
  AdaptiveQuestionCandidate,
  CreateSimulationInput,
  SimulationQuestionAnswerInput,
  UserQuestionStat,
} from "@/lib/types/domain";
import { EXAM_BLUEPRINTS } from "@/lib/constants";
import { answersEqual } from "@/lib/utils/format";

export type SupabaseServerClient = SupabaseClient<Database>;

type FinishSimulationInput = {
  simulationId: string;
  userId: string;
  durationSeconds: number;
  allowIncomplete?: boolean;
  answers: SimulationQuestionAnswerInput[];
};

type SaveSimulationAnswerInput = {
  simulationId: string;
  userId: string;
  simulationQuestionId: number;
  selectedAnswer: string[];
};

export async function createAdaptiveSimulation(
  supabase: SupabaseServerClient,
  input: CreateSimulationInput,
) {
  const db = supabase;
  const { mode, totalQuestions, topics, userId, exam, onlyUnseen = false } = input;

  let questionsQuery = db
    .from("questions")
    .select("id, topic, correct_answer, question, options_json")
    .eq("is_active", true)
    .eq("exam", exam)
    .order("id", { ascending: true });

  if (topics.length > 0) {
    questionsQuery = questionsQuery.in("topic", topics);
  }

  const { data: questions, error: questionsError } = await questionsQuery;

  if (questionsError) {
    throw new Error(`Erro ao buscar questões: ${questionsError.message}`);
  }

  const questionRows = (questions ?? []) as Array<{
    id: number;
    topic: string;
    correct_answer: string[];
    question: string;
    options_json: unknown;
  }>;

  if (questionRows.length === 0) {
    throw new Error("Nenhuma questão encontrada para os filtros selecionados.");
  }

  const questionIds = questionRows.map((question) => question.id);
  const { data: stats, error: statsError } = await db
    .from("user_question_stats")
    .select(
      "id, user_id, question_id, status, times_seen, times_correct, times_wrong, last_seen_at, updated_at",
    )
    .eq("user_id", userId)
    .in("question_id", questionIds);

  if (statsError) {
    throw new Error(`Erro ao buscar histórico do usuário: ${statsError.message}`);
  }

  const statsRows = (stats ?? []) as UserQuestionStat[];
  const statsMap = new Map<number, UserQuestionStat>();
  for (const stat of statsRows) {
    statsMap.set(stat.question_id, stat);
  }

  const availableQuestions = onlyUnseen
    ? questionRows.filter((question) => {
        const stat = statsMap.get(question.id);
        return !stat || stat.status === "not_seen";
      })
    : questionRows;

  if (availableQuestions.length === 0) {
    throw new Error(
      onlyUnseen
        ? "Nenhuma questão não vista encontrada para os filtros selecionados."
        : "Nenhuma questão encontrada para os filtros selecionados.",
    );
  }

  if (!onlyUnseen && availableQuestions.length < totalQuestions) {
    throw new Error(
      `Base insuficiente para gerar ${totalQuestions} questões com os filtros selecionados.`,
    );
  }

  const selectedQuestions = selectQuestionsAdaptive({
    questions: availableQuestions.map((question) => ({
      id: question.id,
      topic: question.topic,
      correct_answer: question.correct_answer,
      question: question.question,
      options_json: parseOptions(question.options_json as never),
    })) satisfies AdaptiveQuestionCandidate[],
    mode,
    totalQuestions: onlyUnseen
      ? availableQuestions.length
      : totalQuestions,
    statsByQuestionId: statsMap,
    examWeights: EXAM_BLUEPRINTS[exam]?.weights || {},
  });

  if (selectedQuestions.length === 0) {
    throw new Error("Não foi possível montar um simulado com os critérios selecionados.");
  }

  if (!onlyUnseen && selectedQuestions.length < totalQuestions) {
    throw new Error(
      `Não foi possível montar ${totalQuestions} questões com os critérios selecionados.`,
    );
  }

  const { data: simulation, error: simulationError } = await db
    .from("simulations")
    .insert({
      user_id: userId,
      mode,
      total_questions: selectedQuestions.length,
      topic_filter: topics.length > 0 ? topics : null,
      status: "in_progress",
      exam,
    })
    .select("id")
    .single();

  if (simulationError || !simulation) {
    throw new Error(`Erro ao criar simulado: ${simulationError?.message ?? "desconhecido"}`);
  }

  const simulationRow = simulation as { id: string };

  const rows: TableInsert<"simulation_questions">[] = selectedQuestions.map(
    (question, index) => ({
      simulation_id: simulationRow.id,
      question_id: question.id,
      position: index + 1,
      correct_answer: question.correct_answer,
      topic: question.topic,
      selected_answer: [],
    }),
  );

  const { error: simulationQuestionsError } = await db
    .from("simulation_questions")
    .insert(rows);

  if (simulationQuestionsError) {
    throw new Error(
      `Erro ao salvar questões do simulado: ${simulationQuestionsError.message}`,
    );
  }

  return simulationRow.id;
}

function normalizeAnswerValues(values: string[], questionType?: string) {
  const normalized = values
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (questionType === "single_choice" || questionType === "multi_select") {
    return [
      ...new Set(
        normalized
          .map((value) => value.toUpperCase())
          .filter((value) => /^[A-Z]$/.test(value)),
      ),
    ].sort();
  }

  if (questionType === "drag_and_drop") {
    return normalized.filter((value, index) => normalized.indexOf(value) === index);
  }

  return normalized;
}

function mapAnswersBySimulationQuestion(
  answers: SimulationQuestionAnswerInput[],
): Map<number, string[]> {
  const map = new Map<number, string[]>();

  for (const answer of answers) {
    map.set(
      answer.simulationQuestionId,
      answer.selectedAnswer.map((value) => String(value).trim()).filter(Boolean),
    );
  }

  return map;
}

function hasCompleteSelection(selected: string[], correct: string[], questionType?: string) {
  if (selected.length !== correct.length) {
    return false;
  }

  if (questionType === "drag_and_drop") {
    return selected.every((value) => value !== "") && new Set(selected).size === selected.length;
  }

  return new Set(selected).size === selected.length;
}

function normalizeCorrectAnswerValues(values: unknown, questionType?: string) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized = values.map((value) => String(value).trim()).filter(Boolean);

  if (questionType === "drag_and_drop") {
    return normalized;
  }

  return [...new Set(normalized.map((value) => value.toUpperCase()))].sort();
}

export async function saveSimulationAnswer(
  supabase: SupabaseServerClient,
  input: SaveSimulationAnswerInput,
) {
  const db = supabase;
  const { simulationId, userId, simulationQuestionId, selectedAnswer } = input;

  const { data: simulation, error: simulationError } = await db
    .from("simulations")
    .select("id, user_id, status")
    .eq("id", simulationId)
    .eq("user_id", userId)
    .single();

  if (simulationError || !simulation) {
    throw new Error("Simulado não encontrado.");
  }

  const simulationRow = simulation as {
    id: string;
    user_id: string;
    status: "in_progress" | "completed";
  };

  if (simulationRow.status === "completed") {
    throw new Error("Este simulado já foi finalizado.");
  }

  const { data: simulationQuestion, error: simulationQuestionError } = await db
    .from("simulation_questions")
    .select("id, simulation_id, correct_answer, question:questions!inner(question_type)")
    .eq("id", simulationQuestionId)
    .eq("simulation_id", simulationRow.id)
    .single();

  if (simulationQuestionError || !simulationQuestion) {
    throw new Error("Questão do simulado não encontrada.");
  }

  const simulationQuestionRow = simulationQuestion as {
    id: number;
    simulation_id: string;
    correct_answer: string[];
    question: { question_type: string } | Array<{ question_type: string }>;
  };

  const questionRow = Array.isArray(simulationQuestionRow.question)
    ? simulationQuestionRow.question[0]
    : simulationQuestionRow.question;

  const questionType = questionRow?.question_type;
  const selected = normalizeAnswerValues(selectedAnswer, questionType);
  const correct = normalizeCorrectAnswerValues(
    simulationQuestionRow.correct_answer,
    questionType,
  );

  if (selected.length > correct.length) {
    throw new Error(`Esta questão exige ${correct.length} alternativas.`);
  }

  const isComplete = hasCompleteSelection(selected, correct, questionType);
  const isCorrect = isComplete ? answersEqual(selected, correct) : null;

  const { error: updateError } = await db
    .from("simulation_questions")
    .update({
      selected_answer: selected,
      is_correct: isCorrect,
    })
    .eq("id", simulationQuestionRow.id)
    .eq("simulation_id", simulationRow.id);

  if (updateError) {
    throw new Error(`Erro ao salvar resposta: ${updateError.message}`);
  }

  return {
    selectedAnswer: selected,
    isCorrect,
  };
}

export async function finishSimulation(
  supabase: SupabaseServerClient,
  input: FinishSimulationInput,
) {
  const db = supabase;
  const {
    simulationId,
    userId,
    durationSeconds,
    allowIncomplete = false,
    answers,
  } = input;

  const { data: simulation, error: simulationError } = await db
    .from("simulations")
    .select("id, user_id, status")
    .eq("id", simulationId)
    .eq("user_id", userId)
    .single();

  if (simulationError || !simulation) {
    throw new Error("Simulado não encontrado.");
  }

  const simulationRow = simulation as {
    id: string;
    user_id: string;
    status: "in_progress" | "completed";
  };

  if (simulationRow.status === "completed") {
    return { alreadyCompleted: true };
  }

  const { data: simulationQuestions, error: simulationQuestionsError } = await db
    .from("simulation_questions")
    .select("id, simulation_id, position, question_id, correct_answer, question:questions!inner(question_type)")
    .eq("simulation_id", simulationRow.id);

  if (simulationQuestionsError || !simulationQuestions) {
    throw new Error(
      `Erro ao buscar questões do simulado: ${
        simulationQuestionsError?.message ?? "desconhecido"
      }`,
    );
  }

  const simulationQuestionRows = simulationQuestions as Array<{
    id: number;
    simulation_id: string;
    position: number;
    question_id: number;
    correct_answer: string[];
    question: { question_type: string } | Array<{ question_type: string }>;
  }>;

  const answersMap = mapAnswersBySimulationQuestion(answers);

  const updateRows = simulationQuestionRows.map((row) => {
    const questionRow = Array.isArray(row.question) ? row.question[0] : row.question;
    const questionType = questionRow?.question_type;
    const selected = normalizeAnswerValues(answersMap.get(row.id) ?? [], questionType);
    const correct = normalizeCorrectAnswerValues(row.correct_answer, questionType);

    return {
      id: row.id,
      position: row.position,
      question_id: row.question_id,
      selected_answer: selected,
      correct_answer: correct,
      is_correct: answersEqual(selected, correct),
    };
  });

  const pendingRows = updateRows.filter((row, index) => {
    const questionRow = Array.isArray(simulationQuestionRows[index].question)
      ? simulationQuestionRows[index].question[0]
      : simulationQuestionRows[index].question;

    return !hasCompleteSelection(
      row.selected_answer,
      row.correct_answer,
      questionRow?.question_type,
    );
  });

  if (pendingRows.length > 0 && !allowIncomplete) {
    const pendingPositions = pendingRows
      .map((row) => row.position)
      .sort((a, b) => a - b)
      .join(", ");

    throw new Error(
      `Existem ${pendingRows.length} questões pendentes: ${pendingPositions}. Responda todas antes de finalizar.`,
    );
  }

  for (const row of updateRows) {
    const { error } = await db
      .from("simulation_questions")
      .update({
        selected_answer: row.selected_answer,
        is_correct: row.is_correct,
      })
      .eq("id", row.id)
      .eq("simulation_id", simulationRow.id);

    if (error) {
      throw new Error(`Erro ao salvar respostas: ${error.message}`);
    }
  }

  const totalQuestions = updateRows.length;
  const totalCorrect = updateRows.filter((row) => row.is_correct).length;
  const scorePercent = totalQuestions
    ? Number(((totalCorrect / totalQuestions) * 100).toFixed(2))
    : 0;

  const { error: updateSimulationError } = await db
    .from("simulations")
    .update({
      total_correct: totalCorrect,
      score_percent: scorePercent,
      duration_seconds: durationSeconds,
      status: "completed",
      finished_at: new Date().toISOString(),
    })
    .eq("id", simulationRow.id)
    .eq("user_id", userId);

  if (updateSimulationError) {
    throw new Error(`Erro ao fechar simulado: ${updateSimulationError.message}`);
  }

  const questionIds = updateRows.map((row) => row.question_id);

  const { data: existingStats, error: existingStatsError } = await db
    .from("user_question_stats")
    .select(
      "id, user_id, question_id, status, times_seen, times_correct, times_wrong, last_seen_at, updated_at",
    )
    .eq("user_id", userId)
    .in("question_id", questionIds);

  if (existingStatsError) {
    throw new Error(`Erro ao buscar estatísticas atuais: ${existingStatsError.message}`);
  }

  const existingRows = (existingStats ?? []) as TableRow<"user_question_stats">[];
  const existingMap = new Map<number, TableRow<"user_question_stats">>();
  for (const row of existingRows) {
    existingMap.set(row.question_id, row);
  }

  const now = new Date().toISOString();

  const statsUpdates: TableInsert<"user_question_stats">[] = updateRows.map((row) => {
    const current = existingMap.get(row.question_id);

    const timesSeen = (current?.times_seen ?? 0) + 1;
    const timesCorrect = (current?.times_correct ?? 0) + (row.is_correct ? 1 : 0);
    const timesWrong = (current?.times_wrong ?? 0) + (row.is_correct ? 0 : 1);

    return {
      user_id: userId,
      question_id: row.question_id,
      status: row.is_correct ? "correct" : "wrong",
      times_seen: timesSeen,
      times_correct: timesCorrect,
      times_wrong: timesWrong,
      last_seen_at: now,
      updated_at: now,
    };
  });

  const { error: upsertStatsError } = await db
    .from("user_question_stats")
    .upsert(statsUpdates, { onConflict: "user_id,question_id" });

  if (upsertStatsError) {
    throw new Error(`Erro ao atualizar estatísticas por questão: ${upsertStatsError.message}`);
  }

  return {
    alreadyCompleted: false,
    totalQuestions,
    totalCorrect,
    scorePercent,
  };
}
