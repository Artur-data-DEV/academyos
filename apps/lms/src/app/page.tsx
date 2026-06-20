import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, Route, TimerReset } from "lucide-react";

import { Button } from "@academyos/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@academyos/ui/card";
import { Badge } from "@academyos/ui/badge";
import { getServiceNowTrack } from "@/lib/servicenow-content";

export default async function Home() {
  const track = await getServiceNowTrack();
  const lessonCount = track.modules.reduce(
    (total, module) => total + module.lessons.length,
    0,
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 inline-flex items-center gap-2">
              <Route className="size-3.5" />
              Primeira trilha
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {track.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              {track.description}
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href={`/tracks/${track.slug}`}>
              Abrir trilha
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-6 md:grid-cols-3">
        <Metric icon={Layers3} label="Módulos" value={track.modules.length} />
        <Metric icon={BookOpen} label="Aulas" value={lessonCount} />
        <Metric icon={TimerReset} label="Fonte" value="Banco Neon (Prisma)" />
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-4 px-6 pb-10 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground">Módulos</h2>
          <nav className="mt-3 space-y-2">
            {track.modules.map((module) => (
              <Link
                key={module.slug}
                href={`/tracks/${track.slug}/${module.slug}/${module.lessons[0]?.slug ?? ""}`}
                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
              >
                {module.title}
              </Link>
            ))}
          </nav>
        </aside>
        
        <div className="grid gap-4 md:grid-cols-2">
          {track.modules.map((module) => (
            <Card key={module.slug} className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{module.title}</CardTitle>
                <CardDescription>{module.lessons.length} aulas</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {module.lessons.slice(0, 5).map((lesson) => (
                    <li key={lesson.slug}>
                      <Link
                        href={`/tracks/${track.slug}/${module.slug}/${lesson.slug}`}
                        className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                      >
                        <span className="truncate">{lesson.title}</span>
                        <ArrowRight className="size-3.5 shrink-0 opacity-50" />
                      </Link>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Layers3;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-xl font-semibold text-card-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
