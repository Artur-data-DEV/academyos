import Link from "next/link";
import { MarkdownText } from "@academyos/ui/markdown";
import { ArrowLeft, CheckCircle2, ExternalLink, ChevronDown } from "lucide-react";

import { Button } from "@academyos/ui/button";
import { markLessonCompleteAction } from "@/app/actions/progress";
import { redirect } from "next/navigation";
import {
  getServiceNowTrack,
  getServiceNowLesson,
  getLessonNeighbors,
  getLessonRouteMap,
} from "@/lib/servicenow-content";

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
  const track = await getServiceNowTrack();
  const lesson = await getServiceNowLesson(moduleSlug, lessonSlug);
  const neighbors = await getLessonNeighbors(moduleSlug, lessonSlug);

  if (trackSlug !== track.slug || !lesson) {
    if (trackSlug === "detran-marketplace" && lesson) {
      redirect(`/tracks/${track.slug}/${moduleSlug}/${lessonSlug}`);
    }
    return <main className="p-8 text-foreground">Aula não encontrada.</main>;
  }

  const currentPath = `/tracks/${trackSlug}/${moduleSlug}/${lessonSlug}`;

  // Pre-process markdown relative links
  const routeMap = await getLessonRouteMap(trackSlug);
  let finalContent = lesson.content;

  if (lesson.sourcePath) {
    const basePathParts = lesson.sourcePath.split("/");
    basePathParts.pop(); // Remove the filename to get the directory

    finalContent = finalContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, href) => {
      // Ignore absolute URLs and anchors
      if (href.startsWith("http") || href.startsWith("#") || href.startsWith("/")) {
        return match;
      }

      // Calculate the virtual absolute path inside the docs folder
      // e.g., href = "../overview.md", basePathParts = ["docs", "architecture"]
      const targetParts = [...basePathParts];
      const hrefParts = href.split("/");

      for (const part of hrefParts) {
        if (part === "..") {
          targetParts.pop();
        } else if (part !== ".") {
          targetParts.push(part);
        }
      }

      let absoluteTarget = targetParts.join("/");
      if (!absoluteTarget.endsWith(".md")) {
        absoluteTarget += ".md";
      }

      const mappedUrl = routeMap[absoluteTarget];
      if (mappedUrl) {
        return `[${text}](${mappedUrl})`;
      }

      return match;
    });
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit max-h-[calc(100vh-3rem)] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 rounded-xl border border-border bg-card/80 backdrop-blur-md p-5 shadow-sm lg:sticky lg:top-6 transition-all duration-300 hover:shadow-md hover:border-primary/20">
          <Link
            href={`/tracks/${track.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Voltar para trilha
          </Link>
          <nav className="mt-6 space-y-3">
            {track.modules.map((module) => {
              const isActiveModule = module.slug === moduleSlug;
              return (
                <details key={module.slug} open={isActiveModule} className="group">
                  <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 hover:bg-secondary/50 hover:text-foreground transition-colors">
                    {module.title}
                    <ChevronDown className="size-3.5 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="mt-1 space-y-1 pl-1 border-l-2 border-border/50 ml-2">
                    {module.lessons.map((item) => {
                      const isActiveLesson = isActiveModule && item.slug === lessonSlug;

                      return (
                        <Link
                          key={item.slug}
                          href={`/tracks/${track.slug}/${module.slug}/${item.slug}`}
                          className={
                            "block rounded-lg px-3 py-2 text-sm transition-all duration-300 " +
                            (isActiveLesson
                              ? "bg-primary/10 text-primary font-semibold shadow-sm ring-1 ring-primary/20"
                              : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:translate-x-1")
                          }
                        >
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              );
            })}
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
            <MarkdownText content={finalContent} />
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
