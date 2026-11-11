import type { ClasseTitular } from "@/db/types";

export function soDigitos(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

/**
 * R3: CPF de terceiro pessoa física no padrão da Receita Federal (`***.456.789-**`).
 * Mantém só os 6 dígitos centrais. Nunca devolve o CPF completo.
 */
export function mascararCpf(cpf: string): string {
  const d = soDigitos(cpf).padStart(11, "0").slice(-11);
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

export function formatarCnpj(cnpj: string): string {
  const d = soDigitos(cnpj).padStart(14, "0").slice(-14);
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * Classifica o documento de um fornecedor e devolve a forma publicável.
 * 11 dígitos = CPF (terceiro PF, mascarado); 14 = CNPJ (público).
 * Qualquer outra coisa não é exibida.
 */
export function documentoPublicavel(raw: string | null | undefined): {
  doc: string | null;
  classe: ClasseTitular;
} {
  const d = soDigitos(raw);
  if (d.length === 14) return { doc: formatarCnpj(d), classe: "pessoa_juridica" };
  if (d.length === 11) return { doc: mascararCpf(d), classe: "terceiro_pf" };
  return { doc: null, classe: "desconhecido" };
}

/**
 * R3: nome de fornecedor pessoa física também é dado de terceiro.
 * Exibimos um rótulo genérico; o documento mascarado continua visível.
 */
export function nomeFornecedorPublicavel(nome: string, classe: ClasseTitular): string {
  return classe === "terceiro_pf" ? "Prestador pessoa física" : nome.trim();
}
