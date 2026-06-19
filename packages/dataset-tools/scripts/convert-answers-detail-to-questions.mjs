#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

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

function readJsonFromClipboard() {
  const raw = execSync('powershell -NoProfile -Command "Get-Clipboard -Raw"', {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 20,
  });
  return JSON.parse(raw);
}

function parseIdRange(sourceFile) {
  const value = normalizeText(sourceFile);
  if (!value) return { start: 1, end: null };

  const match =
    value.match(/questions-(\d+)-(\d+)/i) ??
    value.match(/(\d+)\s*-\s*(\d+)\s*$/);

  if (!match) return { start: 1, end: null };
  return { start: Number(match[1]), end: Number(match[2]) };
}

function indexToLetter(index) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function parseOption(optionText, index) {
  const raw = normalizeText(optionText);
  const match = raw.match(/^([A-H])\.\s*(.+)$/i);
  if (match) {
    return {
      letra: match[1].toUpperCase(),
      texto: normalizeText(match[2]),
    };
  }

  return {
    letra: indexToLetter(index),
    texto: raw,
  };
}

function toQuestion(row, id) {
  const optionsRaw = Array.isArray(row.options) ? row.options : [];
  const options = optionsRaw.map((option, index) => parseOption(option, index));

  const correctIndexes = Array.isArray(row.correctAnswer) ? row.correctAnswer : [];
  const validIndexes = correctIndexes.filter(
    (value) =>
      Number.isInteger(value) && value >= 0 && value < options.length,
  );

  const correctLetters = [
    ...new Set(validIndexes.map((index) => options[index]?.letra).filter(Boolean)),
  ].sort();

  const answerTexts = options
    .filter((option) => correctLetters.includes(option.letra))
    .map((option) => option.texto);

  if (!normalizeText(row.question) || options.length === 0 || correctLetters.length === 0) {
    return null;
  }

  return {
    id,
    source_id: id,
    topico: normalizeText(row.topic),
    pergunta: normalizeText(row.question),
    opcoes: options,
    resposta_correta: correctLetters,
    resposta_texto: answerTexts,
    question_type: correctLetters.length > 1 ? "multi_select" : "single_choice",
  };
}

function mergeQuestions(baseQuestions, incomingQuestions) {
  const map = new Map();

  for (const question of baseQuestions) {
    map.set(question.id, question);
  }
  for (const question of incomingQuestions) {
    map.set(question.id, question);
  }

  return Array.from(map.values()).sort((a, b) => a.id - b.id);
}

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function writeJsonFile(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}

const inputArg = getCliArg("--input");
const fromClipboard = process.argv.includes("--from-clipboard");
const outputArg =
  getCliArg("--output") ?? "CSA_EXAMTOPICS_FROM_ANSWERS_DETAIL.json";
const mergeBaseArg = getCliArg("--merge-base");
const mergeOutputArg = getCliArg("--merge-output");

let payload;

if (fromClipboard) {
  payload = readJsonFromClipboard();
} else if (inputArg) {
  payload = readJsonFile(path.resolve(process.cwd(), inputArg));
} else {
  console.error(
    "Informe --input <arquivo.json> ou use --from-clipboard para ler JSON copiado.",
  );
  process.exit(1);
}

const answers = Array.isArray(payload.answers_detail) ? payload.answers_detail : [];
if (answers.length === 0) {
  console.error("JSON não possui answers_detail com itens.");
  process.exit(1);
}

const range = parseIdRange(payload.source_file);
const converted = [];
let skipped = 0;

for (let index = 0; index < answers.length; index += 1) {
  const id = range.start + index;
  const question = toQuestion(answers[index], id);
  if (!question) {
    skipped += 1;
    continue;
  }
  converted.push(question);
}

const outputPayload = {
  metadata: {
    source: "answers_detail",
    source_file: payload.source_file ?? null,
    total_questions: converted.length,
    skipped,
    id_start: range.start,
    id_end: range.end ?? (range.start + answers.length - 1),
  },
  questoes: converted,
};

const outputPath = path.resolve(process.cwd(), outputArg);
writeJsonFile(outputPath, outputPayload);
console.log(`Arquivo convertido: ${outputPath}`);
console.log(`Questões convertidas: ${converted.length} | descartadas: ${skipped}`);

if (mergeBaseArg) {
  const basePath = path.resolve(process.cwd(), mergeBaseArg);
  const basePayload = readJsonFile(basePath);
  const baseQuestions = Array.isArray(basePayload.questoes) ? basePayload.questoes : [];
  const merged = mergeQuestions(baseQuestions, converted);

  const mergedPayload = {
    metadata: {
      merged_at: new Date().toISOString(),
      base_file: basePath,
      incoming_file: outputPath,
      total_questions: merged.length,
    },
    questoes: merged,
  };

  const mergeOutPath = path.resolve(
    process.cwd(),
    mergeOutputArg ?? "CSA_EXAMTOPICS_READY_MERGED.json",
  );
  writeJsonFile(mergeOutPath, mergedPayload);
  console.log(`Arquivo mesclado: ${mergeOutPath}`);
}
