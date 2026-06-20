#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function getCliArg(name) {
  const index = process.argv.findIndex((arg) => arg === name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

const sourceArg = getCliArg("--source");
const sourcePath = sourceArg
  ? path.resolve(process.cwd(), sourceArg)
  : path.join(process.cwd(), "CSA_EXAMTOPICS.json");

if (!fs.existsSync(sourcePath)) {
  console.error(`Arquivo nao encontrado: ${sourcePath}`);
  process.exit(1);
}

const parsed = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

function detectInputFormat(payload) {
  if (Array.isArray(payload?.questoes)) {
    return { format: "legacy", questions: payload.questoes };
  }

  if (Array.isArray(payload?.questions)) {
    return { format: "normalized", questions: payload.questions };
  }

  return { format: "unknown", questions: [] };
}

const { format: inputFormat, questions } = detectInputFormat(parsed);

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLetter(value) {
  const normalized = normalizeText(value).toUpperCase();
  return /^[A-Z]$/.test(normalized) ? normalized : "";
}

function letterFromIndex(index) {
  if (!Number.isInteger(index) || index < 0 || index > 25) {
    return "";
  }
  return String.fromCharCode(65 + index);
}

const report = {
  source: sourcePath,
  inputFormat,
  total: questions.length,
  missingTopic: 0,
  missingPrompt: 0,
  missingOptions: 0,
  missingCorrectAnswers: 0,
  correctNotInOptions: 0,
  invalidQuestionType: 0,
};

const samples = [];
const validQuestionTypes = new Set(["single_choice", "multi_select"]);
const sourceTopics =
  parsed?.topics && typeof parsed.topics === "object" && !Array.isArray(parsed.topics)
    ? parsed.topics
    : {};

for (const question of questions) {
  const id = Number(question.id);
  const topic =
    inputFormat === "legacy"
      ? normalizeText(question.topico ?? question.topic)
      : normalizeText(question.topic) ||
        normalizeText(sourceTopics[normalizeText(question.topic_key)]);
  const prompt =
    inputFormat === "legacy"
      ? normalizeText(question.pergunta ?? question.question)
      : normalizeText(question.question);

  let optionLetters = new Set();
  let correctAnswers = [];

  if (inputFormat === "legacy") {
    const options = Array.isArray(question.opcoes) ? question.opcoes : [];
    optionLetters = new Set(
      options
        .map((option) => normalizeLetter(option?.letra ?? option?.letter))
        .filter(Boolean),
    );

    correctAnswers = Array.isArray(question.resposta_correta)
      ? question.resposta_correta.map((value) => normalizeLetter(value)).filter(Boolean)
      : [];
  } else if (inputFormat === "normalized") {
    const options = Array.isArray(question.options) ? question.options : [];
    optionLetters = new Set(
      options
        .map((_, index) => letterFromIndex(index))
        .filter(Boolean),
    );

    correctAnswers = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
          .map((value) => {
            if (Number.isInteger(value)) return letterFromIndex(value);
            return normalizeLetter(value);
          })
          .filter(Boolean)
      : [];

    const questionType = normalizeText(question.question_type).toLowerCase();
    if (questionType && !validQuestionTypes.has(questionType)) {
      report.invalidQuestionType += 1;
    }
  }

  if (!topic) report.missingTopic += 1;
  if (!prompt) report.missingPrompt += 1;
  if (optionLetters.size === 0) report.missingOptions += 1;
  if (correctAnswers.length === 0) report.missingCorrectAnswers += 1;

  const invalidCorrect = correctAnswers.filter((answer) => !optionLetters.has(answer));
  if (invalidCorrect.length > 0) {
    report.correctNotInOptions += 1;
    if (samples.length < 10) {
      samples.push({
        id,
        topic,
        prompt: prompt.slice(0, 120),
        correctAnswers,
        optionLetters: [...optionLetters],
        invalidCorrect,
      });
    }
  }
}

console.log("Question audit report:");
console.log(JSON.stringify(report, null, 2));

if (samples.length > 0) {
  console.log("\nExamples with correct answers outside options:");
  console.log(JSON.stringify(samples, null, 2));
}
