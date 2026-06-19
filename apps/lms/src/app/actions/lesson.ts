'use server';

import { prisma } from '@academyos/database';
import { requireRole } from '@academyos/auth/src/requireRole';
import { revalidatePath } from 'next/cache';

// Exemplo de como a aula é salva usando Tiptap/ProseMirror JSON
export async function saveLesson(
  moduleId: string,
  title: string,
  slug: string,
  contentJson: any
) {
  // Apenas instrutores ou admins podem salvar conteúdo
  await requireRole(['ADMIN', 'INSTRUCTOR']);

  const lesson = await prisma.lesson.upsert({
    where: { slug },
    create: {
      title,
      slug,
      moduleId,
      content: contentJson,
      sourceType: 'NATIVE',
    },
    update: {
      title,
      content: contentJson,
    },
  });

  revalidatePath(`/tracks`);
  return lesson;
}
