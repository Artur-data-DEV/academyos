"use client";

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

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-[#FFD369] bg-[#FFD369] text-[#171819] hover:bg-[#EBB91B]"
                : "border-transparent text-[#D1D7DD] hover:border-[#FFD369] hover:bg-[#303031] hover:text-[#F8F8F8]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

