import { describe, expect, it } from "vitest";
import { mascararCpfsNoTexto } from "@/lib/privacy";
import { favorecidoPublicavel } from "@/lib/emendas";

/** R3/AD-002 em nomes de favorecidos e sancionados: casos que a verificação 4 apontou. */
describe("mascararCpfsNoTexto", () => {
  it("mascara todos os CPFs do texto, não só o primeiro", () => {
    expect(mascararCpfsNoTexto("A 12345678901 E B 987.654.321-00")).toBe("A ***.***.***-** E B ***.***.***-**");
  });
  it("mascara CPF com hífens ou separadores duplos entre os grupos", () => {
    expect(mascararCpfsNoTexto("FULANO 123-456-789-01")).toBe("FULANO ***.***.***-**");
    expect(mascararCpfsNoTexto("FULANO 123  456.789-01")).toBe("FULANO ***.***.***-**");
    expect(mascararCpfsNoTexto("FULANO 123. 456. 789 -01")).toBe("FULANO ***.***.***-**");
  });
  it("mascara CPF escrito com espaços", () => {
    expect(mascararCpfsNoTexto("FULANO 123 456 789 01")).toBe("FULANO ***.***.***-**");
  });
  it("não mascara CNPJ colado ao nome nem trechos de um número maior", () => {
    expect(mascararCpfsNoTexto("00469171000326HOTEL CENTRAL")).toBe("00469171000326HOTEL CENTRAL");
    expect(mascararCpfsNoTexto("HOTEL 00469171000326")).toBe("HOTEL 00469171000326");
    expect(mascararCpfsNoTexto("X 1123456789012")).toBe("X 1123456789012");
    // 10 dígitos não é CPF (nome real da CEAP: "… MIDIA LTDA 2000004245").
    expect(mascararCpfsNoTexto("MIDIA LTDA 2000004245")).toBe("MIDIA LTDA 2000004245");
    expect(mascararCpfsNoTexto("A 123.456.789-0")).toBe("A 123.456.789-0");
  });
  it("só 11 dígitos soltos são CPF: de 8 a 14 dígitos, os outros tamanhos ficam como estão", () => {
    for (let n = 8; n <= 14; n++) {
      const numero = "1234567890123".padEnd(n, "4").slice(0, n);
      const esperado = n === 11 ? "X ***.***.***-**" : `X ${numero}`;
      expect(mascararCpfsNoTexto(`X ${numero}`), `${n} dígitos`).toBe(esperado);
    }
  });
  it("favorecido de emenda com dois CPFs no nome", () => {
    expect(favorecidoPublicavel("Pessoa Jurídica", "11854334000149", "A 12345678901 B 98765432100").nome).toBe(
      "A ***.***.***-** B ***.***.***-**",
    );
  });
});
