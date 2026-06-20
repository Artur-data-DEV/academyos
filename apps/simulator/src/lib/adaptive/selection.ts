import { CORRECT_COOLDOWN_DAYS } from "@/lib/constants";
import type {
  AdaptiveQuestionCandidate,
  QuestionStatus,
  UserQuestionStat,
} from "@/lib/types/domain";

type SelectionMode = "balanced" | "review_errors" | "random";

type DecoratedQuestion = AdaptiveQuestionCandidate & {
  priorityRank: number;
};

type SelectionInput = {
  questions: AdaptiveQuestionCandidate[];
  mode: SelectionMode;
  totalQuestions: number;
  statsByQuestionId: Map<number, UserQuestionStat>;
  cooldownDays?: number;
  examWeights: Record<string, number>;
};

function shuffle<T>(values: T[]) {
  const result = [...values];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }

  return result;
}

function normalizeKeyPart(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&[^;]+;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\bchoose\s+(one|two|three|four|five|six)\b/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAnswerTextSignature(question: AdaptiveQuestionCandidate) {
  const optionByLetter = new Map(
    question.options_json.map((option) => [
      option.letter.trim().toUpperCase(),
      normalizeKeyPart(option.text),
    ]),
  );

  const answerTexts = question.correct_answer
    .map((letter) => optionByLetter.get(letter.trim().toUpperCase()))
    .filter((value): value is string => Boolean(value))
    .sort();

  if (answerTexts.length === 0) {
    return question.correct_answer.map((letter) => normalizeKeyPart(letter)).sort().join("|");
  }

  return answerTexts.join("|");
}

function getOptionSetSignature(question: AdaptiveQuestionCandidate) {
  return question.options_json
    .map((option) => normalizeKeyPart(option.text))
    .filter(Boolean)
    .sort()
    .join("|");
}

function getQuestionSignature(question: AdaptiveQuestionCandidate) {
  return normalizeKeyPart(question.question);
}

function getDuplicateKeys(question: AdaptiveQuestionCandidate) {
  const answerSignature = getAnswerTextSignature(question);
  const optionSignature = getOptionSetSignature(question);
  const questionSignature = getQuestionSignature(question);
  const keys: string[] = [];

  if (optionSignature && answerSignature) {
    keys.push(`options:${question.topic}:${optionSignature}:${answerSignature}`);
  }

  if (questionSignature && answerSignature) {
    keys.push(`prompt:${question.topic}:${questionSignature}:${answerSignature}`);
  }

  return keys.length > 0 ? keys : [`id:${question.id}`];
}

function preferDuplicateCandidate(
  current: AdaptiveQuestionCandidate,
  next: AdaptiveQuestionCandidate,
  statsByQuestionId: Map<number, UserQuestionStat>,
  cooldownDays: number,
) {
  const currentRank = getPriorityRank(current, statsByQuestionId, cooldownDays);
  const nextRank = getPriorityRank(next, statsByQuestionId, cooldownDays);

  if (currentRank !== nextRank) {
    return nextRank < currentRank ? next : current;
  }

  const currentHasChoose = /\(choose\s+\w+\)/i.test(current.question);
  const nextHasChoose = /\(choose\s+\w+\)/i.test(next.question);

  if (currentHasChoose !== nextHasChoose) {
    return nextHasChoose ? next : current;
  }

  return next.id < current.id ? next : current;
}

function dedupeQuestionCandidates(
  questions: AdaptiveQuestionCandidate[],
  statsByQuestionId: Map<number, UserQuestionStat>,
  cooldownDays: number,
) {
  const questionByKey = new Map<string, AdaptiveQuestionCandidate>();
  const keysByQuestionId = new Map<number, string[]>();

  for (const question of questions) {
    const keys = getDuplicateKeys(question);
    const existing = keys
      .map((key) => questionByKey.get(key))
      .find((candidate): candidate is AdaptiveQuestionCandidate => Boolean(candidate));

    const selected = existing
      ? preferDuplicateCandidate(existing, question, statsByQuestionId, cooldownDays)
      : question;
    const selectedKeys = new Set([
      ...keys,
      ...(existing ? keysByQuestionId.get(existing.id) ?? [] : []),
    ]);

    keysByQuestionId.set(selected.id, Array.from(selectedKeys));

    for (const key of selectedKeys) {
      questionByKey.set(key, selected);
    }
  }

  return Array.from(new Map(Array.from(questionByKey.values()).map((q) => [q.id, q])).values());
}

function getStatus(
  questionId: number,
  statsByQuestionId: Map<number, UserQuestionStat>,
): QuestionStatus {
  return statsByQuestionId.get(questionId)?.status ?? "not_seen";
}

function isCorrectQuestionInCooldown(
  stat: UserQuestionStat | undefined,
  cooldownDays: number,
) {
  if (!stat || stat.status !== "correct" || !stat.last_seen_at) {
    return false;
  }

  const now = Date.now();
  const lastSeen = new Date(stat.last_seen_at).getTime();
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;

  return now - lastSeen < cooldownMs;
}

function getPriorityRank(
  question: AdaptiveQuestionCandidate,
  statsByQuestionId: Map<number, UserQuestionStat>,
  cooldownDays: number,
) {
  const stat = statsByQuestionId.get(question.id);
  const status = getStatus(question.id, statsByQuestionId);

  if (status === "wrong") return 0;
  if (status === "not_seen") return 1;

  return isCorrectQuestionInCooldown(stat, cooldownDays) ? 3 : 2;
}

function computeProportionalTopicQuotas(
  topicCounts: Map<string, number>,
  totalQuestions: number,
): Map<string, number> {
  const totalAvailable = Array.from(topicCounts.values()).reduce(
    (acc, count) => acc + count,
    0,
  );

  const quotas = new Map<string, number>();
  const fractions: Array<{ topic: string; fraction: number }> = [];

  let allocated = 0;

  for (const [topic, count] of topicCounts.entries()) {
    const exact = totalAvailable === 0 ? 0 : (count / totalAvailable) * totalQuestions;
    const base = Math.min(count, Math.floor(exact));

    quotas.set(topic, base);
    allocated += base;
    fractions.push({ topic, fraction: exact - base });
  }

  let remainder = totalQuestions - allocated;

  fractions
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ topic }) => {
      if (remainder <= 0) return;
      const current = quotas.get(topic) ?? 0;
      const max = topicCounts.get(topic) ?? 0;

      if (current < max) {
        quotas.set(topic, current + 1);
        remainder -= 1;
      }
    });

  while (remainder > 0) {
    let filledInRound = false;

    for (const [topic, max] of topicCounts.entries()) {
      if (remainder <= 0) break;

      const current = quotas.get(topic) ?? 0;
      if (current < max) {
        quotas.set(topic, current + 1);
        remainder -= 1;
        filledInRound = true;
      }
    }

    if (!filledInRound) break;
  }

  return quotas;
}

function computeBlueprintTopicQuotas(
  topicCounts: Map<string, number>,
  totalQuestions: number,
  examWeights: Record<string, number>,
): Map<string, number> {
  const topics = Array.from(topicCounts.keys());
  const hasCompleteBlueprint = topics.every(
    (topic) => examWeights[topic] !== undefined,
  );

  if (!hasCompleteBlueprint) {
    return computeProportionalTopicQuotas(topicCounts, totalQuestions);
  }

  const totalWeight = topics.reduce(
    (sum, topic) => sum + examWeights[topic],
    0,
  );

  if (totalWeight <= 0) {
    return computeProportionalTopicQuotas(topicCounts, totalQuestions);
  }

  const quotas = new Map<string, number>();
  const fractions: Array<{ topic: string; fraction: number }> = [];
  let allocated = 0;

  for (const topic of topics) {
    const max = topicCounts.get(topic) ?? 0;
    const weight = examWeights[topic];
    const exact = (weight / totalWeight) * totalQuestions;
    const base = Math.min(max, Math.floor(exact));

    quotas.set(topic, base);
    allocated += base;
    fractions.push({ topic, fraction: exact - base });
  }

  let remainder = totalQuestions - allocated;

  fractions
    .sort((a, b) => b.fraction - a.fraction)
    .forEach(({ topic }) => {
      if (remainder <= 0) return;
      const current = quotas.get(topic) ?? 0;
      const max = topicCounts.get(topic) ?? 0;

      if (current < max) {
        quotas.set(topic, current + 1);
        remainder -= 1;
      }
    });

  while (remainder > 0) {
    let filledInRound = false;

    for (const topic of topics) {
      if (remainder <= 0) break;
      const current = quotas.get(topic) ?? 0;
      const max = topicCounts.get(topic) ?? 0;

      if (current < max) {
        quotas.set(topic, current + 1);
        remainder -= 1;
        filledInRound = true;
      }
    }

    if (!filledInRound) break;
  }

  return quotas;
}

function pickBalanced(
  questions: AdaptiveQuestionCandidate[],
  totalQuestions: number,
  statsByQuestionId: Map<number, UserQuestionStat>,
  cooldownDays: number,
  examWeights: Record<string, number>,
) {
  const grouped = new Map<string, DecoratedQuestion[]>();

  for (const question of shuffle(questions)) {
    const decorated: DecoratedQuestion = {
      ...question,
      priorityRank: getPriorityRank(question, statsByQuestionId, cooldownDays),
    };

    const topicList = grouped.get(question.topic) ?? [];
    topicList.push(decorated);
    grouped.set(question.topic, topicList);
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => a.priorityRank - b.priorityRank);
  }

  const topicCounts = new Map<string, number>();
  for (const [topic, list] of grouped.entries()) {
    topicCounts.set(topic, list.length);
  }

  const quotas = computeBlueprintTopicQuotas(topicCounts, totalQuestions, examWeights);
  const selected: DecoratedQuestion[] = [];
  const selectedIds = new Set<number>();

  for (const [topic, quota] of quotas.entries()) {
    const list = grouped.get(topic) ?? [];
    for (const candidate of list.slice(0, quota)) {
      if (selectedIds.has(candidate.id)) continue;
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }

  if (selected.length < totalQuestions) {
    const leftovers = Array.from(grouped.values())
      .flat()
      .filter((candidate) => !selectedIds.has(candidate.id));

    leftovers.sort((a, b) => a.priorityRank - b.priorityRank);

    for (const candidate of leftovers) {
      if (selected.length >= totalQuestions) break;
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }

  return selected.slice(0, totalQuestions);
}

function pickRandomByBlueprint(
  questions: AdaptiveQuestionCandidate[],
  totalQuestions: number,
  examWeights: Record<string, number>,
) {
  const grouped = new Map<string, AdaptiveQuestionCandidate[]>();

  for (const question of shuffle(questions)) {
    const topicList = grouped.get(question.topic) ?? [];
    topicList.push(question);
    grouped.set(question.topic, topicList);
  }

  const topicCounts = new Map<string, number>();
  for (const [topic, list] of grouped.entries()) {
    topicCounts.set(topic, list.length);
  }

  const quotas = computeBlueprintTopicQuotas(topicCounts, totalQuestions, examWeights);
  const selected: AdaptiveQuestionCandidate[] = [];
  const selectedIds = new Set<number>();

  for (const [topic, quota] of quotas.entries()) {
    const list = shuffle(grouped.get(topic) ?? []);

    for (const candidate of list.slice(0, quota)) {
      if (selectedIds.has(candidate.id)) continue;
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }

  if (selected.length < totalQuestions) {
    const leftovers = shuffle(
      Array.from(grouped.values())
        .flat()
        .filter((candidate) => !selectedIds.has(candidate.id)),
    );

    for (const candidate of leftovers) {
      if (selected.length >= totalQuestions) break;
      selected.push(candidate);
      selectedIds.add(candidate.id);
    }
  }

  return selected.slice(0, totalQuestions);
}

export function selectQuestionsAdaptive({
  questions,
  mode,
  totalQuestions,
  statsByQuestionId,
  cooldownDays = CORRECT_COOLDOWN_DAYS,
  examWeights,
}: SelectionInput): AdaptiveQuestionCandidate[] {
  const uniqueQuestions = dedupeQuestionCandidates(
    questions,
    statsByQuestionId,
    cooldownDays,
  );

  if (uniqueQuestions.length <= totalQuestions) {
    return shuffle(uniqueQuestions).slice(0, totalQuestions);
  }

  if (mode === "random") {
    return pickRandomByBlueprint(uniqueQuestions, totalQuestions, examWeights);
  }

  if (mode === "review_errors") {
    return pickBalanced(uniqueQuestions, totalQuestions, statsByQuestionId, cooldownDays, examWeights);
  }

  return pickBalanced(uniqueQuestions, totalQuestions, statsByQuestionId, cooldownDays, examWeights);
}

