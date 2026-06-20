import Link from "next/link";
import { ArrowRight, BookOpen, Layers3 } from "lucide-react";

import { redirect } from "next/navigation";
import { getServiceNowTrack } from "@/lib/servicenow-content";
import { Card, CardContent, CardHeader, CardTitle } from "@academyos/ui/card";
import { Badge } from "@academyos/ui/badge";

type Props = {
  params: Promise<{ trackSlug: string }>;
};

export default async function TrackPage({ params }: Props) {
  const { trackSlug } = await params;
  const track = await getServiceNowTrack();

  if (trackSlug !== track.slug) {
    if (trackSlug === "detran-marketplace") {
      redirect(`/tracks/${track.slug}`);
    }
    return <main className="p-8 text-foreground">Trilha não encontrada.</main>;
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          AcademyOS
        </Link>
        <Card className="mt-5 shadow-sm">
          <CardContent className="p-6">
            <h1 className="text-3xl font-semibold tracking-tight text-card-foreground">
              {track.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {track.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Badge variant="secondary" className="gap-2 px-2.5 py-1 text-sm font-normal">
                <Layers3 className="size-4" />
                {track.modules.length} módulos
              </Badge>
              <Badge variant="secondary" className="gap-2 px-2.5 py-1 text-sm font-normal">
                <BookOpen className="size-4" />
                {track.modules.reduce((total, module) => total + module.lessons.length, 0)} aulas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {track.modules.map((module) => (
            <Card key={module.slug} className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {module.lessons.map((lesson) => (
                    <li key={lesson.slug}>
                      <Link
                        href={`/tracks/${track.slug}/${module.slug}/${lesson.slug}`}
                        className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                      >
                        <span>{lesson.title}</span>
                        <ArrowRight className="size-4 shrink-0 opacity-50" />
                      </Link>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
