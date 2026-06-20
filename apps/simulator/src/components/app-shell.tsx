import type { ReactNode } from "react";

import { NavLinks } from "@/components/nav-links";
import { MobileMenu } from "@/components/mobile-menu";
import { SignOutForm } from "@/components/sign-out-form";

type AppShellProps = {
  children: ReactNode;
  email: string;
};

export function AppShell({ children, email }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-0 z-20 border-b border-[#303031] bg-[#171819]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:py-4">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-[#F8F8F8] md:text-lg">
              Ultimate Simulator Experience
            </h1>
            <p className="truncate text-xs text-[#D1D7DD]">{email}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex">
              <NavLinks />
            </div>
            <MobileMenu />
            <SignOutForm />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}


