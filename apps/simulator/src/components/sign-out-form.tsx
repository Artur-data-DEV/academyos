"use client";

import type { FormEvent } from "react";

import { signOutAction } from "@/app/actions/auth-actions";
import { Button } from "@/components/ui/button";

export function SignOutForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm("Tem certeza de que deseja sair?");

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form action={signOutAction} onSubmit={handleSubmit}>
      <Button variant="ghost" type="submit" className="cursor-pointer">
        Sair
      </Button>
    </form>
  );
}
