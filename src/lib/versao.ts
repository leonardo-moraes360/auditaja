/**
 * Versão do site (semver, `package.json`) e hash curto do commit, embutidos no build pelo
 * `next.config.ts`. Sem git no build, o commit fica vazio e o rodapé mostra só a versão.
 * O acesso a cada variável fica literal para o Next.js embutir o valor no build.
 */
export function versaoDoSite() {
  return montarVersao(process.env.NEXT_PUBLIC_VERSAO, process.env.NEXT_PUBLIC_COMMIT);
}

export function montarVersao(versao: string | undefined, commit: string | undefined) {
  const v = versao?.trim() || "0.0.0";
  const c = commit?.trim() || null;
  return { versao: v, commit: c, rotulo: c ? `v${v} · ${c}` : `v${v}` };
}
