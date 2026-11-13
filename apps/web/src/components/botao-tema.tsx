"use client";

import { useSyncExternalStore } from "react";

function assinar(aviso: () => void) {
  const obs = new MutationObserver(aviso);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
const lerEscuro = () => document.documentElement.classList.contains("dark");
const lerNoServidor = () => false;

/**
 * Troca entre tema claro e escuro. A escolha fica salva no navegador; o script em layout.tsx
 * aplica a classe .dark antes da pintura. Rótulo em texto e alvo de 44 px (design system).
 */
export function BotaoTema({ className = "" }: { className?: string }) {
  const escuro = useSyncExternalStore(assinar, lerEscuro, lerNoServidor);

  function alternar() {
    const novo = !escuro;
    document.documentElement.classList.toggle("dark", novo);
    try {
      localStorage.setItem("tema", novo ? "escuro" : "claro");
    } catch {
      // Sem armazenamento (navegação privada): vale só nesta página.
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={escuro}
      className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-input bg-superficie px-3 text-sm font-semibold text-foreground hover:bg-muted aria-pressed:border-primary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground ${className}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z" />
      </svg>
      Tema escuro
    </button>
  );
}
