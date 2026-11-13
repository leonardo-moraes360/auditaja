/** Funções puras do `pnpm versao` (scripts/versao.ts): subir a versão e fechar o CHANGELOG. */

export type TipoVersao = "patch" | "minor" | "major";

export const SECAO_ABERTA = "## [Não publicado]";

export function subirVersao(atual: string, tipo: TipoVersao): string {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(atual.trim());
  if (!m) throw new Error(`Versão fora do semver X.Y.Z: "${atual}"`);
  const [maior, menor, correcao] = m.slice(1).map(Number);
  if (tipo === "major") return `${maior + 1}.0.0`;
  if (tipo === "minor") return `${maior}.${menor + 1}.0`;
  return `${maior}.${menor}.${correcao + 1}`;
}

/**
 * Move as notas de "Não publicado" para uma seção da nova versão e deixa "Não publicado" vazia.
 * Recusa fechar uma versão sem notas, para o CHANGELOG não ganhar entradas vazias.
 */
export function fecharChangelog(texto: string, versao: string, data: string): string {
  const inicio = texto.indexOf(SECAO_ABERTA);
  if (inicio < 0) throw new Error(`CHANGELOG sem a seção "${SECAO_ABERTA}"`);
  const corpoInicio = inicio + SECAO_ABERTA.length;
  const proxima = texto.indexOf("\n## ", corpoInicio);
  const fim = proxima < 0 ? texto.length : proxima + 1;
  const notas = texto.slice(corpoInicio, fim).trim();
  if (!notas) throw new Error(`Nada em "${SECAO_ABERTA}" para publicar em ${versao}`);
  return `${texto.slice(0, inicio)}${SECAO_ABERTA}\n\n## [${versao}] - ${data}\n\n${notas}\n\n${texto.slice(fim)}`;
}
