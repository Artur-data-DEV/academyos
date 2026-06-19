/**
 * Browser-side scraper for:
 * https://kelvennds1.github.io/csa-exam-sumulation/
 *
 * Run in DevTools Console on the logged-in exam page.
 */

(async () => {
  if (window.__csaAutoScraperRunning) {
    console.warn("[CSA] scraper já está rodando.");
    return;
  }
  window.__csaAutoScraperRunning = true;

  const CONFIG = {
    delayMs: 900,
    maxSteps: 1500,
    maxIdleSteps: 25,
    repeatFingerprintLimit: 5,
    verbose: true,
  };

  const STORAGE_KEY = "__csa_auto_scraper_state_v2";

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const normalize = (value) =>
    String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();

  const isVisible = (el) => {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const isDisabled = (el) =>
    Boolean(
      el?.hasAttribute?.("disabled") ||
        el?.getAttribute?.("aria-disabled") === "true" ||
        normalize(el?.className).toLowerCase().includes("disabled"),
    );

  const getText = (el) => normalize(el?.textContent ?? "");

  const getClickableCandidates = () =>
    [
      ...document.querySelectorAll(
        "button, a, [role='button'], input[type='button'], input[type='submit'], div, span",
      ),
    ].filter((el) => isVisible(el) && getText(el));

  const findClickable = (regex, { allowDisabled = false } = {}) =>
    getClickableCandidates().find((el) => {
      if (!allowDisabled && isDisabled(el)) return false;
      return regex.test(getText(el));
    }) ?? null;

  const clickIfFound = async (regex, label) => {
    const el = findClickable(regex);
    if (!el) return false;
    el.click();
    if (CONFIG.verbose) console.log(`[CSA] clicou: ${label} -> "${getText(el)}"`);
    await sleep(CONFIG.delayMs);
    return true;
  };

  const findQuestionMeta = () => {
    const body = normalize(document.body.innerText);
    const numberMatch =
      body.match(/question\s+(\d+)\s+of\s+(\d+)/i) ??
      body.match(/quest[aã]o\s+(\d+)\s+de\s+(\d+)/i);
    const idMatch = body.match(/\bID\s*#\s*(\d+)\b/i);
    return {
      index: numberMatch ? Number(numberMatch[1]) : null,
      total: numberMatch ? Number(numberMatch[2]) : null,
      source_id: idMatch ? Number(idMatch[1]) : null,
    };
  };

  const extractOptionsFromText = (text) => {
    const lines = text
      .split(/\n+/)
      .map((line) => normalize(line))
      .filter(Boolean);

    const options = [];
    const seen = new Set();

    for (const line of lines) {
      const match = line.match(/^([A-H])[\.\)\-: ]+\s*(.+)$/i);
      if (!match) continue;

      const letter = match[1].toUpperCase();
      const optionText = normalize(match[2]);
      if (!optionText) continue;

      const key = `${letter}|${optionText}`;
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({ letter, text: optionText });
    }

    return options;
  };

  const extractQuestion = () => {
    const bodyText = document.body.innerText ?? "";
    const lines = bodyText
      .split(/\n+/)
      .map((line) => normalize(line))
      .filter(Boolean);

    const options = extractOptionsFromText(bodyText);
    const optionSet = new Set(options.map((option) => `${option.letter}. ${option.text}`));

    const { index, total, source_id } = findQuestionMeta();
    const firstOptionIdx = lines.findIndex((line) => /^([A-H])[\.\)\-: ]+\s+.+/i.test(line));

    let prompt = "";
    if (firstOptionIdx > 0) {
      const beforeOptions = lines.slice(0, firstOptionIdx);
      prompt =
        beforeOptions
          .reverse()
          .find(
            (line) =>
              line.includes("?") &&
              !/^question\b/i.test(line) &&
              !/^quest[aã]o\b/i.test(line),
          ) ?? "";
    }

    if (!prompt) {
      prompt =
        lines.find(
          (line) =>
            line.includes("?") &&
            !/^question\b/i.test(line) &&
            !/^quest[aã]o\b/i.test(line),
        ) ?? "";
    }

    const topic =
      lines.find(
        (line) =>
          !optionSet.has(line) &&
          !/^question\b/i.test(line) &&
          !/^quest[aã]o\b/i.test(line) &&
          !line.includes("?") &&
          line.length >= 10 &&
          line.length <= 90 &&
          /[A-Za-z]/.test(line) &&
          !/\btime\b|\btempo\b|\bnext\b|\bprevious\b|\bsubmit\b/i.test(line),
      ) ?? "";

    const correctMatch = normalize(document.body.innerText).match(
      /correct answer\s*:\s*([A-H,\s]+)/i,
    );
    const correct = correctMatch
      ? [...new Set((correctMatch[1].match(/[A-H]/gi) ?? []).map((x) => x.toUpperCase()))]
      : [];

    return {
      index,
      total,
      source_id,
      topic,
      prompt,
      options,
      resposta_correta: correct,
      question_type: correct.length > 1 ? "multi_select" : "single_choice",
      scraped_at: new Date().toISOString(),
    };
  };

  const fingerprint = (q) =>
    normalize(
      `${q.source_id ?? ""}|${q.prompt}|${q.options.map((o) => `${o.letter}:${o.text}`).join("|")}`,
    );

  const isQuestionScreen = () => {
    const q = extractQuestion();
    return Boolean(q.prompt && q.options.length >= 2);
  };

  const gotoQuestionScreen = async () => {
    // home/start
    if (await clickIfFound(/^start exam$/i, "Start Exam")) return true;
    if (await clickIfFound(/\bbegin exam\b|\bstart\b/i, "Begin/Start")) return true;

    // source selector
    if (await clickIfFound(/\ball sources\b|\ball source\b|\btodas as fontes\b/i, "All Sources")) {
      return true;
    }

    // generic continue after source selection
    if (await clickIfFound(/\bcontinue\b|\bconfirm\b|\bnext\b/i, "Continue/Next")) return true;

    return false;
  };

  const findNextButton = () =>
    findClickable(/^next$/i) ??
    findClickable(/\bnext\b/i) ??
    findClickable(/\bpr[oó]xima\b/i);

  const readState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const writeState = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  };

  const clearState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const saveJson = (payload) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `csa_scraped_${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const resumed = readState();
  const results = resumed?.results ?? [];
  const seen = new Set(results.map((r) => r.__fp));

  let idleSteps = 0;
  let repeatStreak = 0;
  const startTime = Date.now();

  try {
    for (let step = 1; step <= CONFIG.maxSteps; step += 1) {
      if (!isQuestionScreen()) {
        const acted = await gotoQuestionScreen();
        if (acted) continue;

        idleSteps += 1;
        if (idleSteps >= CONFIG.maxIdleSteps) {
          console.log("[CSA] Não entrou na tela de questão. Encerrando.");
          break;
        }
        await sleep(CONFIG.delayMs);
        continue;
      }

      idleSteps = 0;
      const q = extractQuestion();
      const fp = fingerprint(q);

      if (q.prompt && q.options.length >= 2 && !seen.has(fp)) {
        results.push({ ...q, __fp: fp });
        seen.add(fp);
        repeatStreak = 0;
        console.log(
          `[CSA] +${results.length} | ${q.index ?? "?"}/${q.total ?? "?"} | ${
            q.prompt.slice(0, 90)
          }`,
        );
      } else {
        repeatStreak += 1;
      }

      writeState({ results });

      const nextBtn = findNextButton();
      if (!nextBtn || isDisabled(nextBtn)) {
        console.log("[CSA] Next indisponível. Encerrando.");
        break;
      }

      if (repeatStreak >= CONFIG.repeatFingerprintLimit) {
        console.log("[CSA] Repetição detectada. Encerrando para evitar loop.");
        break;
      }

      nextBtn.click();
      await sleep(CONFIG.delayMs);
    }
  } finally {
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);
    const payload = {
      metadata: {
        source: window.location.href,
        scraped_count: results.length,
        elapsed_seconds: elapsedSec,
        exported_at: new Date().toISOString(),
      },
      questoes: results.map((item) => {
        const clone = { ...item };
        delete clone.__fp;
        return clone;
      }),
    };
    saveJson(payload);
    clearState();
    window.__csaAutoScraperRunning = false;
    console.log(`[CSA] Finalizado. ${results.length} questões exportadas.`);
  }
})();
