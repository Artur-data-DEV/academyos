import Link from "next/link";
import { ArrowRight, BookOpen, Layers3 } from "lucide-react";

import { getDetranTrack } from "@/lib/detran-content";

type Props = {
  params: Promise<{ trackSlug: string }>;
};

export default async function TrackPage({ params }: Props) {
  const { trackSlug } = await params;
  const track = await getDetranTrack();

  if (trackSlug !== track.slug) {
    return <main className="p-8">Trilha não encontrada.</main>;
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <Link href="/" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
          AcademyOS
        </Link>
        <div className="mt-5 rounded-md border bg-white p-6">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            {track.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">
            {track.description}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-zinc-600">
            <span className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1">
              <Layers3 className="size-4" />
              {track.modules.length} módulos
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1">
              <BookOpen className="size-4" />
              {track.modules.reduce((total, module) => total + module.lessons.length, 0)} aulas
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {track.modules.map((module) => (
            <section key={module.slug} className="rounded-md border bg-white p-5">
              <h2 className="font-semibold text-zinc-950">{module.title}</h2>
              <ol className="mt-4 space-y-2">
                {module.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link
                      href={`/tracks/${track.slug}/${module.slug}/${lesson.slug}`}
                      className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      <span>{lesson.title}</span>
                      <ArrowRight className="size-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
