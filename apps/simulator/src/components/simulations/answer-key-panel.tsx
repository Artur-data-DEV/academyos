import { Badge } from "@/components/ui/badge";
import { MarkdownText } from "@/components/ui/markdown-text";
import { cn } from "@/lib/utils/format";

type AnswerKeyPanelProps = {
  className?: string;
  correctAnswers: string[];
  explanation: string;
  isDragAndDrop?: boolean;
};

function formatExplanation(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n\n") // Convert HTML breaks to Markdown paragraphs
    .replace(/<p>/gi, "") // Remove opening paragraph tags
    .replace(/<\/p>/gi, "\n\n") // Convert closing paragraph tags to Markdown paragraphs
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**") // Convert HTML strong tags to Markdown bold
    .replace(/<b>(.*?)<\/b>/gi, "**$1**") // Convert HTML b tags to Markdown bold
    .replace(/\s*(Analysis of Each Option)\s*[-:]?/gi, "\n\n### Analysis of Each Option\n\n")
    .replace(/\s*(Evaluation of Other Options)\s*[-:]?/gi, "\n\n### Evaluation of Other Options\n\n")
    .replace(/\s*(Key Takeaways)\s*[-:]?/gi, "\n\n### Key Takeaways\n\n")
    .replace(/\s*(Correct Answer)\s*[-:]?/gi, "\n\n### Correct Answer\n\n")
    .replace(/\s*(Authoritative Links|References|Resources)\s*[-:]?/gi, "\n\n### $1\n\n")
    .replace(
      /\s*(For further reading|For further information|For more information)\s*[:,]?/gi,
      "\n\n### $1:\n\n",
    )
    .replace(/\s+-\s+(Option [A-H]:)/gi, "\n- **$1** ")
    .replace(/\n(Option [A-H]:)/gi, "\n**$1** ")
    .replace(/([.:])\s*([A-H])\.\s+(?=[A-Z])/g, "$1\n$2. ")
    .replace(/\n{3,}/g, "\n\n") // Collapse multiple newlines into two
    .trim();
}

export function AnswerKeyPanel({
  className,
  correctAnswers,
  explanation,
  isDragAndDrop,
}: AnswerKeyPanelProps) {
  const formattedExplanation = formatExplanation(explanation);

  return (
    <div
      className={cn(
        "rounded-xl border border-emerald-700 bg-[#17271F] p-3",
        className,
      )}
    >
      {!isDragAndDrop && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-emerald-200">Gabarito</span>
          <Badge tone="green">{correctAnswers.join(", ")}</Badge>
        </div>
      )}

      <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-emerald-800 bg-[#101A16] px-3 py-2 text-sm leading-relaxed text-emerald-50 [overflow-wrap:anywhere]">
        <strong className="mb-2 block text-emerald-200">Explicação:</strong>
        <MarkdownText 
          content={formattedExplanation} 
          className="!text-emerald-50 prose-strong:text-emerald-200 prose-h3:text-emerald-200 prose-h3:text-sm prose-h3:mt-4 prose-h3:mb-2 prose-a:text-emerald-300" 
        />
      </div>
    </div>
  );
}
