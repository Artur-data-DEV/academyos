#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function getCliArg(name) {
  const index = process.argv.findIndex((arg) => arg === name);
  if (index < 0) return undefined;
  return process.argv[index + 1];
}

const dryRun = process.argv.includes("--dry-run");

function loadEnvFile(filePath, { override = false } = {}) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [key, ...rest] = trimmed.split("=");
    if (!key || rest.length === 0) continue;

    if (override || process.env[key] === undefined) {
      process.env[key] = rest.join("=").trim().replace(/^"|"$/g, "");
    }
  }
}

const root = process.cwd();
loadEnvFile(path.join(root, ".env"), { override: false });
loadEnvFile(path.join(root, ".env.local"), { override: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const sourceArg = getCliArg("--source");
const examArg = getCliArg("--exam") || "csa";

const sourcePath = sourceArg
  ? path.resolve(root, sourceArg)
  : path.join(root, "CSA_EXAMTOPICS.json");
if (!fs.existsSync(sourcePath)) {
  console.error(`Arquivo de origem nao encontrado: ${sourcePath}`);
  process.exit(1);
}

const raw = fs.readFileSync(sourcePath, "utf8");
const parsed = JSON.parse(raw);

function detectInputFormat(payload) {
  if (Array.isArray(payload?.questoes)) {
    return { format: "legacy", questions: payload.questoes };
  }

  if (Array.isArray(payload?.questions)) {
    return { format: "normalized", questions: payload.questions };
  }

  if (Array.isArray(payload)) {
    return { format: "flat_array", questions: payload };
  }

  return { format: "unknown", questions: [] };
}

const { format: inputFormat, questions } = detectInputFormat(parsed);

if (questions.length === 0) {
  console.error(
    "Nenhuma questao encontrada no arquivo de origem. Formatos aceitos: { questoes: [...] }, { questions: [...] } ou array direto [...]",
  );
  process.exit(1);
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForDedup(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function sanitizeQuestionPrompt(value) {
  let sanitized = normalizeText(value);

  // Remove common OCR/import artifacts appended to the prompt.
  while (/\((?:file\s*\d+|duplicate)\)\s*$/i.test(sanitized)) {
    sanitized = sanitized.replace(/\((?:file\s*\d+|duplicate)\)\s*$/i, "").trim();
  }

  return sanitized;
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

function parseCorrectAnswersFromRaw(rawValue) {
  const raw = normalizeText(rawValue);
  if (!raw) return [];

  const matches = raw.match(/\b([A-Z])\./g) ?? [];
  return [
    ...new Set(matches.map((item) => item.replace(".", "").trim().toUpperCase())),
  ].sort();
}

function sanitizeLegacyOptions(options) {
  if (!Array.isArray(options)) return [];

  const uniqueByLetter = new Map();

  for (const option of options) {
    const letter = normalizeLetter(option?.letra ?? option?.letter);
    const text = normalizeText(option?.texto ?? option?.text);

    if (!letter || !text) continue;
    if (uniqueByLetter.has(letter)) continue;

    uniqueByLetter.set(letter, { letter, text });
  }

  return Array.from(uniqueByLetter.values());
}

function sanitizeIndexedOptions(options) {
  if (!Array.isArray(options)) {
    return { options: [], indexToLetter: new Map() };
  }

  const built = [];
  const indexToLetter = new Map();
  const seenLetters = new Set();

  for (let index = 0; index < options.length; index += 1) {
    const text = normalizeText(options[index]);
    const letter = letterFromIndex(index);

    if (!letter || !text) continue;
    if (seenLetters.has(letter)) continue;

    seenLetters.add(letter);
    indexToLetter.set(index, letter);
    built.push({ letter, text });
  }

  return { options: built, indexToLetter };
}

function sanitizeCorrectAnswersFromLetters(value, rawValue, validLetters) {
  const fromArray = Array.isArray(value)
    ? value
        .map((item) => normalizeLetter(item))
        .filter(Boolean)
    : [];

  const fromRaw = parseCorrectAnswersFromRaw(rawValue);
  const merged = [...new Set([...fromArray, ...fromRaw])].sort();

  if (validLetters.size === 0) {
    return merged;
  }

  const filtered = merged.filter((letter) => validLetters.has(letter));
  return filtered.length > 0 ? filtered : merged;
}

function sanitizeCorrectAnswersFromIndexes(value, indexToLetter, validLetters) {
  const fromIndexes = Array.isArray(value)
    ? value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item))
        .map((index) => indexToLetter.get(index))
        .filter(Boolean)
    : [];

  const fromLetters = Array.isArray(value)
    ? value
        .map((item) => normalizeLetter(item))
        .filter(Boolean)
    : [];

  const merged = [...new Set([...fromIndexes, ...fromLetters])].sort();

  if (validLetters.size === 0) {
    return merged;
  }

  const filtered = merged.filter((letter) => validLetters.has(letter));
  return filtered.length > 0 ? filtered : merged;
}

function inferQuestionType(correctAnswers) {
  return correctAnswers.length > 1 ? "multi_select" : "single_choice";
}

function getCorrectAnswerTextSignature(row) {
  const optionByLetter = new Map(
    row.options_json.map((option) => [option.letter, normalizeForDedup(option.text)]),
  );

  return [...row.correct_answer]
    .map((letter) => optionByLetter.get(letter) ?? normalizeForDedup(letter))
    .sort()
    .join(",");
}

function buildContentKeys(row) {
  const optionsSignature = [...row.options_json]
    .sort((a, b) => a.letter.localeCompare(b.letter))
    .map((option) => `${option.letter}:${normalizeForDedup(option.text)}`)
    .join("|");
  const optionTextSignature = [...row.options_json]
    .map((option) => normalizeForDedup(option.text))
    .sort()
    .join("|");

  const answersSignature = [...row.correct_answer].sort().join(",");
  const answerTextSignature = getCorrectAnswerTextSignature(row);
  const promptSignature = normalizeForDedup(row.question).replace(
    /\bchoose (one|two|three|four|five|six)\b/g,
    "",
  );

  return [
    [
      "exact",
      normalizeForDedup(row.topic),
      normalizeForDedup(row.question),
      optionsSignature,
      answersSignature,
    ].join("||"),
    [
      "options",
      normalizeForDedup(row.topic),
      optionTextSignature,
      answerTextSignature,
    ].join("||"),
    [
      "prompt",
      normalizeForDedup(row.topic),
      promptSignature,
      answerTextSignature,
    ].join("||"),
  ];
}

const rows = [];
let skipped = 0;
const skippedByReason = new Map();
const sourceTopics =
  parsed?.topics && typeof parsed.topics === "object" && !Array.isArray(parsed.topics)
    ? parsed.topics
    : {};
const seenContentKeys = new Set();

function registerSkip(reason) {
  skipped += 1;
  skippedByReason.set(reason, (skippedByReason.get(reason) ?? 0) + 1);
}

for (const question of questions) {
  const sourceStatus = normalizeText(question.status).toLowerCase();
  if (sourceStatus && sourceStatus !== "ready") {
    registerSkip("status_not_ready");
    continue;
  }

  let id;
  if (inputFormat === "flat_array") {
    // For flat arrays, to avoid overwriting existing questions with ID 1, 2, 3...
    // we use a large offset or hash. Let's use an offset based on exam to be safe.
    const offset = examArg === "cis_df" ? 20000 : 10000;
    id = Number(question.number || question.id) + offset;
  } else {
    id = Number(question.id);
  }

  if (!Number.isFinite(id)) {
    registerSkip("invalid_id");
    continue;
  }

  let topic = "";
  let prompt = "";
  let options = [];
  let correctAnswers = [];

  if (inputFormat === "legacy") {
    topic = normalizeText(question.topico ?? question.topic);
    prompt = sanitizeQuestionPrompt(question.pergunta ?? question.question);
    options = sanitizeLegacyOptions(question.opcoes);
    const optionLetters = new Set(options.map((option) => option.letter));
    correctAnswers = sanitizeCorrectAnswersFromLetters(
      question.resposta_correta,
      question.resposta_correta_raw,
      optionLetters,
    );
  } else if (inputFormat === "normalized") {
    topic =
      normalizeText(question.topic) ||
      normalizeText(sourceTopics[normalizeText(question.topic_key)]);
    prompt = sanitizeQuestionPrompt(question.question);

    const indexed = sanitizeIndexedOptions(question.options);
    options = indexed.options;

    const optionLetters = new Set(options.map((option) => option.letter));
    correctAnswers = sanitizeCorrectAnswersFromIndexes(
      question.correctAnswer,
      indexed.indexToLetter,
      optionLetters,
    );
  } else if (inputFormat === "flat_array") {
    topic = normalizeText(question.source) || "Sem tópico";
    prompt = sanitizeQuestionPrompt(question.question);
    
    // For flat array, options are objects with { id, text, correct }
    const builtOptions = [];
    const idToLetter = new Map();
    let index = 0;
    
    for (const opt of question.options) {
      const text = normalizeText(opt.text || opt.value || "");
      const letter = letterFromIndex(index);
      if (!letter || !text) continue;
      
      idToLetter.set(opt.id, letter);
      builtOptions.push({ letter, text, id: opt.id });
      index++;
    }
    
    options = builtOptions;
    const optionLetters = new Set(options.map((option) => option.letter));
    
    if (question.question_type === "drag_and_drop") {
      // Correct answers are already an array of letters/ids
      correctAnswers = Array.isArray(question.correct_answer) ? question.correct_answer : [];
    } else {
      // correct_answer is an array of IDs like ['radio0']
      const mappedLetters = [];
      for (const ansId of (question.correct_answer || [])) {
        if (idToLetter.has(ansId)) {
          mappedLetters.push(idToLetter.get(ansId));
        }
      }
      correctAnswers = sanitizeCorrectAnswersFromLetters(
        mappedLetters,
        "",
        optionLetters,
      );
    }
  } else {
    registerSkip("unknown_input_format");
    continue;
  }

  if (!topic || !prompt || options.length === 0 || correctAnswers.length === 0) {
    registerSkip("invalid_required_data");
    continue;
  }

  const row = {
    id,
    source_id:
      question.source_id !== undefined && question.source_id !== null
        ? Number(question.source_id)
        : null,
    topic,
    question: prompt,
    correct_answer: correctAnswers,
    options_json: options,
    source_json: question,
    question_type: question.question_type || inferQuestionType(correctAnswers),
    exam: examArg,
  };

  const contentKeys = buildContentKeys(row);
  if (contentKeys.some((key) => seenContentKeys.has(key))) {
    registerSkip("duplicate_content_after_sanitization");
    continue;
  }

  for (const contentKey of contentKeys) {
    seenContentKeys.add(contentKey);
  }
  rows.push(row);
}

if (rows.length === 0) {
  console.error("Apos saneamento, nenhuma linha valida restou para importar.");
  if (skippedByReason.size > 0) {
    console.error("Motivos de descarte:", Object.fromEntries(skippedByReason.entries()));
  }
  process.exit(1);
}

if (dryRun) {
  console.log("Dry-run concluido. Nenhuma alteracao foi gravada no banco.");
  console.log(
    JSON.stringify(
      {
        source: sourcePath,
        inputFormat,
        totalInput: questions.length,
        rowsReady: rows.length,
        skipped,
        skippedByReason: Object.fromEntries(skippedByReason.entries()),
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente ou no .env.local",
  );
  process.exit(1);
}

if (
  SERVICE_ROLE_KEY.startsWith("YOUR_") ||
  SERVICE_ROLE_KEY.toLowerCase().includes("placeholder")
) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY parece placeholder. Copie a chave completa em Settings > API Keys.",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { error: tableCheckError } = await supabase.from("questions").select("id").limit(1);
if (tableCheckError) {
  console.error(
    "Tabela public.questions nao encontrada. Execute primeiro supabase/schema.sql no SQL Editor.",
  );
  process.exit(1);
}

const { error: questionTypeCheckError } = await supabase
  .from("questions")
  .select("question_type")
  .limit(1);

const hasQuestionTypeColumn = !questionTypeCheckError;

if (!hasQuestionTypeColumn) {
  console.warn(
    "Coluna question_type ainda nao existe. Rode supabase/patch-question-type.sql para habilitar single_choice/multi_select no banco.",
  );
}

const BATCH_SIZE = 200;

for (let index = 0; index < rows.length; index += BATCH_SIZE) {
  const batch = rows
    .slice(index, index + BATCH_SIZE)
    .map((row) =>
      hasQuestionTypeColumn
        ? row
        : {
            id: row.id,
            source_id: row.source_id,
            topic: row.topic,
            question: row.question,
            correct_answer: row.correct_answer,
            options_json: row.options_json,
            source_json: row.source_json,
          },
    );

  const { error } = await supabase.from("questions").upsert(batch, { onConflict: "id" });

  if (error) {
    if (error.message?.toLowerCase().includes("invalid api key")) {
      console.error(
        "Falha no lote 1: Invalid API key. Verifique SUPABASE_SERVICE_ROLE_KEY (completa).",
      );
      process.exit(1);
    }

    console.error(`Falha no lote ${index / BATCH_SIZE + 1}:`, error.message);
    process.exit(1);
  }

  console.log(
    `Lote ${index / BATCH_SIZE + 1}: ${Math.min(index + BATCH_SIZE, rows.length)}/${rows.length}`,
  );
}

console.log(`Importacao concluida com sucesso. ${rows.length} questoes processadas.`);
console.log(`Linhas descartadas por inconsistencias: ${skipped}`);
if (skippedByReason.size > 0) {
  console.log("Motivos de descarte:", Object.fromEntries(skippedByReason.entries()));
}
