"use client";

import { useEffect, useState } from "react";

type Painel = "busca" | "menu" | null;

/** Topo do celular: "Buscar" e "Menu" abrem a busca e o menu principal abaixo da barra. */
export function TopoMovel({
  logo,
  menu,
  busca,
}: {
  logo: React.ReactNode;
  menu: React.ReactNode;
  busca: React.ReactNode;
}) {
  const [aberto, setAberto] = useState<Painel>(null);
  const alternar = (p: Exclude<Painel, null>) => setAberto((a) => (a === p ? null : p));
  // Abrir "Buscar" leva o foco ao campo, como num botão de busca de app.
  useEffect(() => {
    if (aberto === "busca") document.querySelector<HTMLInputElement>("#topo-busca input")?.focus();
  }, [aberto]);
  return (
    <div className="sm:hidden">
      <div className="flex items-center justify-between px-4 py-2">
        {logo}
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Buscar"
            aria-expanded={aberto === "busca"}
            aria-controls="topo-busca"
            onClick={() => alternar("busca")}
            className="flex size-11 items-center justify-center rounded-[10px]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={aberto === "menu"}
            aria-controls="topo-menu"
            onClick={() => alternar("menu")}
            className="flex size-11 items-center justify-center rounded-[10px]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
      <div id="topo-busca" hidden={aberto !== "busca"} className="border-t px-4 py-3">
        {busca}
      </div>
      <div id="topo-menu" hidden={aberto !== "menu"} className="border-t px-4 py-1">
        {menu}
      </div>
    </div>
  );
}
