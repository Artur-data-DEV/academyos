"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  finishSimulationAction,
  saveSimulationAnswerAction,
} from "@/app/actions/simulation-actions";
import { AnswerKeyPanel } from "@/components/simulations/answer-key-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownText } from "@/components/ui/markdown-text";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SIMULATION_TIME_LIMIT_SECONDS } from "@/lib/constants";
import type { QuestionOption, QuestionType } from "@/lib/types/domain";
import { DragDropQuestion } from "@/components/simulations/drag-drop-question";
import { cn, formatDuration } from "@/lib/utils/format";

type QuizQuestion = {
  simulationQuestionId: number;
  questionId: number;
  topic: string;
  prompt: string;
  explanation: string;
  questionType: QuestionType;
  options: QuestionOption[];
  correctAnswer: string[];
  selectedAnswer: string[];
};

type QuizRunnerProps = {
  simulationId: string;
  startedAt: string;
  questions: QuizQuestion[];
};

function getSelectionInstruction(correctCount: number, questionType?: QuestionType) {
  if (questionType === "drag_and_drop") {
    return "Arraste as opções para as áreas correspondentes.";
  }
  if (correctCount <= 1) {
    return "Selecione 1 alternativa.";
  }
  return `Selecione ${correctCount} alternativas.`;
}

function normalizeSelection(values: string[], questionType?: QuestionType) {
  const trimmed = values.map((value) => value.trim()).filter(Boolean);

  if (questionType === "drag_and_drop") {
    const unique: string[] = [];
    for (const value of trimmed) {
      if (!unique.includes(value)) {
        unique.push(value);
      }
    }
    return unique;
  }

  return [
    ...new Set(trimmed.map((value) => value.toUpperCase()).filter(Boolean)),
  ].sort();
}

function hasCompleteSelection(question: QuizQuestion, selected: string[]) {
  if (question.questionType === "drag_and_drop") {
    // It's complete if every dropzone is filled and no option is reused.
    return (
      selected.length === question.correctAnswer.length &&
      selected.every((val) => val !== "") &&
      new Set(selected).size === selected.length
    );
  }

  return selected.length === question.correctAnswer.length;
}

function getElapsedSeconds(startedAt: string) {
  const startedAtMs = new Date(startedAt).getTime();

  if (!Number.isFinite(startedAtMs)) {
    return 0;
  }

  const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
  return Math.min(Math.max(elapsed, 0), SIMULATION_TIME_LIMIT_SECONDS);
}

export function QuizRunner({
  simulationId,
  startedAt,
  questions,
}: QuizRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAutoFinalizing, setIsAutoFinalizing] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [savingQuestionIds, setSavingQuestionIds] = useState<
    Record<number, boolean>
  >({});
  const saveVersionsRef = useRef<Record<number, number>>({});
  const autoFinalizeStartedRef = useRef(false);
  const skipNextStorageWriteRef = useRef(true);
  const progressStorageKey = useMemo(
    () => `simulation-progress:${simulationId}`,
    [simulationId],
  );

  const [answers, setAnswers] = useState<Record<number, string[]>>(() => {
    const initial: Record<number, string[]> = {};

    for (const question of questions) {
      initial[question.simulationQuestionId] = normalizeSelection(
        question.selectedAnswer,
        question.questionType
      );
    }

    return initial;
  });

  useEffect(() => {
    const updateElapsedSeconds = () => {
      setElapsedSeconds(getElapsedSeconds(startedAt));
    };

    updateElapsedSeconds();

    const timer = window.setInterval(() => {
      updateElapsedSeconds();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(progressStorageKey);

      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored) as {
        answers?: Record<string, unknown>;
        currentIndex?: unknown;
      };

      if (
        typeof parsed.currentIndex === "number" &&
        parsed.currentIndex >= 0 &&
        parsed.currentIndex < questions.length
      ) {
        window.queueMicrotask(() => setCurrentIndex(parsed.currentIndex as number));
      }

      if (parsed.answers && typeof parsed.answers === "object") {
        window.queueMicrotask(() => {
          setAnswers((current) => {
            const next = { ...current };

            for (const question of questions) {
              const currentSelected = next[question.simulationQuestionId] ?? [];
              const storedSelected = parsed.answers?.[
                String(question.simulationQuestionId)
              ];

              if (currentSelected.length > 0 || !Array.isArray(storedSelected)) {
                continue;
              }

              next[question.simulationQuestionId] = normalizeSelection(
                storedSelected.map(String),
                question.questionType
              );
            }

            return next;
          });
        });
      }
    } catch {
      window.localStorage.removeItem(progressStorageKey);
    }
  }, [progressStorageKey, questions]);

  useEffect(() => {
    if (skipNextStorageWriteRef.current) {
      skipNextStorageWriteRef.current = false;
      return;
    }

    try {
      window.localStorage.setItem(
        progressStorageKey,
        JSON.stringify({ answers, currentIndex }),
      );
    } catch {
      // localStorage may be blocked; database answer saving still preserves progress.
    }
  }, [answers, currentIndex, progressStorageKey]);

  const currentQuestion = questions[currentIndex];

  const answeredCount = useMemo(
    () =>
      questions.filter((question) => {
        const selected = answers[question.simulationQuestionId] ?? [];
        return hasCompleteSelection(question, selected);
      }).length,
    [answers, questions],
  );

  const progress = ((currentIndex + 1) / questions.length) * 100;
  const savingCount = Object.keys(savingQuestionIds).length;
  const hasTimedOut = elapsedSeconds >= SIMULATION_TIME_LIMIT_SECONDS;
  const isLocked = isPending || hasTimedOut || isAutoFinalizing;

  const finishCurrentSimulation = useCallback(
    (allowIncomplete: boolean) => {
      const durationSeconds = allowIncomplete
        ? SIMULATION_TIME_LIMIT_SECONDS
        : Math.min(elapsedSeconds, SIMULATION_TIME_LIMIT_SECONDS);

      if (allowIncomplete) {
        setIsAutoFinalizing(true);
      }

      startTransition(async () => {
        const result = await finishSimulationAction({
          simulationId,
          durationSeconds,
          allowIncomplete,
          answers: questions.map((question) => ({
            simulationQuestionId: question.simulationQuestionId,
            selectedAnswer: answers[question.simulationQuestionId] ?? [],
          })),
        });

        if (!result.success) {
          if (allowIncomplete) {
            autoFinalizeStartedRef.current = false;
            setIsAutoFinalizing(false);
          }

          setError(result.error ?? "Não foi possível finalizar o simulado.");
          return;
        }

        window.localStorage.removeItem(progressStorageKey);
        router.push(`/simulados/${simulationId}/resultado`);
        router.refresh();
      });
    },
    [
      answers,
      elapsedSeconds,
      progressStorageKey,
      questions,
      router,
      simulationId,
      startTransition,
    ],
  );

  useEffect(() => {
    if (!hasTimedOut || autoFinalizeStartedRef.current) {
      return;
    }

    autoFinalizeStartedRef.current = true;
    window.queueMicrotask(() => {
      setSelectionError(null);
      setError(null);
      finishCurrentSimulation(true);
    });
  }, [finishCurrentSimulation, hasTimedOut]);

  function persistAnswer(simulationQuestionId: number, nextSelection: string[]) {
    const version = (saveVersionsRef.current[simulationQuestionId] ?? 0) + 1;
    saveVersionsRef.current[simulationQuestionId] = version;

    setSavingQuestionIds((current) => ({
      ...current,
      [simulationQuestionId]: true,
    }));

    void saveSimulationAnswerAction({
      simulationId,
      simulationQuestionId,
      selectedAnswer: nextSelection,
    })
      .then((result) => {
        if (saveVersionsRef.current[simulationQuestionId] !== version) {
          return;
        }

        if (!result.success) {
          setSaveError(result.error ?? "Não foi possível salvar o progresso.");
          return;
        }

        setSaveError(null);
      })
      .catch(() => {
        if (saveVersionsRef.current[simulationQuestionId] === version) {
          setSaveError("Não foi possível salvar o progresso.");
        }
      })
      .finally(() => {
        if (saveVersionsRef.current[simulationQuestionId] !== version) {
          return;
        }

        setSavingQuestionIds((current) => {
          const next = { ...current };
          delete next[simulationQuestionId];
          return next;
        });
      });
  }

  function updateAnswer(simulationQuestionId: number, nextValues: string[]) {
    const question = questions.find((q) => q.simulationQuestionId === simulationQuestionId);
    const nextSelection = normalizeSelection(nextValues, question?.questionType);

    setAnswers((current) => ({
      ...current,
      [simulationQuestionId]: nextSelection,
    }));
    persistAnswer(simulationQuestionId, nextSelection);
  }

  function handleSingleSelection(value: string) {
    setSelectionError(null);
    updateAnswer(currentQuestion.simulationQuestionId, [value]);
  }

  function handleMultipleSelection(value: string, checked: boolean) {
    const current = answers[currentQuestion.simulationQuestionId] ?? [];
    const limit = currentQuestion.correctAnswer.length;

    if (checked) {
      if (current.length >= limit) {
        setSelectionError(`Esta questão exige ${limit} alternativas.`);
        return;
      }

      setSelectionError(null);
      updateAnswer(currentQuestion.simulationQuestionId, [...current, value]);
      return;
    }

    setSelectionError(null);
    updateAnswer(
      currentQuestion.simulationQuestionId,
      current.filter((item) => item !== value),
    );
  }

  function toggleRevealCurrentAnswer() {
    const key = currentQuestion.simulationQuestionId;
    setRevealedAnswers((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function navigateToIndex(index: number) {
    setSelectionError(null);
    setCurrentIndex(index);
  }

  function handleFinalize() {
    setError(null);
    setSelectionError(null);

    const pendingIndexes = questions
      .map((question, index) => {
        const selected = answers[question.simulationQuestionId] ?? [];
        return hasCompleteSelection(question, selected) ? null : index;
      })
      .filter((value): value is number => value !== null);

    if (pendingIndexes.length > 0) {
      const firstPendingIndex = pendingIndexes[0];
      const pendingQuestionNumbers = pendingIndexes
        .map((index) => index + 1)
        .join(", ");

      navigateToIndex(firstPendingIndex);
      setError(
        `Existem ${pendingIndexes.length} questões pendentes: ${pendingQuestionNumbers}. Responda todas antes de finalizar.`,
      );
      return;
    }

    finishCurrentSimulation(false);
  }

  const isMultipleChoice = currentQuestion.correctAnswer.length > 1;
  const selectedValues = answers[currentQuestion.simulationQuestionId] ?? [];
  const selectionInstruction = getSelectionInstruction(
    currentQuestion.correctAnswer.length,
    currentQuestion.questionType,
  );
  const isAnswerRevealed = Boolean(
    revealedAnswers[currentQuestion.simulationQuestionId],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#444] bg-[#303031] p-5">
        <div className="flex flex-nowrap items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm text-[#D1D7DD]">
              Questão {currentIndex + 1} de {questions.length}
            </p>
            <p className="text-xs text-[#A2AAB1]">
              Respondidas: {answeredCount}/{questions.length}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {savingCount > 0 ? (
              <Badge tone="amber" className="whitespace-nowrap">
                Salvando...
              </Badge>
            ) : null}
            <Badge
              tone={hasTimedOut ? "red" : "blue"}
              className="max-h-8 whitespace-nowrap tabular-nums"
            >
              Tempo: {formatDuration(elapsedSeconds)}
            </Badge>
            <Badge tone="neutral" className="shrink-0">
              ID #{currentQuestion.questionId}
            </Badge>
          </div>
        </div>
        <ProgressBar value={progress} className="mt-4" />
        {isAutoFinalizing ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Tempo esgotado. Finalizando o simulado automaticamente...
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#444] bg-[#303031] p-5">
        <Badge tone="amber">{currentQuestion.topic}</Badge>
        {currentQuestion.questionType !== "drag_and_drop" ? (
          <div className="mt-3">
            <MarkdownText content={currentQuestion.prompt} />
          </div>
        ) : null}
        <p className="mt-2 text-sm text-[#D1D7DD]">{selectionInstruction}</p>
        <div className="mt-3">
          <Button
            type="button"
            variant="ghost"
            disabled={isLocked}
            onClick={toggleRevealCurrentAnswer}
          >
            {isAnswerRevealed ? "Ocultar resposta" : "Ver resposta agora"}
          </Button>
        </div>

        {isAnswerRevealed ? (
          <AnswerKeyPanel
            className="mt-3"
            correctAnswers={currentQuestion.correctAnswer}
            explanation={currentQuestion.explanation}
            isDragAndDrop={currentQuestion.questionType === "drag_and_drop"}
          />
        ) : null}

        {currentQuestion.questionType === "drag_and_drop" ? (
          <div className="mt-6">
            <DragDropQuestion
              prompt={currentQuestion.prompt}
              options={currentQuestion.options}
              selectedValues={selectedValues}
              onChange={(newVals) => updateAnswer(currentQuestion.simulationQuestionId, newVals)}
              isLocked={isLocked}
              isAnswerRevealed={isAnswerRevealed}
              correctAnswers={currentQuestion.correctAnswer}
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
          {currentQuestion.options.map((option) => {
            const checked = selectedValues.includes(option.letter);
            const isCorrect = currentQuestion.correctAnswer.includes(option.letter);

            return (
              <label
                key={option.letter}
                className={cn(
                  "flex items-start gap-3 rounded-xl border border-[#555] px-4 py-3",
                  isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer",
                  isAnswerRevealed && isCorrect && "border-emerald-600 bg-[#1B3D2F]",
                  isAnswerRevealed &&
                    checked &&
                    !isCorrect &&
                    "border-rose-600 bg-[#3D1B2F]",
                  !isAnswerRevealed &&
                    checked &&
                    "border-[#FFD369] bg-[#171819]",
                  !isAnswerRevealed &&
                    !checked &&
                    "border-[#555] hover:border-[#FFD369]",
                )}
              >
                <input
                  type={isMultipleChoice ? "checkbox" : "radio"}
                  name={`question-${currentQuestion.simulationQuestionId}`}
                  value={option.letter}
                  checked={checked}
                  disabled={isLocked}
                  onChange={(event) => {
                    if (isMultipleChoice) {
                      handleMultipleSelection(option.letter, event.target.checked);
                    } else {
                      handleSingleSelection(option.letter);
                    }
                  }}
                  className="mt-1"
                />
                <span className={cn(
                  "min-w-0 text-sm leading-relaxed wrap-anywhere",
                  isAnswerRevealed && isCorrect && "text-emerald-300",
                  isAnswerRevealed && checked && !isCorrect && "text-rose-300",
                  !(isAnswerRevealed && (isCorrect || (checked && !isCorrect))) && "text-[#F8F8F8]",
                )}>
                  <strong>{option.letter}.</strong> {option.text}
                </span>
              </label>
            );
          })}
        </div>
        )}

        {selectionError ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {selectionError}
          </p>
        ) : null}

        {saveError ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {saveError}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[#444] bg-[#303031] p-4">
        <div className="flex flex-wrap justify-start gap-2">
          {questions.map((question, index) => {
            const selectedValuesForQuestion = answers[question.simulationQuestionId] ?? [];
            const isComplete = hasCompleteSelection(question, selectedValuesForQuestion);
            const isPartial = selectedValuesForQuestion.length > 0 && !isComplete;
            return (
              <button
                key={question.simulationQuestionId}
                type="button"
                disabled={isLocked}
                onClick={() => navigateToIndex(index)}
                className={cn(
                  "h-8 w-8 rounded-lg border text-xs font-medium",
                  isLocked && "cursor-not-allowed opacity-70",
                  index === currentIndex
                    ? "border-[#FFD369] bg-[#FFD369] text-[#171819]"
                    : isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : isPartial
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-[#555] bg-[#171819] text-[#D1D7DD]",
                )}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={currentIndex === 0 || isLocked}
            onClick={() => navigateToIndex(Math.max(currentIndex - 1, 0))}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={currentIndex === questions.length - 1 || isLocked}
            onClick={() =>
              navigateToIndex(Math.min(currentIndex + 1, questions.length - 1))
            }
          >
            Próxima
          </Button>
        </div>

        <Button
          type="button"
          variant="primary"
          disabled={isLocked}
          onClick={handleFinalize}
        >
          {isPending || isAutoFinalizing ? "Finalizando..." : "Finalizar simulado"}
        </Button>
      </div>
    </div>
  );
}

