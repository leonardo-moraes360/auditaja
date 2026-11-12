/** Classes dos botões do protótipo (Main.dc.html:58-59), usadas em links com cara de botão. */
export const BOTAO_PRIMARIO =
  "inline-flex h-11 items-center justify-center rounded-[10px] bg-primary px-[18px] text-base font-semibold text-primary-foreground no-underline hover:bg-primaria-hover hover:text-primary-foreground";

export const BOTAO_SECUNDARIO =
  "inline-flex h-11 items-center justify-center rounded-[10px] border border-linha bg-superficie px-[18px] text-base font-semibold text-foreground no-underline hover:bg-muted hover:text-foreground";

/** Filtro (ano, votações): 44 px (alvo de toque); o ativo com borda, negrito e texto da marca sobre primaria-fundo. */
export function classeFiltro(ativo: boolean, pilula = false) {
  return `inline-flex h-11 shrink-0 items-center border px-3 text-base no-underline ${pilula ? "rounded-full" : "rounded-[8px]"} ${
    ativo
      ? "border-primary bg-secondary font-semibold text-secondary-foreground hover:text-secondary-foreground"
      : "border-linha bg-superficie text-texto-2 hover:text-foreground"
  }`;
}
