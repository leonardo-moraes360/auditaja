/** Classes dos botões do protótipo (Main.dc.html:58-59), usadas em links com cara de botão. */
export const BOTAO_PRIMARIO =
  "inline-flex h-11 items-center justify-center rounded-[10px] bg-primary px-[18px] text-sm font-semibold text-primary-foreground no-underline hover:bg-[#163a9c] hover:text-primary-foreground";

export const BOTAO_SECUNDARIO =
  "inline-flex h-11 items-center justify-center rounded-[10px] border border-linha bg-superficie px-[18px] text-sm font-semibold text-foreground no-underline hover:bg-background hover:text-foreground";

/** Filtro (ano, votações): 36 px; o ativo com borda e texto da marca sobre #E8EEFC. */
export function classeFiltro(ativo: boolean, pilula = false) {
  return `inline-flex h-9 items-center border px-3 text-[13px] no-underline ${pilula ? "rounded-full" : "rounded-[8px]"} ${
    ativo
      ? "border-primary bg-secondary font-semibold text-primary hover:text-primary"
      : "border-linha bg-superficie text-texto-2 hover:text-foreground"
  }`;
}
