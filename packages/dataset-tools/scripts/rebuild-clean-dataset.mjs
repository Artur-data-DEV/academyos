#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function getCliArg(name) {
  const index = process.argv.findIndex((arg) => arg === name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLetter(value) {
  const normalized = normalizeText(value).toUpperCase();
  return /^[A-Z]$/.test(normalized) ? normalized : "";
}

function parseCorrectAnswersFromRaw(rawValue) {
  const raw = normalizeText(rawValue);
  if (!raw) return [];
  const matches = raw.match(/\b([A-Z])\./g) ?? [];
  return [
    ...new Set(matches.map((item) => item.replace(".", "").trim().toUpperCase())),
  ].sort();
}

function sanitizeOptions(options) {
  if (!Array.isArray(options)) return [];
  const byLetter = new Map();

  for (const option of options) {
    const letter = normalizeLetter(option?.letra ?? option?.letter);
    const text = normalizeText(option?.texto ?? option?.text);
    if (!letter || !text || byLetter.has(letter)) continue;
    byLetter.set(letter, { letra: letter, texto: text });
  }

  return Array.from(byLetter.values()).sort((a, b) =>
    a.letra.localeCompare(b.letra),
  );
}

function sanitizeCorrectAnswers(value, rawValue, validLetters) {
  const fromArray = Array.isArray(value)
    ? value.map((item) => normalizeLetter(item)).filter(Boolean)
    : [];
  const fromRaw = parseCorrectAnswersFromRaw(rawValue);
  const merged = [...new Set([...fromArray, ...fromRaw])].sort();
  const filtered = merged.filter((letter) => validLetters.has(letter));
  return filtered.length > 0 ? filtered : merged;
}

const root = process.cwd();
const sourcePath = path.resolve(
  root,
  getCliArg("--source") ?? "CSA_EXAMTOPICS.json",
);
const outputPath = path.resolve(
  root,
  getCliArg("--output") ?? "CSA_EXAMTOPICS_READY.json",
);

if (!fs.existsSync(sourcePath)) {
  console.error(`Arquivo de origem nao encontrado: ${sourcePath}`);
  process.exit(1);
}

const parsed = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const questions = Array.isArray(parsed.questoes) ? parsed.questoes : [];

const result = [];
let skipped = 0;

for (const question of questions) {
  const id = Number(question.id);
  if (!Number.isFinite(id)) {
    skipped += 1;
    continue;
  }

  const topic = normalizeText(question.topico);
  const prompt = normalizeText(question.pergunta);
  const options = sanitizeOptions(question.opcoes);
  const optionLetters = new Set(options.map((option) => option.letra));
  const correct = sanitizeCorrectAnswers(
    question.resposta_correta,
    question.resposta_correta_raw,
    optionLetters,
  );

  if (!topic || !prompt || options.length < 2 || correct.length === 0) {
    skipped += 1;
    continue;
  }

  const answerTexts = options
    .filter((option) => correct.includes(option.letra))
    .map((option) => option.texto);

  result.push({
    id,
    source_id:
      question.source_id !== undefined && question.source_id !== null
        ? Number(question.source_id)
        : id,
    topico: topic,
    pergunta: prompt,
    opcoes: options,
    resposta_correta: correct,
    resposta_texto: answerTexts,
    question_type: correct.length > 1 ? "multi_select" : "single_choice",
  });
}

result.sort((a, b) => a.id - b.id);

const output = {
  metadata: {
    source_file: path.basename(sourcePath),
    total_questions: result.length,
    skipped,
  },
  questoes: result,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
console.log(`Dataset limpo gerado em: ${outputPath}`);
console.log(`Questoes validas: ${result.length}`);
console.log(`Descartadas: ${skipped}`);
