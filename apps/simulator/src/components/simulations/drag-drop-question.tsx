"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/format";
import { QuestionOption } from "@/lib/types/domain";

type DragDropQuestionProps = {
  prompt: string;
  options: QuestionOption[];
  selectedValues: string[];
  onChange: (newSelectedValues: string[]) => void;
  isLocked: boolean;
  isAnswerRevealed: boolean;
  correctAnswers: string[];
};

export function DragDropQuestion({
  prompt,
  options,
  selectedValues,
  onChange,
  isLocked,
  isAnswerRevealed,
  correctAnswers,
}: DragDropQuestionProps) {
  const [activeOptionId, setActiveOptionId] = useState<string | null>(null); // For tap-to-place on mobile

  // Parse the prompt to find how many dropzones there are and assign them sequential indices
  const dropzoneRegex = /\[DROPZONE_[a-zA-Z0-9_]+\]/g;
  const dropzoneMatches = prompt.match(dropzoneRegex) || [];
  const dropzoneCount = dropzoneMatches.length;

  // Initialize selectedValues to have the correct length, dedupe repeated option IDs,
  // and preserve the first placement order for drag-and-drop answers.
  const currentSelection = selectedValues
    .map((value) => value.trim())
    .filter(Boolean)
    .reduce<string[]>((result, value) => {
      if (!result.includes(value)) {
        result.push(value);
      }
      return result;
    }, []);

  while (currentSelection.length < dropzoneCount) {
    currentSelection.push("");
  }

  if (currentSelection.length > dropzoneCount) {
    currentSelection.length = dropzoneCount;
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (isLocked) return;
    setActiveOptionId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isLocked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const placeOption = (id: string, dropzoneIndex: number) => {
    const newSelection = [...currentSelection];

    for (let i = 0; i < newSelection.length; i += 1) {
      if (newSelection[i] === id) {
        newSelection[i] = "";
      }
    }

    newSelection[dropzoneIndex] = id;
    onChange(newSelection);
    setActiveOptionId(null);
  };

  const handleDrop = (e: React.DragEvent, dropzoneIndex: number) => {
    if (isLocked) return;
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    placeOption(id, dropzoneIndex);
  };

  const handleOptionClick = (id: string) => {
    if (isLocked) return;
    setActiveOptionId((prev) => (prev === id ? null : id));
  };

  const handleDropzoneClick = (dropzoneIndex: number) => {
    if (isLocked) return;
    if (activeOptionId) {
      placeOption(activeOptionId, dropzoneIndex);
      return;
    }

    if (currentSelection[dropzoneIndex]) {
      handleRemove(dropzoneIndex);
    }
  };

  const handleRemove = (dropzoneIndex: number) => {
    if (isLocked) return;
    const newSelection = [...currentSelection];
    newSelection[dropzoneIndex] = "";
    onChange(newSelection);
  };

  // Render prompt with embedded dropzones
  // We use a capturing group to keep the dropzones in the split array
  const parts = prompt.split(/(\[DROPZONE_[a-zA-Z0-9_]+\])/g);

  let preambleHtml = "";
  const interactiveParts = [...parts];

  if (parts.length > 0) {
    const firstPart = parts[0];
    const chunks = firstPart.split(/(<br\s*\/?>|\n|<p>|<\/p>)/i);
    if (chunks.length > 1) {
      interactiveParts[0] = chunks.pop() || "";
      preambleHtml = chunks.join("");
    }
  }

  let currentDropzoneIndex = 0;

  return (
    <div className="space-y-6">
      {activeOptionId && !isLocked && (
        <div className="bg-emerald-900/30 border border-emerald-500/50 text-emerald-200 px-3 py-2 rounded-lg text-sm mb-4 animate-pulse">
          Opção selecionada. Toque em uma área tracejada acima para colocá-la.
        </div>
      )}

      {preambleHtml && (
        <div
          className="text-[#D1D7DD] leading-relaxed text-lg whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: preambleHtml }}
        />
      )}

      <div className="text-[#F8F8F8] leading-relaxed text-lg whitespace-pre-wrap bg-[#1C2023] p-6 rounded-xl border border-[#444] shadow-md">
        {interactiveParts.map((part, index) => {
          const isDropzone = /^\[DROPZONE_[a-zA-Z0-9_]+\]$/.test(part);
          if (isDropzone) {
            const dzIndex = currentDropzoneIndex++;
            const selectedId = currentSelection[dzIndex];
            const option = options.find((o) => o.id === selectedId || o.letter === selectedId);
            const isCorrect = isAnswerRevealed && correctAnswers[dzIndex] === selectedId;
            const isWrong = isAnswerRevealed && selectedId && !isCorrect;

            return (
              <span
                key={index}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, dzIndex)}
                onClick={() => handleDropzoneClick(dzIndex)}
                className={cn(
                  "inline-flex items-center min-w-37.5 min-h-11 px-4 py-1 mx-2 my-1 align-middle rounded-lg border-2 border-dashed bg-[#171819] cursor-pointer transition-all duration-200 shadow-sm",
                  !selectedId && !isLocked ? "border-[#555] hover:border-[#FFD369]" : "",
                  activeOptionId && !selectedId && !isLocked && "border-emerald-500 bg-emerald-900/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]",
                  isCorrect && "border-emerald-500 bg-[#162A20]",
                  isWrong && "border-rose-500 bg-[#2A1616]",
                  isLocked && !isCorrect && !isWrong && "border-[#444] opacity-80"
                )}
              >
                {option ? (
                  <div
                    className={cn(
                      "text-sm p-1 flex items-center justify-between w-full font-medium flex-col",
                      isCorrect ? "text-emerald-300" : isWrong ? "text-rose-300" : "text-[#F8F8F8]"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span dangerouslySetInnerHTML={{ __html: option.text }} className="text-center w-full" />
                      {!isLocked && !isAnswerRevealed && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemove(dzIndex); }}
                          className="ml-3 shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#333] text-[#A2AAB1] hover:bg-rose-500 hover:text-white transition-colors"
                          type="button"shrink-0
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      )}
                    </div>
                    {isAnswerRevealed && (
                      <div className="text-[10px] opacity-60 mt-1 break-all w-full text-center">
                        Selected: {selectedId}<br />
                        Correct: {correctAnswers[dzIndex]}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm font-medium text-[#888] w-full text-center">
                    {activeOptionId ? "Toque para colar" : "Solte aqui"}
                  </span>
                )}
              </span>
            );
          }
          return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        })}
      </div>

      <div className="mt-10 border-t border-[#333] pt-6 bg-[#111315] -mx-6 px-6 pb-6 rounded-b-xl shadow-inner">
        <p className="text-sm font-medium text-[#A2AAB1] mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
          Opções disponíveis (toque para selecionar ou arraste):
        </p>
        <p className="text-xs text-[#888] mb-4 italic">
          *Atenção: Esta é uma questão de correspondência. Cada caixa exige uma opção específica correta para a frase ao lado dela.
        </p>
        <div className="flex flex-wrap gap-3">
          {options.map((option) => {
            const optId = option.id ?? option.letter;
            const isUsed = currentSelection.includes(optId) || currentSelection.includes(option.letter);
            const isActive = activeOptionId === optId;
            const isOptionLocked = isUsed && !isActive;

            return (
              <div
                key={optId}
                draggable={!isLocked && !isOptionLocked}
                onDragStart={(e) => !isLocked && !isOptionLocked && handleDragStart(e, optId)}
                onClick={() => {
                  if (isLocked) return;
                  handleOptionClick(optId);
                }}
                className={cn(
                  "px-4 py-3 rounded-xl border-2 bg-[#1C2023] text-[#F8F8F8] text-sm cursor-pointer select-none transition-all duration-200 grow sm:grow-0 sm:min-w-35 text-center shadow-sm",
                  isLocked ? "cursor-not-allowed opacity-50 border-[#333]" : "hover:border-[#FFD369] hover:-translate-y-0.5 hover:shadow-md",
                  isOptionLocked && !isLocked ? "opacity-60" : "",
                  isActive ? "border-emerald-500 bg-[#162A20] shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-[#444]"
                )}
              >
                <div dangerouslySetInnerHTML={{ __html: option.text }} className="pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
