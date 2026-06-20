import Link from "next/link";

import { MODE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDuration, formatPercent } from "@/lib/utils/format";

export default async function HistoryPage() {
  const supabase = await createClient();
  const db = supabase;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: simulations, error } = await db
    .from("simulations")
    .select("*")
    .match({ user_id: user.id, status: "completed" })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Erro ao carregar histórico: ${error.message}`);
  }

  const historyRows = (simulations ?? []) as unknown as Array<{
    id: string;
    created_at: string;
    mode: keyof typeof MODE_LABELS;
    total_questions: number;
    total_correct: number;
    score_percent: number;
    duration_seconds: number;
  }>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#444] bg-[#303031] p-5 ">
        <h2 className="text-xl font-semibold text-[#FFD369]">Histórico de simulados</h2>
        <p className="mt-1 text-sm text-[#D1D7DD]">
          Acompanhe sua evolução sessão por sessão.
        </p>
      </div>

      {historyRows.length ? (
        historyRows.map((simulation) => (
          <Link
            key={simulation.id}
            href={`/simulados/${simulation.id}/resultado`}
            className="block rounded-2xl border border-[#444] bg-[#303031] p-5 transition-colors hover:border-[#FFD369] hover:bg-[#3A3B3D]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#F8F8F8]">
                  {MODE_LABELS[simulation.mode]}
                </p>
                <p className="text-xs text-[#A2AAB1]">{formatDate(simulation.created_at)}</p>
              </div>
              <p className="text-lg font-semibold text-[#F8F8F8]">
                {simulation.total_correct}/{simulation.total_questions}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[#555] bg-[#171819] px-2 py-1 text-[#D1D7DD]">
                Score: {formatPercent(simulation.score_percent)}
              </span>
              <span className="rounded-full border border-[#555] bg-[#171819] px-2 py-1 text-[#D1D7DD]">
                Duração: {formatDuration(simulation.duration_seconds)}
              </span>
            </div>
          </Link>
        ))
      ) : (
        <div className="rounded-2xl border border-[#444] bg-[#303031] p-5 text-sm text-[#D1D7DD]">
          Você ainda não concluiu simulados.
        </div>
      )}
    </div>
  );
}

