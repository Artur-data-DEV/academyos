"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAdaptiveSimulation,
  finishSimulation,
  saveSimulationAnswer,
} from "@/lib/server/simulations";
import { EXAM_BLUEPRINTS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import {
  createSimulationSchema,
  finishSimulationSchema,
  saveSimulationAnswerSchema,
} from "@/lib/validation/simulation";

function getRedirectWithParams(
  path: string,
  params: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function mapCreateSimulationErrorToCode(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("nenhuma questao encontrada") ||
    normalized.includes("nenhuma questão encontrada")
  ) {
    return "no_questions";
  }

  if (normalized.includes("base insuficiente")) {
    return "no_questions";
  }

  if (
    normalized.includes("nao foi possivel montar 60") ||
    normalized.includes("não foi possível montar 60")
  ) {
    return "no_questions";
  }

  if (normalized.includes("could not find the table 'public.questions'")) {
    return "schema_not_ready";
  }

  if (normalized.includes("schema cache")) {
    return "schema_not_ready";
  }

  if (normalized.includes("param")) {
    return "invalid_parameters";
  }

  return "simulation_create_failed";
}

export async function createSimulationAction(formData: FormData) {
  const payload = {
    mode: String(formData.get("mode") ?? ""),
    exam: String(formData.get("exam") ?? "csa"),
    topics: formData
      .getAll("topics")
      .map((topic) => String(topic).trim())
      .filter(Boolean),
    onlyUnseen: Boolean(formData.get("onlyUnseen")),
  };

  const parsed = createSimulationSchema.safeParse(payload);

  if (!parsed.success) {
    redirect(
      getRedirectWithParams("/dashboard/new", {
        error_code: "invalid_parameters",
        mode: payload.mode || undefined,
      }),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let simulationId: string;

  try {
    const totalQuestions = EXAM_BLUEPRINTS[parsed.data.exam]?.totalQuestions || 60;

    simulationId = await createAdaptiveSimulation(supabase, {
      mode: parsed.data.mode,
      exam: parsed.data.exam,
      topics: parsed.data.topics,
      totalQuestions,
      onlyUnseen: parsed.data.onlyUnseen,
      userId: user.id,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível criar o simulado.";
    const errorCode = mapCreateSimulationErrorToCode(message);

    redirect(
      getRedirectWithParams("/dashboard/new", {
        error_code: errorCode,
        mode: parsed.data.mode,
      }),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/historico");

  redirect(`/simulados/${simulationId}`);
}

export async function finishSimulationAction(input: {
  simulationId: string;
  durationSeconds: number;
  allowIncomplete?: boolean;
  answers: Array<{ simulationQuestionId: number; selectedAnswer: string[] }>;
}) {
  const parsed = finishSimulationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Payload inválido",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    await finishSimulation(supabase, {
      ...parsed.data,
      userId: user.id,
    });

    revalidatePath("/dashboard");
    revalidatePath("/historico");
    revalidatePath("/estatisticas");
    revalidatePath("/revisao-erros");
    revalidatePath(`/simulados/${parsed.data.simulationId}`);
    revalidatePath(`/simulados/${parsed.data.simulationId}/resultado`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível finalizar o simulado.",
    };
  }
}

export async function saveSimulationAnswerAction(input: {
  simulationId: string;
  simulationQuestionId: number;
  selectedAnswer: string[];
}) {
  const parsed = saveSimulationAnswerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Payload inválido",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  try {
    await saveSimulationAnswer(supabase, {
      ...parsed.data,
      userId: user.id,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a resposta.",
    };
  }
}
