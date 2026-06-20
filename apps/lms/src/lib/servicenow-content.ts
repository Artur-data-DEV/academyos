import { cache } from "react";
import { prisma } from "@academyos/database";

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

export type ServiceNowTrack = {
  slug: string;
  title: string;
  description: string | null;
  modules: TrackModule[];
};

export type ServiceNowLesson = LessonSummary & {
  moduleSlug: string;
  moduleTitle: string;
  content: string;
  sourcePath: string | null;
};

export const getServiceNowTrack = cache(async (): Promise<ServiceNowTrack> => {
  const track = await prisma.track.findUnique({
    where: { slug: "servicenow-vehicle-marketplace" },
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
      slug: "servicenow-vehicle-marketplace",
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

export async function getServiceNowLesson(moduleSlug: string, lessonSlug: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: lessonSlug },
    include: { module: true },
  });

  if (!lesson || lesson.module.id !== moduleSlug) {
    return null;
  }

  let contentText = "";
  let sourcePath = null;
  
  if (typeof lesson.content === "string") {
    contentText = lesson.content;
  } else if (lesson.content && typeof lesson.content === "object") {
    const jsonContent = lesson.content as any;
    contentText = jsonContent.body || jsonContent.markdown || JSON.stringify(lesson.content);
    sourcePath = jsonContent.sourcePath || null;
  }

  return {
    slug: lesson.slug,
    title: lesson.title,
    order: lesson.order,
    moduleSlug: lesson.module.id,
    moduleTitle: lesson.module.title,
    content: contentText,
    sourcePath,
  } satisfies ServiceNowLesson;
}

export async function getLessonNeighbors(moduleSlug: string, lessonSlug: string) {
  const track = await getServiceNowTrack();
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

export const getLessonRouteMap = cache(async (trackSlug: string) => {
  const lessons = await prisma.lesson.findMany({
    where: { module: { track: { slug: trackSlug } } },
    select: { slug: true, moduleId: true, content: true },
  });

  const routeMap: Record<string, string> = {};
  for (const l of lessons) {
    const sourcePath = (l.content as any)?.sourcePath;
    if (sourcePath) {
      routeMap[sourcePath] = `/tracks/${trackSlug}/${l.moduleId}/${l.slug}`;
    }
  }
  return routeMap;
});
