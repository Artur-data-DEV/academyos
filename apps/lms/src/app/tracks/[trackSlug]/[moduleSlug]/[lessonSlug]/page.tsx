import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";

import { Button } from "@academyos/ui/button";
import { markLessonCompleteAction } from "@/app/actions/progress";
import {
  getDetranLesson,
  getDetranTrack,
  getLessonNeighbors,
} from "@/lib/detran-content";

type Props = {
  params: Promise<{
    trackSlug: string;
    moduleSlug: string;
    lessonSlug: string;
  }>;
};

export async function generateStaticParams() {
  const track = await getDetranTrack();

  return track.modules.flatMap((module) =>
    module.lessons.map((lesson) => ({
      trackSlug: track.slug,
      moduleSlug: module.slug,
      lessonSlug: lesson.slug,
    })),
  );
}

export default async function LessonPage({ params }: Props) {
  const { trackSlug, moduleSlug, lessonSlug } = await params;
  const track = await getDetranTrack();
  const lesson = await getDetranLesson(moduleSlug, lessonSlug);
  const neighbors = await getLessonNeighbors(moduleSlug, lessonSlug);

  if (trackSlug !== track.slug || !lesson) {
    return <main className="p-8">Aula não encontrada.</main>;
  }

  const currentPath = `/tracks/${trackSlug}/${moduleSlug}/${lessonSlug}`;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-md border bg-white p-4 lg:sticky lg:top-6">
          <Link
            href={`/tracks/${track.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950"
          >
            <ArrowLeft className="size-4" />
            Voltar para trilha
          </Link>
          <nav className="mt-5 space-y-4">
            {track.modules.map((module) => (
              <section key={module.slug}>
                <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {module.title}
                </h2>
                <div className="mt-2 space-y-1">
                  {module.lessons.map((item) => {
                    const isActive =
                      module.slug === moduleSlug && item.slug === lessonSlug;

                    return (
                      <Link
                        key={item.slug}
                        href={`/tracks/${track.slug}/${module.slug}/${item.slug}`}
                        className={
                          "block rounded-md px-2 py-1.5 text-sm " +
                          (isActive
                            ? "bg-zinc-950 text-white"
                            : "text-zinc-700 hover:bg-zinc-100")
                        }
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <article className="rounded-md border bg-white">
          <header className="border-b p-6">
            <p className="text-sm font-medium text-zinc-500">{lesson.moduleTitle}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              {lesson.title}
            </h1>
            <div className="mt-5 flex flex-wrap gap-3">
              <form action={markLessonCompleteAction}>
                <input type="hidden" name="lessonSlug" value={lesson.slug} />
                <input type="hidden" name="path" value={currentPath} />
                <Button type="submit" variant="outline">
                  <CheckCircle2 />
                  Marcar progresso
                </Button>
              </form>
              <Button asChild variant="ghost">
                <Link href="/simulator/dashboard">
                  Abrir simulador
                  <ExternalLink />
                </Link>
              </Button>
            </div>
          </header>

          <div className="lesson-markdown p-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {lesson.content}
            </ReactMarkdown>
          </div>

          <footer className="flex flex-col gap-3 border-t p-6 sm:flex-row sm:justify-between">
            {neighbors.previous ? (
              <Button asChild variant="outline">
                <Link
                  href={`/tracks/${track.slug}/${neighbors.previous.moduleSlug}/${neighbors.previous.slug}`}
                >
                  Aula anterior
                </Link>
              </Button>
            ) : (
              <span />
            )}
            {neighbors.next ? (
              <Button asChild>
                <Link
                  href={`/tracks/${track.slug}/${neighbors.next.moduleSlug}/${neighbors.next.slug}`}
                >
                  Próxima aula
                </Link>
              </Button>
            ) : null}
          </footer>
        </article>
      </div>
    </main>
  );
}
