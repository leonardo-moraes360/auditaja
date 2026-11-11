"use client";

import { useEffect, useRef, useState } from "react";

const ABAS = [
  { id: "gastos", rotulo: "Gastos da cota", curto: "Gastos" },
  { id: "votacoes", rotulo: "Votações", curto: "Votações" },
  { id: "bens", rotulo: "Bens declarados", curto: "Bens" },
  { id: "mandato", rotulo: "Mandato", curto: "Mandato" },
  { id: "fontes", rotulo: "Fontes", curto: "Fontes" },
] as const;

type Id = (typeof ABAS)[number]["id"];

/** Linha de leitura: a seção ativa é a última cujo topo passou de 30% da altura da tela. */
const LINHA = 0.3;

/**
 * Seção ativa pela rolagem. No desktop Mandato e Fontes ficam na lateral, ao lado de Gastos: a rolagem
 * escolhe entre as seções da coluna principal, e as da lateral ficam ativas quando são o destino de
 * um clique (ou do #hash) até a pessoa rolar para longe delas.
 */
function secaoPelaRolagem(lateralVisivel: boolean): Id {
  const linha = window.innerHeight * LINHA;
  const ids: Id[] = lateralVisivel ? ["gastos", "votacoes", "bens"] : ABAS.map((a) => a.id);
  let ativa: Id = ids[0];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= linha) ativa = id;
  }
  // No fim da página, a última seção da coluna fica ativa mesmo sem cruzar a linha.
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) ativa = ids.at(-1)!;
  return ativa;
}

/** Abas de seção do perfil; a ativa acompanha a seção visível. */
export function AbasSecoes() {
  const [ativa, setAtiva] = useState<Id>("gastos");
  const fixada = useRef<{ id: Id; y: number } | null>(null);
  // Depois do clique, o navegador rola até a seção; fixa a aba no destino quando a rolagem assenta.
  const aoClicar = (id: Id) => {
    setAtiva(id);
    window.setTimeout(() => {
      fixada.current = { id, y: window.scrollY };
      setAtiva(id);
    }, 60);
  };

  useEffect(() => {
    const lateralAoLado = () => {
      const g = document.getElementById("gastos");
      const m = document.getElementById("mandato");
      return !!g && !!m && m.getBoundingClientRect().left > g.getBoundingClientRect().right - 1;
    };
    const atualizar = () => {
      const lado = lateralAoLado();
      const f = fixada.current;
      if (f && lado && Math.abs(window.scrollY - f.y) < 200) return setAtiva(f.id);
      fixada.current = null;
      setAtiva(secaoPelaRolagem(lado));
    };
    const deHash = () => {
      const id = window.location.hash.slice(1) as Id;
      if (ABAS.some((a) => a.id === id)) {
        // A rolagem do âncora termina depois do evento: fixa no destino.
        requestAnimationFrame(() => {
          fixada.current = { id, y: window.scrollY };
          setAtiva(id);
        });
      }
    };
    deHash();
    if (!window.location.hash) atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    window.addEventListener("hashchange", deHash);
    return () => {
      window.removeEventListener("scroll", atualizar);
      window.removeEventListener("resize", atualizar);
      window.removeEventListener("hashchange", deHash);
    };
  }, []);

  return (
    <nav
      aria-label="Seções do perfil"
      className="flex gap-1 overflow-x-auto border-b bg-superficie px-2 sm:my-5 sm:bg-transparent sm:px-0"
    >
      {ABAS.map((a) => {
        const on = a.id === ativa;
        return (
          <a
            key={a.id}
            href={`#${a.id}`}
            aria-current={on ? "location" : undefined}
            onClick={() => aoClicar(a.id)}
            className={`border-b-2 px-2.5 py-3 text-sm whitespace-nowrap no-underline sm:px-4 sm:text-[15px] ${
              on
                ? "border-primary font-semibold text-primary hover:text-primary"
                : "border-transparent font-normal text-muted-foreground hover:text-foreground sm:font-medium"
            }`}
          >
            <span className="sm:hidden">{a.curto}</span>
            <span className="hidden sm:inline">{a.rotulo}</span>
          </a>
        );
      })}
    </nav>
  );
}
