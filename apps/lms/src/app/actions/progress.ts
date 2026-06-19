// @ts-nocheck
"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function markLessonCompleteAction(formData: FormData) {
  const lessonSlug = String(formData.get("lessonSlug") ?? "");
  const path = String(formData.get("path") ?? "/");

  if (!lessonSlug) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    revalidatePath(path);
    return;
  }

  const { data: lesson } = await supabase
    .from("lms_lessons")
    .select("id")
    .eq("slug", lessonSlug)
    .maybeSingle();

  if (!lesson?.id) {
    revalidatePath(path);
    return;
  }

  await supabase.from("lms_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lesson.id,
      status: "completed",
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  revalidatePath(path);
}
