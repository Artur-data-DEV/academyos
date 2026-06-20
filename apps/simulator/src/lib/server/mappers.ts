import type { Json } from "@/lib/types/database";
import type { QuestionOption } from "@/lib/types/domain";

export function parseOptions(optionsJson: Json): QuestionOption[] {
  if (!Array.isArray(optionsJson)) {
    return [];
  }

  return optionsJson
    .map((option) => {
      if (!option || typeof option !== "object") {
        return null;
      }

      const letter = String((option as { letra?: string; letter?: string }).letra ?? (option as { letter?: string }).letter ?? "")
        .trim()
        .toUpperCase();
      const text = normalizeText(
        (option as { texto?: string; text?: string }).texto ??
          (option as { text?: string }).text ??
          "",
      );

      const id = String((option as { id?: string | number }).id ?? "");

      if (!letter || !text) {
        return null;
      }

      return { letter, text, ...(id ? { id } : {}) };
    })
    .filter((value): value is QuestionOption => Boolean(value));
}

const htmlEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeHtmlEntities(value: string) {
  return value.replace(/&(#\d+|#[xX][\da-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    const key = String(entity);

    if (key.startsWith("#x") || key.startsWith("#X")) {
      const codePoint = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    if (key.startsWith("#")) {
      const codePoint = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return htmlEntities[key.toLowerCase()] ?? match;
  });
}

export function normalizeDisplayText(value: unknown) {
  return decodeHtmlEntities(String(value ?? ""))
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|li|h[1-6])>/gi, "\n")
    .replace(/<\/?[a-z][^>]*>/gi, " ")
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeText(value: unknown) {
  return normalizeDisplayText(value)
    .replace(/\s+/g, " ")
    .trim();
}

function extractExplanationFromObject(input: Record<string, unknown>): string | null {
  const directKeys = [
    "explanation",
    "explicacao",
    "rationale",
    "justification",
    "justificativa",
    "answer_explanation",
    "why",
  ];

  for (const key of directKeys) {
    const value = normalizeText(input[key]);
    if (value) return value;
  }

  const nestedObjects = Object.values(input).filter(
    (value) => value && typeof value === "object" && !Array.isArray(value),
  ) as Array<Record<string, unknown>>;

  for (const nested of nestedObjects) {
    const nestedValue = extractExplanationFromObject(nested);
    if (nestedValue) return nestedValue;
  }

  return null;
}

export function parseQuestionExplanation(sourceJson: Json | null | undefined): string | null {
  if (!sourceJson || typeof sourceJson !== "object" || Array.isArray(sourceJson)) {
    return null;
  }

  return extractExplanationFromObject(sourceJson as Record<string, unknown>);
}

export function buildFallbackExplanation(
  options: QuestionOption[],
  correctAnswers: string[],
) {
  const optionMap = new Map(options.map((option) => [option.letter, option.text]));

  const parts = correctAnswers.map((letter) => {
    const text = optionMap.get(letter);
    return text ? `${letter}. ${text}` : letter;
  });

  if (parts.length <= 1) {
    return `Gabarito oficial da base: ${parts[0] ?? correctAnswers[0] ?? "alternativa correta"}.`;
  }

  return `Gabarito oficial da base: ${parts.join(" | ")}.`;
}

