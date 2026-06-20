import { redirect } from "next/navigation";
import { MarkdownText } from "@academyos/ui/markdown";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/server/prisma";
import { ArchitectureCanvas } from "@/components/architecture-canvas";
import { BYOKSettings } from "@/components/byok-settings";

export default async function ArchitectureScenarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  const scenario = await prisma.question.findUnique({
    where: { id },
  });

  if (!scenario || scenario.questionType !== "architecture_design") {
    return (
      <div className="p-8 text-center text-foreground">
        Cenário não encontrado ou não é um desafio de arquitetura.
      </div>
    );
  }

  // O schema das opções foi estruturado no seeder
  const schema = scenario.options as any;
  const layers = schema?.layers || [];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
            <h1 className="text-lg font-semibold text-foreground">
              {scenario.topic} - Decision Simulator
            </h1>
          </div>
          <BYOKSettings />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_500px]">
        <article className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-card-foreground">Business Requirements</h2>
          <MarkdownText content={scenario.content} />
        </article>

        <aside className="flex flex-col gap-6">
          <ArchitectureCanvas
            questionId={scenario.id}
            layers={layers}
          />
        </aside>
      </div>
    </main>
  );
}
