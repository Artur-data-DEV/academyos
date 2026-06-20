import Link from "next/link";
import { ArrowRight, BookOpen, Layers3, Route, TimerReset } from "lucide-react";

import { Button } from "@academyos/ui/button";
import { getDetranTrack } from "@/lib/detran-content";

export default async function Home() {
  const track = await getDetranTrack();
  const lessonCount = track.modules.reduce(
    (total, module) => total + module.lessons.length,
    0,
  );

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">
              <Route className="size-3.5" />
              Primeira trilha
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 md:text-4xl">
              {track.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 md:text-base">
              {track.description}
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={`/tracks/${track.slug}`}>
              Abrir trilha
              <ArrowRight />
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
        <aside className="h-fit rounded-md border bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-950">Módulos</h2>
          <nav className="mt-3 space-y-2">
            {track.modules.map((module) => (
              <Link
                key={module.slug}
                href={`/tracks/${track.slug}/${module.slug}/${module.lessons[0]?.slug ?? ""}`}
                className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
              >
                {module.title}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="grid gap-4 md:grid-cols-2">
          {track.modules.map((module) => (
            <section key={module.slug} className="rounded-md border bg-white p-4">
              <h3 className="font-semibold text-zinc-950">{module.title}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {module.lessons.length} aulas
              </p>
              <ol className="mt-4 space-y-2">
                {module.lessons.slice(0, 5).map((lesson) => (
                  <li key={lesson.slug}>
                    <Link
                      href={`/tracks/${track.slug}/${module.slug}/${lesson.slug}`}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      <span className="truncate">{lesson.title}</span>
                      <ArrowRight className="size-3.5 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
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
    <div className="rounded-md border bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-700">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {label}
          </p>
          <p className="text-lg font-semibold text-zinc-950">{value}</p>
        </div>
      </div>
    </div>
  );
}
