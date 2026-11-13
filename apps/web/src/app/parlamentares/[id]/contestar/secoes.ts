export const SECOES = {
  gastos: "Gastos da cota (CEAP)",
  emendas: "Emendas e sanções",
  votacoes: "Votações",
  bens: "Bens declarados",
  trilha: "Para onde foi o dinheiro (indícios das emendas Pix)",
  mandato: "Mandato e comissões",
  outro: "Outro",
} as const;

/** Rótulos do formulário conforme a Casa: a cota do Senado é a CEAPS. */
export function secoesDaCasa(casa: string): Record<keyof typeof SECOES, string> {
  return casa === "senado" ? { ...SECOES, gastos: "Gastos da cota (CEAPS)" } : { ...SECOES };
}
