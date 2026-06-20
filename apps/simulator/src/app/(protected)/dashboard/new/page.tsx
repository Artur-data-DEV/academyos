import { createSimulationAction } from "@/app/actions/simulation-actions";
import { NewSimulationForm } from "@/components/forms/new-simulation-form";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { SimulationMode } from "@/lib/types/domain";

const CREATE_SIMULATION_ERROR_MESSAGES: Record<string, string> = {
  invalid_parameters: "Parâmetros inválidos para criar o simulado.",
  no_questions:
    "Base de questões vazia para os filtros selecionados. Importe as questões antes de criar o simulado.",
  schema_not_ready:
    "Schema do Supabase não está pronto. Execute supabase/schema.sql e recarregue o cache.",
  simulation_create_failed: "Não foi possível criar o simulado agora.",
};

type SearchParams = Promise<{
  error?: string;
  error_code?: string;
  mode?: string;
}>;

export default async function NewSimulationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: topicsData }, { data: statsRows }] = await Promise.all([
    supabase.from("questions").select("topic, exam").order("topic", { ascending: true }),
    supabase.from("user_question_stats").select("id, user_id, status"),
  ]);

  const topicsByExam = {
    csa: [] as string[],
    cad: [] as string[],
    cis_df: [] as string[],
  };

  for (const row of (topicsData ?? []) as Array<{ topic: string; exam: string }>) {
    if (row.exam && row.exam in topicsByExam) {
      if (!topicsByExam[row.exam as keyof typeof topicsByExam].includes(row.topic)) {
        topicsByExam[row.exam as keyof typeof topicsByExam].push(row.topic);
      }
    }
  }

  const preselectedMode =
    params.mode === "review_errors" ||
    params.mode === "balanced" ||
    params.mode === "random"
      ? (params.mode as SimulationMode)
      : "balanced";

  const errorMessage =
    (params.error_code
      ? CREATE_SIMULATION_ERROR_MESSAGES[params.error_code]
      : undefined) ?? params.error;

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold text-[#F8F8F8]">Criar novo simulado</h2>
        <p className="mt-1 text-sm text-[#D1D7DD]">
          Monte sua próxima sessão com seleção adaptativa por histórico.
        </p>
      </Card>

      {errorMessage ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {params.error_code === "no_questions" ? (
        <Card>
          <p className="text-sm text-[#E5E7EB]">
            Rode <code>npm run import:questions</code> para carregar o arquivo{" "}
            <code>CSA_EXAMTOPICS.json</code> no Supabase.
          </p>
        </Card>
      ) : null}

      <NewSimulationForm
        action={createSimulationAction}
        topicsByExam={topicsByExam}
        wrongQuestionsCount={
          ((statsRows ?? []) as Array<{ status: string }>).filter(
            (row) => row.status === "wrong",
          ).length
        }
        preselectedMode={preselectedMode}
      />
    </div>
  );
}

