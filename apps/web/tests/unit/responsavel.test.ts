import { afterEach, describe, expect, it, vi } from "vitest";
import { responsavel } from "@/lib/responsavel";

describe("R13: responsáveis exibidos no rodapé e na política de privacidade", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("usa placeholders enquanto as variáveis não estão definidas", () => {
    for (const k of [
      "NEXT_PUBLIC_CONTROLADOR_NOME",
      "NEXT_PUBLIC_CONTROLADOR_DOC",
      "NEXT_PUBLIC_ENCARREGADO_NOME",
      "NEXT_PUBLIC_ENCARREGADO_EMAIL",
    ]) {
      vi.stubEnv(k, undefined);
    }
    expect(responsavel()).toEqual({
      controlador: "[NOME DO CONTROLADOR]",
      doc: "CNPJ [CNPJ]",
      encarregado: "[NOME DO ENCARREGADO]",
      email: "[E-MAIL DO ENCARREGADO]",
    });
  });

  it("lê as variáveis NEXT_PUBLIC_* quando definidas", () => {
    vi.stubEnv("NEXT_PUBLIC_CONTROLADOR_NOME", "Controlador Fictício");
    vi.stubEnv("NEXT_PUBLIC_CONTROLADOR_DOC", "00.000.000/0001-00");
    vi.stubEnv("NEXT_PUBLIC_ENCARREGADO_NOME", "Encarregado Fictício");
    vi.stubEnv("NEXT_PUBLIC_ENCARREGADO_EMAIL", "dpo@exemplo.invalid");
    expect(responsavel()).toEqual({
      controlador: "Controlador Fictício",
      doc: "CNPJ 00.000.000/0001-00",
      encarregado: "Encarregado Fictício",
      email: "dpo@exemplo.invalid",
    });
  });
});
