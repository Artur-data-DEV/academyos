import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "apps",
  "lms",
  "content",
  "sources",
  "servicenow-marketplace-docs",
  "docs",
);

const modules = [
  { slug: "architecture", title: "Arquitetura", order: 10, dir: "architecture" },
  { slug: "adr", title: "Decisões de Arquitetura", order: 20, dir: "architecture/adr" },
  { slug: "implementation", title: "Implementação", order: 30, dir: "implementation" },
  { slug: "governance", title: "Governança", order: 40, dir: "governance" },
  { slug: "reference", title: "Referência", order: 50, dir: "reference" },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    "Configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing.",
  );
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const track = {
  slug: "servicenow-vehicle-marketplace",
  title: "ServiceNow Vehicle Marketplace Capstone",
  description:
    "Trilha prática de ServiceNow com modelagem de domínio, governança, arquitetura, update sets e documentação técnica.",
  status: "published",
};

const { data: trackRow, error: trackError } = await supabase
  .from("lms_tracks")
  .upsert(track, { onConflict: "slug" })
  .select("id")
  .single();

if (trackError) {
  throw trackError;
}

for (const module of modules) {
  const { data: moduleRow, error: moduleError } = await supabase
    .from("lms_modules")
    .upsert(
      {
        track_id: trackRow.id,
        slug: module.slug,
        title: module.title,
        position: module.order,
      },
      { onConflict: "track_id,slug" },
    )
    .select("id")
    .single();

  if (moduleError) {
    throw moduleError;
  }

  const lessons = await readLessons(module.dir);

  for (const lesson of lessons) {
    const { error: lessonError } = await supabase.from("lms_lessons").upsert(
      {
        module_id: moduleRow.id,
        slug: lesson.slug,
        title: lesson.title,
        position: lesson.order,
        source_type: "imported_md",
        source_path: lesson.sourcePath,
        content_markdown: lesson.content,
        content_json: {
          type: "markdown",
          sourcePath: lesson.sourcePath,
          body: lesson.content,
        },
      },
      { onConflict: "module_id,slug" },
    );

    if (lessonError) {
      throw lessonError;
    }
  }
}

console.log("Imported ServiceNow Vehicle Marketplace track into Supabase.");

async function readLessons(relativeDir) {
  const dir = path.join(root, relativeDir);
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const lessons = [];

  for (const [index, entry] of entries.entries()) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const sourcePath = path.join("docs", relativeDir, entry.name).replaceAll("\\", "/");
    const absolutePath = path.join(dir, entry.name);
    const content = await fs.readFile(absolutePath, "utf8");
    const slug = entry.name.replace(/\.md$/, "");

    lessons.push({
      slug,
      title: extractTitle(content, slug),
      order: extractOrder(entry.name, index),
      content,
      sourcePath,
    });
  }

  return lessons.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function extractTitle(markdown, fallback) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();

  if (heading) {
    return heading.replace(/\s+—\s+/g, " - ");
  }

  return fallback
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractOrder(filename, index) {
  const explicit = filename.match(/(?:ADR-|US-)(\d+)/)?.[1];

  return explicit ? Number(explicit) : 1000 + index;
}
