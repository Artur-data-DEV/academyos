import { cache } from "react";
import { PrismaClient } from "@academyos/database";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export type LessonSummary = {
  slug: string;
  title: string;
  order: number;
};

export type TrackModule = {
  slug: string;
  title: string;
  order: number;
  lessons: LessonSummary[];
};

export type DetranTrack = {
  slug: string;
  title: string;
  description: string | null;
  modules: TrackModule[];
};

export type DetranLesson = LessonSummary & {
  moduleSlug: string;
  moduleTitle: string;
  content: string;
};

export const getDetranTrack = cache(async (): Promise<DetranTrack> => {
  const track = await prisma.track.findFirst({
    // Fallback if 'detran-marketplace' isn't there, just pick the first track
    orderBy: { createdAt: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!track) {
    return {
      slug: "detran-marketplace",
      title: "Trilha não encontrada no banco",
      description: "Por favor, rode o seed ou insira dados no Neon.",
      modules: [],
    };
  }

  return {
    slug: track.slug,
    title: track.title,
    description: track.description,
    modules: track.modules.map((m) => ({
      slug: m.id, // Usando ID pois não há module.slug no Prisma
      title: m.title,
      order: m.order,
      lessons: m.lessons.map((l) => ({
        slug: l.slug,
        title: l.title,
        order: l.order,
      })),
    })),
  };
});

export async function getDetranLesson(moduleSlug: string, lessonSlug: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: lessonSlug },
    include: { module: true },
  });

  if (!lesson || lesson.module.id !== moduleSlug) {
    return null;
  }

  let contentText = "";
  if (typeof lesson.content === "string") {
    contentText = lesson.content;
  } else if (lesson.content && typeof lesson.content === "object") {
    // Caso seja armazenado como JSON struct {"markdown": "..."}
    contentText = (lesson.content as any).body || (lesson.content as any).markdown || JSON.stringify(lesson.content);
  }

  return {
    slug: lesson.slug,
    title: lesson.title,
    order: lesson.order,
    moduleSlug: lesson.module.id,
    moduleTitle: lesson.module.title,
    content: contentText,
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

