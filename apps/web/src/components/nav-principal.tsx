"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/parlamentares", rotulo: "Parlamentares" },
  { href: "/metodologia", rotulo: "Metodologia" },
  { href: "/sobre", rotulo: "Sobre" },
] as const;

/** Menu principal; a página ativa ganha sublinhado na cor da marca, como no protótipo. */
export function NavPrincipal() {
  return <Itens pathname={usePathname()} />;
}

/** Fallback do prerender: mesmos links, sem item ativo. */
export function NavPrincipalEstatica() {
  return <Itens pathname="" />;
}

function Itens({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Principal" className="flex flex-wrap gap-x-5 gap-y-1 text-base font-medium">
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
