"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/parlamentares", rotulo: "Parlamentares" },
  { href: "/metodologia", rotulo: "Metodologia" },
  { href: "/fontes", rotulo: "Fontes" },
] as const;

/** Menu principal; a página ativa ganha sublinhado na cor da marca, como no protótipo. */
export function NavPrincipal() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-wrap gap-x-5 gap-y-1 text-[15px] font-medium">
      {ITENS.map(({ href, rotulo }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className={`border-b-2 py-2.5 no-underline ${
              ativo
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
