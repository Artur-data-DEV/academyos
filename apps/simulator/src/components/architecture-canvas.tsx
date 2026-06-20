"use client";

import { useState } from "react";
import { Button } from "@academyos/ui/button";
import { CheckCircle2, ChevronRight, Save, Loader2 } from "lucide-react";
import { cn } from "@academyos/ui/utils";

import { submitArchitectureDecision } from "@/app/actions/architecture-actions";
import { MarkdownText } from "@academyos/ui/markdown";
import { useAIStore } from "@academyos/store/ai";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";

export type ArchitectureLayer = {
  id: string;
  name: string;
  description: string;
  components: {
    id: string;
    name: string;
    costImpact: number;
    perfImpact: number;
    secImpact: number;
    feedback: string;
  }[];
};

type Props = {
  questionId: string;
  layers: ArchitectureLayer[];
};

export function ArchitectureCanvas({ questionId, layers }: Props) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [adrText, setAdrText] = useState("");
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<any>(null);

  const { provider, apiKey } = useAIStore();

  const { object, submit, isLoading, error } = useObject({
    api: "/api/ai/evaluate-adr",
    schema: z.object({
      score: z.number(),
      costWarning: z.boolean(),
      feedback: z.string(),
    }),
    headers: {
      "x-ai-api-key": apiKey || "",
    },
  });

  const handleSelect = (layerId: string, componentId: string) => {
    setSelections((prev) => ({
      ...prev,
      [layerId]: componentId,
    }));
  };

  const isComplete = layers.every((l) => selections[l.id]) && adrText.length > 20;

  const handleSubmit = async () => {
    if (provider !== "none" && apiKey) {
      // Usa a "Inteligência Artificial Verdadeira" via Vercel AI SDK (Streaming)
      submit({
        selections,
        adrText,
        provider,
      });
    } else {
      // Fallback: Usa o motor matemático "Fake AI" original
      setIsSubmittingLocal(true);
      try {
        const response = await submitArchitectureDecision({
          questionId,
          selections,
          adrText,
        });
        setLocalFeedback({
          score: response.score,
          message: response.feedback,
        });
      } catch (e: any) {
        console.error(e);
        alert(e.message || "Erro ao submeter");
      } finally {
        setIsSubmittingLocal(false);
      }
    }
  };

  // Renderiza a tela de feedback se o modelo local respondeu OU se a IA está carregando/respondeu
  if (localFeedback || isLoading || object || error) {
    const displayScore = localFeedback ? localFeedback.score : object?.score;
    const displayMessage = localFeedback ? localFeedback.message : object?.feedback;

    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-primary/30 bg-primary/5 p-8 text-center shadow-sm">
        {isLoading ? (
          <Loader2 className="mb-4 size-12 animate-spin text-primary" />
        ) : (
          <CheckCircle2 className="mb-4 size-12 text-primary" />
        )}
        
        <h3 className="text-2xl font-bold text-foreground">
          Score: {displayScore !== undefined ? displayScore : "Calculando..."} / 100
        </h3>
        
        {error && <p className="mt-4 text-red-500">{error.message}</p>}
        
        <div className="mt-4 w-full text-left text-sm text-muted-foreground">
          {displayMessage ? (
            <MarkdownText content={displayMessage} />
          ) : (
            <div className="flex animate-pulse space-x-2">
              <div className="h-2 w-2 rounded-full bg-primary/40"></div>
              <div className="h-2 w-2 rounded-full bg-primary/40"></div>
              <div className="h-2 w-2 rounded-full bg-primary/40"></div>
            </div>
          )}
        </div>

        {!isLoading && (
          <Button className="mt-6" onClick={() => (window.location.href = "/dashboard")}>
            Voltar ao Dashboard
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-bold text-card-foreground">Design Canvas</h3>
        <p className="mb-6 text-sm text-muted-foreground">Selecione as tecnologias para cada camada.</p>

        <div className="space-y-6">
          {layers.map((layer) => (
            <div key={layer.id} className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{layer.name}</h4>
                <p className="text-xs text-muted-foreground">{layer.description}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {layer.components.map((comp) => {
                  const isSelected = selections[layer.id] === comp.id;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => handleSelect(layer.id, comp.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all duration-200",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                          : "border-border bg-background hover:border-primary/40 hover:bg-muted/50"
                      )}
                    >
                      <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>
                        {comp.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-bold text-card-foreground">Architecture Decision Record (ADR)</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Justifique resumidamente suas escolhas. Por que essa mensageria? Por que este banco? (Min. 20 caracteres)
        </p>
        <textarea
          value={adrText}
          onChange={(e) => setAdrText(e.target.value)}
          placeholder="A decisão por SQS se dá pelo baixo custo em ociosidade..."
          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <Button
          onClick={handleSubmit}
          disabled={!isComplete || isSubmittingLocal || isLoading}
          className="mt-4 w-full gap-2"
        >
          {(isSubmittingLocal || isLoading) ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analisando trade-offs...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Submeter Arquitetura
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
