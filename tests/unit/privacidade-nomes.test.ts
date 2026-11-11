import { describe, expect, it } from "vitest";
import { mascararCpfsNoTexto } from "@/lib/privacy";
import { favorecidoPublicavel } from "@/lib/emendas";

/** R3/AD-002 em nomes de favorecidos e sancionados: casos que a verificação 4 apontou. */
describe("mascararCpfsNoTexto", () => {
  it("mascara todos os CPFs do texto, não só o primeiro", () => {
    expect(mascararCpfsNoTexto("A 12345678901 E B 987.654.321-00")).toBe("A ***.***.***-** E B ***.***.***-**");
  });
  it("mascara CPF escrito com espaços", () => {
    expect(mascararCpfsNoTexto("FULANO 123 456 789 01")).toBe("FULANO ***.***.***-**");
  });
  it("não mascara CNPJ colado ao nome nem trechos de um número maior", () => {
    expect(mascararCpfsNoTexto("00469171000326HOTEL CENTRAL")).toBe("00469171000326HOTEL CENTRAL");
    expect(mascararCpfsNoTexto("HOTEL 00469171000326")).toBe("HOTEL 00469171000326");
    expect(mascararCpfsNoTexto("X 1123456789012")).toBe("X 1123456789012");
  });
  it("favorecido de emenda com dois CPFs no nome", () => {
    expect(favorecidoPublicavel("Pessoa Jurídica", "11854334000149", "A 12345678901 B 98765432100").nome).toBe(
      "A ***.***.***-** B ***.***.***-**",
    );
  });
});
