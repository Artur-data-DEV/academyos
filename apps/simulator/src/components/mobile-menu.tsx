"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/format";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/new", label: "Novo simulado" },
  { href: "/historico", label: "Histórico" },
  { href: "/estatisticas", label: "Estatísticas" },
  { href: "/revisao-erros", label: "Revisão de erros" },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col gap-1.5 p-2"
        aria-label="Menu"
      >
        <span
          className={cn(
            "block h-0.5 w-6 bg-[#F8F8F8] transition-all",
            isOpen && "translate-y-2 rotate-45",
          )}
        />
        <span
          className={cn(
            "block h-0.5 w-6 bg-[#F8F8F8] transition-all",
            isOpen && "opacity-0",
          )}
        />
        <span
          className={cn(
            "block h-0.5 w-6 bg-[#F8F8F8] transition-all",
            isOpen && "-translate-y-2 -rotate-45",
          )}
        />
      </button>

      {isOpen && (
        <nav className="absolute left-0 right-0 top-full border-b border-[#303031] bg-[#171819] p-4">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4">
            {links.map((link) => {
              const active =
                pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "border-[#FFD369] bg-[#FFD369] text-[#171819]"
                      : "border-[#555] text-[#D1D7DD] hover:border-[#FFD369] hover:bg-[#303031] hover:text-[#F8F8F8]",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
