"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  EXAM_BLUEPRINTS,
  MODE_LABELS,
} from "@/lib/constants";
import type { SimulationMode } from "@/lib/types/domain";
import { cn } from "@/lib/utils/format";

type NewSimulationFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  topicsByExam: Record<string, string[]>;
  wrongQuestionsCount: number;
  preselectedMode?: SimulationMode;
};

const EXAM_LABELS: Record<string, string> = {
  csa: "Certified System Administrator (CSA)",
  cad: "Certified Application Developer (CAD)",
  cis_df: "CIS - Discovery Fundamentals (CIS-DF)",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[#FFD369] px-4 py-3 text-sm font-semibold text-[#171819] transition-colors hover:bg-[#EBB91B] disabled:cursor-not-allowed disabled:bg-[#555] disabled:text-[#D1D7DD] md:w-auto"
    >
      {pending ? "Gerando simulado..." : "Gerar simulado"}
    </button>
  );
}

export function NewSimulationForm({
  action,
  topicsByExam,
  wrongQuestionsCount,
  preselectedMode = "balanced",
}: NewSimulationFormProps) {
  const [mode, setMode] = useState<SimulationMode>(preselectedMode);
  const [exam, setExam] = useState<string>("csa");
  const topics = topicsByExam[exam] || [];

  const reviewHint = useMemo(() => {
    if (mode !== "review_errors") return null;
    if (wrongQuestionsCount === 0) {
      return "Você não tem erros pendentes. O sistema vai completar com questões inéditas.";
    }
    return `Você tem ${wrongQuestionsCount} questão(ões) errada(s) para priorizar.`;
  }, [mode, wrongQuestionsCount]);

  return (
    <form action={action} className="space-y-6">
      <section className="rounded-2xl border border-[#444] bg-[#303031] p-5">
        <h2 className="text-base font-semibold text-[#FFD369]">Qual prova você quer treinar?</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(["csa", "cad", "cis_df"] as const).map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                exam === value
                  ? "border-[#FFD369] bg-[#171819] text-[#FFD369]"
                  : "border-[#555] bg-[#303031] text-[#D1D7DD] hover:border-[#FFD369]",
              )}
            >
              <input
                type="radio"
                name="exam"
                value={value}
                checked={exam === value}
                onChange={() => setExam(value)}
                className="hidden"
              />
              <span className="text-sm font-medium">{EXAM_LABELS[value]}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#444] bg-[#303031] p-5">
        <h2 className="text-base font-semibold text-[#FFD369]">Modo de estudo</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(["balanced", "review_errors", "random"] as const).map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                mode === value
                  ? "border-[#FFD369] bg-[#171819] text-[#FFD369]"
                  : "border-[#555] bg-[#303031] text-[#D1D7DD] hover:border-[#FFD369]",
              )}
            >
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="hidden"
              />
              <span className="text-sm font-medium">{MODE_LABELS[value]}</span>
            </label>
          ))}
        </div>
        {reviewHint ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {reviewHint}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#444] bg-[#303031] p-5">
        <h2 className="text-base font-semibold text-[#FFD369]">Quantidade de questões</h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 rounded-xl border border-[#555] bg-[#171819] px-4 py-3 text-sm text-[#F8F8F8] hover:border-[#FFD369]">
            <input
              type="checkbox"
              name="onlyUnseen"
              className="h-4 w-4 rounded border-[#555] bg-[#0F172A] text-[#FFD369] focus:ring-[#FFD369]"
            />
            Usar apenas questões não vistas (sem mínimo de questões)
          </label>
          <p className="text-sm text-[#D1D7DD]">
            {" "}
            O simulado vai usar todas as questões não vistas disponíveis para o exame e filtros selecionados.
          </p>
        </div>
        <input
          type="hidden"
          name="totalQuestions"
          value={EXAM_BLUEPRINTS[exam]?.totalQuestions || 60}
        />
      </section>

      <section className="rounded-2xl border border-[#444] bg-[#303031] p-5">
        <h2 className="text-base font-semibold text-[#FFD369]">
          Filtrar por tópicos (opcional)
        </h2>
        <p className="mt-1 text-sm text-[#D1D7DD]">
          Se nenhum tópico for marcado, o simulado usa toda a base.
        </p>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {topics.map((topic) => (
            <label
              key={topic}
              className="flex items-center gap-2 rounded-lg border border-[#555] bg-[#171819] px-3 py-2 text-sm text-[#F8F8F8] hover:border-[#FFD369]"
            >
              <input type="checkbox" name="topics" value={topic} />
              {topic}
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

