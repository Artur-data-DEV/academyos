import Link from "next/link";
import { MarkdownText } from "@academyos/ui/markdown";
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

// generateStaticParams removed to allow dynamic SSR

export default async function LessonPage({ params }: Props) {
  const { trackSlug, moduleSlug, lessonSlug } = await params;
  const track = await getDetranTrack();
  const lesson = await getDetranLesson(moduleSlug, lessonSlug);
  const neighbors = await getLessonNeighbors(moduleSlug, lessonSlug);

  if (trackSlug !== track.slug || !lesson) {
    return <main className="p-8 text-foreground">Aula não encontrada.</main>;
  }

  const currentPath = `/tracks/${trackSlug}/${moduleSlug}/${lessonSlug}`;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-xl border border-border bg-card/80 backdrop-blur-md p-5 shadow-sm lg:sticky lg:top-6 transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <Link
            href={`/tracks/${track.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Voltar para trilha
          </Link>
          <nav className="mt-6 space-y-5">
            {track.modules.map((module) => (
              <section key={module.slug}>
                <h2 className="px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
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
                          "block rounded-lg px-3 py-2 text-sm transition-all duration-300 " +
                          (isActive
                            ? "bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary/20"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:translate-x-1")
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

        <article className="rounded-lg border border-border bg-card shadow-sm">
          <header className="border-b border-border p-6">
            <p className="text-sm font-medium text-muted-foreground">{lesson.moduleTitle}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
              {lesson.title}
            </h1>
            <div className="mt-5 flex flex-wrap gap-3">
              <form action={markLessonCompleteAction}>
                <input type="hidden" name="lessonSlug" value={lesson.slug} />
                <input type="hidden" name="path" value={currentPath} />
                <Button type="submit" variant="outline" className="gap-2">
                  <CheckCircle2 className="size-4" />
                  Marcar progresso
                </Button>
              </form>
              <Button asChild variant="ghost" className="gap-2">
                <Link href="/simulator/dashboard">
                  Abrir simulador
                  <ExternalLink className="size-4" />
                </Link>
              </Button>
            </div>
          </header>

          <div className="p-6">
            <MarkdownText content={lesson.content} />
          </div>

          <footer className="flex flex-col gap-3 border-t border-border p-6 sm:flex-row sm:justify-between">
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
