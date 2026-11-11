/**
 * R13: identificação pública do controlador e do encarregado (LGPD).
 * Lida das variáveis `NEXT_PUBLIC_*`; enquanto não forem definidas, mostra placeholders.
 * O acesso a cada variável fica literal para o Next.js embutir o valor no build.
 */
export function responsavel() {
  return {
    controlador: process.env.NEXT_PUBLIC_CONTROLADOR_NOME ?? "[NOME DO CONTROLADOR]",
    doc: process.env.NEXT_PUBLIC_CONTROLADOR_DOC ?? "[CNPJ]",
    encarregado: process.env.NEXT_PUBLIC_ENCARREGADO_NOME ?? "[NOME DO ENCARREGADO]",
    email: process.env.NEXT_PUBLIC_ENCARREGADO_EMAIL ?? "[E-MAIL DO ENCARREGADO]",
  };
}
