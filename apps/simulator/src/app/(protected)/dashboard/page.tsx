import Link from "next/link";

import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getDashboardMetrics } from "@/lib/server/dashboard";
import { createClient } from "@/lib/supabase/server";
import { formatPercent } from "@/lib/utils/format";

function SetupRequiredState({ message }: { message: string }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Banco do Supabase não inicializado</CardTitle>
        <CardDescription>
          O app não encontrou as tabelas esperadas no schema público.
        </CardDescription>
      </Card>

      <Card>
        <p className="text-sm text-[#E5E7EB]">Mensagem original:</p>
        <p className="mt-2 rounded-lg bg-[#171819] p-3 font-mono text-xs text-[#E5E7EB]">
          {message}
        </p>

        <div className="mt-4 space-y-2 text-sm text-[#E5E7EB]">
          <p>Para corrigir:</p>
          <p>1. Abra o SQL Editor do seu projeto Supabase.</p>
          <p>
            2. Execute o arquivo <code>supabase/schema.sql</code> deste projeto.
          </p>
          <p>
            3. Se acabou de executar, rode no SQL Editor:
            <code className="ml-1">NOTIFY pgrst, &apos;reload schema&apos;;</code>
          </p>
          <p>
            4. Reinicie o app com <code>npm run dev</code>.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let metrics;

  try {
    metrics = await getDashboardMetrics(supabase, user.id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido no dashboard";
    const isSchemaCacheError =
      message.includes("Could not find the table 'public.") ||
      message.includes("relation") ||
      message.includes("schema cache");

    if (isSchemaCacheError) {
      return <SetupRequiredState message={message} />;
    }

    throw error;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-2 grid-cols-2 md:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Simulados concluídos"
          value={String(metrics.totalSimulations)}
          hint="Sessões finalizadas"
        />
        <StatCard
          label="Taxa de acerto geral"
          value={formatPercent(metrics.overallAccuracy)}
          hint="Média dos simulados"
        />
        <StatCard
          label="Questões vistas"
          value={String(metrics.questionsSeen)}
          hint={`Pendentes: ${metrics.pendingQuestions}`}
        />
        <StatCard
          label="Erros para revisar"
          value={String(metrics.wrongToReview)}
          hint="Prioridade no próximo ciclo"
        />
      </section>

      <section className="grid gap-2 grid-cols-2 md:gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="text-sm md:text-base">Tópico mais forte</CardTitle>
          {metrics.strongestTopic ? (
            <>
              <CardDescription className="text-xs md:text-sm">{metrics.strongestTopic.topic}</CardDescription>
              <p className="mt-2 text-lg font-semibold text-emerald-600 md:mt-3 md:text-2xl md:text-emerald-700">
                {formatPercent(metrics.strongestTopic.accuracy)}
              </p>
            </>
          ) : (
            <CardDescription className="text-xs md:text-sm">Ainda sem dados suficientes.</CardDescription>
          )}
        </Card>

        <Card>
          <CardTitle className="text-sm md:text-base">Tópico mais fraco</CardTitle>
          {metrics.weakestTopic ? (
            <>
              <CardDescription className="text-xs md:text-sm">{metrics.weakestTopic.topic}</CardDescription>
              <p className="mt-2 text-lg font-semibold text-rose-600 md:mt-3 md:text-2xl md:text-rose-700">
                {formatPercent(metrics.weakestTopic.accuracy)}
              </p>
            </>
          ) : (
            <CardDescription className="text-xs md:text-sm">Ainda sem dados suficientes.</CardDescription>
          )}
        </Card>
      </section>

      <section className="grid gap-2 grid-cols-1 md:gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="text-sm md:text-base">Desempenho por tópico</CardTitle>
          <div className="mt-2 space-y-2 md:mt-4 md:space-y-3">
            {metrics.topicPerformance.length === 0 ? (
              <p className="text-xs text-[#D1D7DD] md:text-sm">
                Faça seu primeiro simulado para gerar estatísticas por tópico.
              </p>
            ) : (
              metrics.topicPerformance.map((topic) => (
                <div key={topic.topic} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs md:text-sm">
                    <span className="font-medium text-[#E5E7EB]">{topic.topic}</span>
                    <Badge tone={topic.accuracy >= 70 ? "green" : "red"}>
                      {formatPercent(topic.accuracy)}
                    </Badge>
                  </div>
                  <ProgressBar value={topic.accuracy} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle className="text-sm md:text-base">Ações rápidas</CardTitle>
          <div className="mt-2 grid gap-2 md:mt-4 md:gap-3">
            <Link
              href="/dashboard/new"
              className="rounded-xl border border-[#444] bg-[#303031] px-3 py-2 text-xs font-medium text-[#F8F8F8] transition-colors hover:border-[#FFD369] hover:bg-[#3A3B3D] hover:text-[#FFD369] md:px-4 md:py-3 md:text-sm"
            >
              Criar novo simulado
            </Link>
            <Link
              href="/dashboard/new?mode=review_errors"
              className="rounded-xl border border-[#FFD369] bg-[#171819] px-3 py-2 text-xs font-medium text-[#FFD369] transition-colors hover:border-[#EBB91B] hover:bg-[#303031] md:px-4 md:py-3 md:text-sm"
            >
              Revisão focada em erros
            </Link>
            <Link
              href="/historico"
              className="rounded-xl border border-[#444] bg-[#303031] px-3 py-2 text-xs font-medium text-[#F8F8F8] transition-colors hover:border-[#FFD369] hover:bg-[#3A3B3D] hover:text-[#FFD369] md:px-4 md:py-3 md:text-sm"
            >
              Ver histórico completo
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}

