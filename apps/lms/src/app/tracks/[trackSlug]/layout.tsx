import React from 'react';
import { prisma } from '@academyos/database';

// Tipamos os params considerando o Next.js 16/15 com params via Promises
export default async function TrackLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ trackSlug: string }>;
}) {
  const resolvedParams = await params;
  
  // Buscar a trilha e seus módulos para a Sidebar (Server Component)
  const track = await prisma.track.findUnique({
    where: { slug: resolvedParams.trackSlug },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!track) {
    return <div>Trilha não encontrada.</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Coluna 1: Sidebar de Navegação (Server Component) */}
      <aside className="w-64 border-r bg-white shrink-0 sticky top-0 h-screen overflow-y-auto p-4 hidden md:block">
        <h2 className="font-bold text-lg mb-4">{track.title}</h2>
        <nav className="space-y-4">
          {track.modules.map((module) => (
            <div key={module.id} className="space-y-2">
              <h3 className="font-semibold text-sm text-gray-700">{module.title}</h3>
              <ul className="pl-4 space-y-1 border-l-2 border-gray-100">
                {module.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <a
                      href={`/tracks/${track.slug}/${module.id}/${lesson.slug}`}
                      className="text-sm text-gray-600 hover:text-blue-600 hover:underline block py-1"
                    >
                      {lesson.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Coluna 2: Main Content (Aula) */}
      <main className="flex-1 max-w-4xl px-4 md:px-8 py-8 w-full">
        {children}
      </main>

      {/* Coluna 3: TOC Dinâmico */}
      {/* Aqui idealmente usaríamos um Client Component que faz scroll-spy.
          Por MVP, colocamos o container que a lição pode usar para renderizar. */}
      <aside className="w-64 hidden lg:block sticky top-0 h-screen overflow-y-auto p-6 border-l bg-white shrink-0">
        <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider text-gray-500">
          Nesta página
        </h4>
        <div id="toc-container" className="text-sm text-gray-600 space-y-2">
          {/* TOC Client Component será injetado aqui ou renderizado pelo próprio conteúdo */}
          <p className="text-xs italic">O índice será gerado dinamicamente.</p>
        </div>
      </aside>
    </div>
  );
}
