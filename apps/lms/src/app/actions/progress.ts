"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@academyos/database";
import { auth } from "@academyos/auth";

export async function markLessonCompleteAction(formData: FormData) {
  const lessonSlug = String(formData.get("lessonSlug") ?? "");
  const path = String(formData.get("path") ?? "/");

  if (!lessonSlug) {
    return;
  }

  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    revalidatePath(path);
    return;
  }

  const lesson = await prisma.lesson.findUnique({
    where: { slug: lessonSlug },
    select: { id: true },
  });

  if (!lesson?.id) {
    revalidatePath(path);
    return;
  }

  await prisma.progress.upsert({
    where: {
      userId_lessonId: {
        userId: user.id,
        lessonId: lesson.id,
      },
    },
    update: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
    create: {
      userId: user.id,
      lessonId: lesson.id,
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });

  revalidatePath(path);
}
