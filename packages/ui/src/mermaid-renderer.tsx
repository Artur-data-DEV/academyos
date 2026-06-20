"use client";

import { useEffect, useId, useRef, useState } from "react";

import {
  getDocumentThemeMode,
  getMermaidInitializeOptions,
  type MermaidThemeMode,
} from "./mermaid-config";
import { cn } from "./utils";

type MermaidRendererProps = {
  chart: string;
  className?: string;
};

let mermaidModule: typeof import("mermaid") | null = null;

async function loadMermaid() {
  if (!mermaidModule) {
    mermaidModule = await import("mermaid");
  }
  return mermaidModule.default;
}

export function MermaidRenderer({ chart, className }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/:/g, "");
  const [themeMode, setThemeMode] = useState<MermaidThemeMode>("dark");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    setThemeMode(getDocumentThemeMode());

    const observer = new MutationObserver(() => {
      setThemeMode(getDocumentThemeMode());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const trimmedChart = chart.trim();
    if (!trimmedChart || !containerRef.current) {
      return;
    }

    let cancelled = false;
    const container = containerRef.current;

    const renderChart = async () => {
      setError(null);
      container.innerHTML = "";

      try {
        const mermaid = await loadMermaid();
        mermaid.initialize(getMermaidInitializeOptions(themeMode));

        const { svg, bindFunctions } = await mermaid.render(
          `academyos-mermaid-${reactId}`,
          trimmedChart,
        );

        if (!cancelled) {
          container.innerHTML = svg;
          bindFunctions?.(container);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Falha ao renderizar diagrama Mermaid.";
          setError(message);
          console.error("Mermaid render error:", err);
        }
      }
    };

    renderChart();

    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [chart, reactId, themeMode]);

  if (!chart.trim()) {
    return null;
  }

  if (error) {
    return (
      <div
        className={cn(
          "my-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive",
          className,
        )}
      >
        <p className="font-medium">Diagrama Mermaid inválido</p>
        <p className="mt-1 text-muted-foreground">{error}</p>
        <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted p-3 text-xs text-foreground">
          {chart.trim()}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "mermaid-diagram my-6 flex w-full justify-center overflow-x-auto rounded-lg border border-border bg-card/50 p-4",
        className,
      )}
      aria-label="Diagrama Mermaid"
    />
  );
}
