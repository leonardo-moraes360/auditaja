import { REPOSITORIO_URL } from "@/lib/licenca";

/** Relato privado de vulnerabilidade (GitHub Private Vulnerability Reporting). */
export const RELATO_SEGURANCA_URL = `${REPOSITORIO_URL}/security/advisories/new`;

/** Política de segurança (SECURITY.md na raiz do repositório). */
export const POLITICA_SEGURANCA_URL = `${REPOSITORIO_URL}/blob/main/SECURITY.md`;

/** Validade do security.txt a partir do build. A RFC 9116 recomenda menos de um ano. */
export const VALIDADE_SECURITY_TXT_DIAS = 180;

/**
 * /.well-known/security.txt (RFC 9116). `Expires` conta a partir do build: se o site ficar meses sem
 * deploy, o arquivo vence e avisa que o contato pode estar desatualizado.
 */
export function securityTxt(base: string, publicadoEm: Date): string {
  const expira = new Date(publicadoEm.getTime() + VALIDADE_SECURITY_TXT_DIAS * 24 * 60 * 60 * 1000);
  return [
    `Contact: ${RELATO_SEGURANCA_URL}`,
    `Expires: ${expira.toISOString().replace(/\.\d{3}Z$/, "Z")}`,
    `Preferred-Languages: pt, en`,
    `Canonical: ${base}/.well-known/security.txt`,
    `Policy: ${POLITICA_SEGURANCA_URL}`,
    "",
  ].join("\n");
}

/** Data do build, embutida pelo next.config.ts. Fora do build (testes, dev sem variável), vale agora. */
export function dataDoBuild(valor: string | undefined = process.env.AUDITAJA_BUILD_EM): Date {
  const d = valor ? new Date(valor) : new Date(NaN);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
