#!/usr/bin/env python
"""
Build a cleaned CSA dataset from ExamTopics answer PDFs (image-based dump).

Requires:
  pip install pymupdf rapidocr-onnxruntime

Usage:
  python scripts/build_dataset_from_dump.py \
    --dump-dir "data/raw-examtopics/01 - ExamTopics/01 - Respostas" \
    --existing-json "CSA_EXAMTOPICS.json" \
    --output "CSA_EXAMTOPICS_FROM_DUMP.json"
"""

from __future__ import annotations

import argparse
import json
import re
import tempfile
import time
from collections import OrderedDict
from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
from rapidocr_onnxruntime import RapidOCR

QUESTION_RE = re.compile(r"Question\s*#\s*(\d+)", re.IGNORECASE)
TOPIC_RE = re.compile(r"Topic\s*(\d+)", re.IGNORECASE)
OPTION_RE = re.compile(r"^([A-H])\s*[\.\):,]?\s*(.+)$")
CORRECT_RE = re.compile(r"Correct\s*Answer\s*:?\s*([A-H,\s]+)", re.IGNORECASE)

NOISE_PATTERNS = [
    re.compile(r"^Most\s*Voted$", re.IGNORECASE),
    re.compile(r"^Hide\s*Solution$", re.IGNORECASE),
    re.compile(r"^Discussion$", re.IGNORECASE),
    re.compile(r"^Community\s*vote", re.IGNORECASE),
    re.compile(r"^View\s*Custom\s*Settings$", re.IGNORECASE),
    re.compile(r"^Vendor:$", re.IGNORECASE),
    re.compile(r"^Exam\s*Code:$", re.IGNORECASE),
    re.compile(r"^Exam\s*Name:$", re.IGNORECASE),
    re.compile(r"^Exam\s*Questions:$", re.IGNORECASE),
    re.compile(r"^Last\s*updated", re.IGNORECASE),
    re.compile(r"^(HOME|CONTACT|POPULAR EXAMS|VIEW ALL EXAMS|MAIL US)$", re.IGNORECASE),
]


def normalize_line(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "")).strip()


def is_noise_line(line: str) -> bool:
    if not line:
        return True
    if line.isdigit():
        return True
    for pattern in NOISE_PATTERNS:
        if pattern.search(line):
            return True
    return False


def parse_letters(raw: str) -> list[str]:
    values = re.findall(r"[A-H]", (raw or "").upper())
    return sorted(set(values))


def extract_topic_number(lines: list[str]) -> int | None:
    for line in lines:
        match = TOPIC_RE.search(line)
        if match:
            return int(match.group(1))
    return None


def extract_correct_answers(lines: list[str]) -> list[str]:
    for line in lines:
        compact = line.replace(" ", "")
        match = CORRECT_RE.search(line) or CORRECT_RE.search(compact)
        if match:
            letters = parse_letters(match.group(1))
            if letters:
                return letters

    joined = " ".join(lines)
    match = CORRECT_RE.search(joined)
    if match:
        letters = parse_letters(match.group(1))
        if letters:
            return letters

    return []


def parse_question_block(
    question_id: int,
    lines: list[str],
    existing_by_id: dict[int, dict[str, Any]],
) -> dict[str, Any]:
    lines = [normalize_line(line) for line in lines if normalize_line(line)]
    existing = existing_by_id.get(question_id)
    topic_number = extract_topic_number(lines)

    first_option_idx = None
    for index, line in enumerate(lines):
        if OPTION_RE.match(line):
            first_option_idx = index
            break

    prompt_lines: list[str] = []
    if first_option_idx is not None:
        for line in lines[:first_option_idx]:
            if is_noise_line(line):
                continue
            if TOPIC_RE.match(line):
                continue
            if "Correct" in line:
                continue
            prompt_lines.append(line)
    prompt = normalize_line(" ".join(prompt_lines))

    options: "OrderedDict[str, str]" = OrderedDict()
    current_letter: str | None = None

    options_segment = lines[first_option_idx:] if first_option_idx is not None else []
    for line in options_segment:
        if re.search(r"Hide\s*Solution", line, re.IGNORECASE):
            break
        if re.search(r"Correct\s*Answer", line, re.IGNORECASE):
            break
        if re.search(r"Community\s*vote", line, re.IGNORECASE):
            break
        if re.search(r"Most\s*Voted", line, re.IGNORECASE):
            continue

        match = OPTION_RE.match(line)
        if match:
            letter = match.group(1).upper()
            text = normalize_line(match.group(2))
            if not text:
                continue

            if letter in options:
                options[letter] = normalize_line(f"{options[letter]} {text}")
            else:
                options[letter] = text
            current_letter = letter
            continue

        if current_letter and not is_noise_line(line):
            options[current_letter] = normalize_line(f"{options[current_letter]} {line}")

    correct_answers = extract_correct_answers(lines)

    if existing:
        if not prompt:
            prompt = normalize_line(existing.get("pergunta", ""))

        if len(options) == 0:
            for option in existing.get("opcoes", []):
                letter = normalize_line(str(option.get("letra", ""))).upper()
                text = normalize_line(str(option.get("texto", "")))
                if letter and text:
                    options[letter] = text

        if len(correct_answers) == 0:
            correct_answers = sorted(
                set(
                    normalize_line(value).upper()
                    for value in existing.get("resposta_correta", [])
                    if normalize_line(value)
                )
            )

    topic = ""
    if existing and normalize_line(existing.get("topico", "")):
        topic = normalize_line(existing.get("topico", ""))
    elif topic_number is not None:
        topic = f"Topic {topic_number}"
    else:
        topic = "Uncategorized"

    option_list = [{"letra": key, "texto": value} for key, value in options.items()]
    question_type = "multi_select" if len(correct_answers) > 1 else "single_choice"

    status = "ready"
    if not prompt or len(option_list) < 2:
        status = "low_confidence"
    elif len(correct_answers) == 0:
        status = "missing_answer_key"

    return {
        "id": question_id,
        "source_id": question_id,
        "topico": topic,
        "pergunta": prompt,
        "opcoes": option_list,
        "resposta_correta": correct_answers,
        "question_type": question_type,
        "status": status,
        "source_dump": {
            "topic_number": topic_number,
            "line_count": len(lines),
        },
    }


def ocr_pdf_lines(pdf_path: Path, ocr: RapidOCR, scale: float = 1.5) -> list[str]:
    lines: list[str] = []
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    started_at = time.time()

    with tempfile.TemporaryDirectory(prefix="examtopics-ocr-") as tmp_dir:
        tmp_dir_path = Path(tmp_dir)
        for page_index in range(len(doc)):
            page = doc[page_index]
            pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale))
            image_path = tmp_dir_path / f"{pdf_path.stem}-p{page_index + 1}.png"
            pix.save(image_path)

            result, _ = ocr(str(image_path))
            if not result:
                print(
                    f"    page {page_index + 1}/{total_pages}: no OCR result",
                    flush=True,
                )
                continue

            for entry in result:
                line = normalize_line(entry[1])
                if line:
                    lines.append(line)

            elapsed = time.time() - started_at
            print(
                f"    page {page_index + 1}/{total_pages}: {len(lines)} lines collected ({elapsed:.1f}s)",
                flush=True,
            )

    return lines


def split_into_question_blocks(lines: list[str]) -> OrderedDict[int, list[str]]:
    blocks: OrderedDict[int, list[str]] = OrderedDict()
    current_id: int | None = None

    for line in lines:
        match = QUESTION_RE.search(line)
        if match:
            current_id = int(match.group(1))
            if current_id not in blocks:
                blocks[current_id] = []
            continue

        if current_id is not None:
            blocks[current_id].append(line)

    return blocks


def load_existing_questions(existing_json_path: Path) -> dict[int, dict[str, Any]]:
    if not existing_json_path.exists():
        return {}

    parsed = json.loads(existing_json_path.read_text(encoding="utf-8"))
    questions = parsed.get("questoes", []) if isinstance(parsed, dict) else []

    by_id: dict[int, dict[str, Any]] = {}
    for question in questions:
        try:
            question_id = int(question.get("id"))
        except Exception:
            continue
        by_id[question_id] = question
    return by_id


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dump-dir",
        type=str,
        required=True,
        help="Directory containing *Respostas.pdf files.",
    )
    parser.add_argument(
        "--existing-json",
        type=str,
        default="CSA_EXAMTOPICS.json",
        help="Existing JSON used as fallback for missing OCR fields.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default="CSA_EXAMTOPICS_FROM_DUMP.json",
        help="Output JSON path.",
    )
    parser.add_argument(
        "--scale",
        type=float,
        default=1.5,
        help="Render scale for OCR (higher = slower, usually more accurate).",
    )
    parser.add_argument(
        "--cache-dir",
        type=str,
        default="data/ocr-cache",
        help="Directory for per-PDF OCR cache (JSON lines).",
    )

    args = parser.parse_args()
    dump_dir = Path(args.dump_dir)
    existing_json_path = Path(args.existing_json)
    output_path = Path(args.output)
    cache_dir = Path(args.cache_dir)
    cache_dir.mkdir(parents=True, exist_ok=True)

    if not dump_dir.exists():
        raise SystemExit(f"Dump directory not found: {dump_dir}")

    answer_pdfs = sorted(dump_dir.glob("*Respostas.pdf"))
    if not answer_pdfs:
        raise SystemExit(f"No answer PDFs found in: {dump_dir}")

    existing_by_id = load_existing_questions(existing_json_path)
    ocr = RapidOCR()

    merged_lines: list[str] = []
    print(f"Found {len(answer_pdfs)} answer PDFs. Starting OCR...")

    for index, pdf_path in enumerate(answer_pdfs, start=1):
        cache_path = cache_dir / f"{pdf_path.stem}.json"

        if cache_path.exists():
            cached_lines = json.loads(cache_path.read_text(encoding="utf-8"))
            print(
                f"[{index}/{len(answer_pdfs)}] cache hit: {pdf_path.name} ({len(cached_lines)} lines)"
            )
            merged_lines.extend(cached_lines)
            continue

        print(f"[{index}/{len(answer_pdfs)}] OCR: {pdf_path.name}", flush=True)
        lines = ocr_pdf_lines(pdf_path, ocr=ocr, scale=args.scale)
        cache_path.write_text(json.dumps(lines, ensure_ascii=False), encoding="utf-8")
        print(
            f"[{index}/{len(answer_pdfs)}] cached: {cache_path.name} ({len(lines)} lines)",
            flush=True,
        )
        merged_lines.extend(lines)

    question_blocks = split_into_question_blocks(merged_lines)
    print(f"Detected {len(question_blocks)} question blocks from dump OCR.")

    records: list[dict[str, Any]] = []
    parse_failures = 0

    for question_id, block_lines in question_blocks.items():
        parsed = parse_question_block(question_id, block_lines, existing_by_id)

        has_minimum_quality = (
            bool(parsed["pergunta"])
            and len(parsed["opcoes"]) >= 2
            and len(parsed["resposta_correta"]) >= 1
        )

        if not has_minimum_quality:
            parse_failures += 1

        records.append(parsed)

    # Include existing records not found by OCR (safety net).
    existing_missing = sorted(set(existing_by_id.keys()) - {row["id"] for row in records})
    for question_id in existing_missing:
        existing = existing_by_id[question_id]
        correct = sorted(
            set(
                normalize_line(value).upper()
                for value in existing.get("resposta_correta", [])
                if normalize_line(value)
            )
        )
        record = {
            "id": question_id,
            "source_id": question_id,
            "topico": normalize_line(existing.get("topico", "")) or "Uncategorized",
            "pergunta": normalize_line(existing.get("pergunta", "")),
            "opcoes": existing.get("opcoes", []),
            "resposta_correta": correct,
            "question_type": "multi_select" if len(correct) > 1 else "single_choice",
            "status": "ready" if normalize_line(existing.get("pergunta", "")) else "low_confidence",
            "source_dump": {
                "fallback": "existing_json_only",
            },
        }
        records.append(record)

    records.sort(key=lambda row: row["id"])

    payload = {
        "metadata": {
            "source": "ExamTopics answers PDF dump (OCR)",
            "total_questions": len(records),
            "ocr_blocks_found": len(question_blocks),
            "parse_low_quality_count": parse_failures,
            "fallback_from_existing_count": len(existing_missing),
            "ready_count": sum(1 for row in records if row.get("status") == "ready"),
            "missing_answer_key_count": sum(
                1 for row in records if row.get("status") == "missing_answer_key"
            ),
            "low_confidence_count": sum(
                1 for row in records if row.get("status") == "low_confidence"
            ),
        },
        "questoes": records,
    }

    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Done. Output saved to: {output_path}")
    print(json.dumps(payload["metadata"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
