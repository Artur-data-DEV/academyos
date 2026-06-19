import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";

export type LessonSummary = {
  slug: string;
  title: string;
  order: number;
  sourcePath: string;
};

export type TrackModule = {
  slug: string;
  title: string;
  order: number;
  lessons: LessonSummary[];
};

export type DetranTrack = {
  slug: "detran-marketplace";
  title: string;
  description: string;
  modules: TrackModule[];
};

export type DetranLesson = LessonSummary & {
  moduleSlug: string;
  moduleTitle: string;
  content: string;
};

const ROOT = path.join(
  process.cwd(),
  "..",
  "..",
  "content",
  "sources",
  "detran-marketplace-docs",
  "docs",
);

const MODULES = [
  { slug: "architecture", title: "Arquitetura", order: 10, dir: "architecture" },
  { slug: "adr", title: "Decisões de Arquitetura", order: 20, dir: "architecture/adr" },
  { slug: "implementation", title: "Implementação", order: 30, dir: "implementation" },
  { slug: "governance", title: "Governança", order: 40, dir: "governance" },
  { slug: "reference", title: "Referência", order: 50, dir: "reference" },
];

export const getDetranTrack = cache(async (): Promise<DetranTrack> => {
  const modules = await Promise.all(
    MODULES.map(async (module) => ({
      slug: module.slug,
      title: module.title,
      order: module.order,
      lessons: await readLessons(module.dir),
    })),
  );

  return {
    slug: "detran-marketplace",
    title: "Vehicle Marketplace (Detran SP)",
    description:
      "Trilha prática de ServiceNow com modelagem de domínio, governança, arquitetura, update sets e documentação técnica do marketplace de veículos.",
    modules: modules.filter((module) => module.lessons.length > 0),
  };
});

export async function getDetranLesson(moduleSlug: string, lessonSlug: string) {
  const track = await getDetranTrack();
  const module = track.modules.find((item) => item.slug === moduleSlug);
  const lesson = module?.lessons.find((item) => item.slug === lessonSlug);

  if (!module || !lesson) {
    return null;
  }

  const content = await fs.readFile(lesson.sourcePath, "utf8");

  return {
    ...lesson,
    moduleSlug: module.slug,
    moduleTitle: module.title,
    content,
  } satisfies DetranLesson;
}

export async function getLessonNeighbors(moduleSlug: string, lessonSlug: string) {
  const track = await getDetranTrack();
  const flat = track.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      ...lesson,
      moduleSlug: module.slug,
    })),
  );
  const index = flat.findIndex(
    (lesson) => lesson.moduleSlug === moduleSlug && lesson.slug === lessonSlug,
  );

  return {
    previous: index > 0 ? flat[index - 1] : null,
    next: index >= 0 && index < flat.length - 1 ? flat[index + 1] : null,
  };
}

async function readLessons(relativeDir: string): Promise<LessonSummary[]> {
  const dir = path.join(ROOT, relativeDir);
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);

  const lessons = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map(async (entry, index) => {
        const sourcePath = path.join(dir, entry.name);
        const content = await fs.readFile(sourcePath, "utf8");
        const slug = entry.name.replace(/\.md$/, "");

        return {
          slug,
          title: extractTitle(content, slug),
          order: extractOrder(entry.name, index),
          sourcePath,
        };
      }),
  );

  return lessons.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

function extractTitle(markdown: string, fallback: string) {
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

function extractOrder(filename: string, index: number) {
  const explicit = filename.match(/(?:ADR-|US-)(\d+)/)?.[1];

  if (explicit) {
    return Number(explicit);
  }

  const preferredOrder = [
    "overview",
    "domain-model",
    "data-model",
    "security-model",
    "integration-architecture",
    "approval-architecture",
    "csdm-mapping",
    "cmdb-mapping",
  ];
  const normalized = filename.replace(/\.md$/, "");
  const preferred = preferredOrder.indexOf(normalized);

  return preferred >= 0 ? preferred : 1000 + index;
}
