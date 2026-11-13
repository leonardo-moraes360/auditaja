import { describe, expect, it } from "vitest";
import {
  dataDoBuild,
  POLITICA_SEGURANCA_URL,
  RELATO_SEGURANCA_URL,
  securityTxt,
  VALIDADE_SECURITY_TXT_DIAS,
} from "@/lib/seguranca";

const campos = (txt: string) =>
  Object.fromEntries(
    txt
      .trim()
      .split("\n")
      .map((l) => [l.slice(0, l.indexOf(":")), l.slice(l.indexOf(":") + 2)]),
  );

describe("securityTxt (RFC 9116)", () => {
  const publicadoEm = new Date("2026-11-13T17:00:00.123Z");
  const txt = securityTxt("https://auditaja.org.br", publicadoEm);

  it("traz Contact e Expires, obrigatórios, e aponta o relato privado e a política", () => {
    const c = campos(txt);
    expect(c.Contact).toBe(RELATO_SEGURANCA_URL);
    expect(c.Contact).toMatch(/^https:\/\/github\.com\/.+\/security\/advisories\/new$/);
    expect(c.Policy).toBe(POLITICA_SEGURANCA_URL);
    expect(c.Policy).toMatch(/\/SECURITY\.md$/);
    expect(c.Canonical).toBe("https://auditaja.org.br/.well-known/security.txt");
    expect(c["Preferred-Languages"]).toBe("pt, en");
  });

  it("Expires fica 180 dias após o build, em ISO 8601 sem milissegundos, a menos de um ano", () => {
    const expira = campos(txt).Expires;
    expect(expira).toBe("2027-05-12T17:00:00Z");
    const dias = (new Date(expira).getTime() - publicadoEm.getTime()) / 86_400_000;
    expect(Math.round(dias)).toBe(VALIDADE_SECURITY_TXT_DIAS);
    expect(dias).toBeLessThan(365);
  });

  it("cada campo aparece uma vez e o arquivo termina em quebra de linha", () => {
    const nomes = txt
      .trim()
      .split("\n")
      .map((l) => l.split(":")[0]);
    expect(new Set(nomes).size).toBe(nomes.length);
    expect(txt.endsWith("\n")).toBe(true);
  });
});

describe("dataDoBuild", () => {
  it("usa a data embutida no build", () => {
    expect(dataDoBuild("2026-11-13T17:00:00.000Z").toISOString()).toBe("2026-11-13T17:00:00.000Z");
  });
  it("sem variável ou com valor inválido, vale agora", () => {
    const antes = Date.now();
    for (const v of [undefined, "", "ontem"]) {
      expect(dataDoBuild(v).getTime()).toBeGreaterThanOrEqual(antes);
    }
  });
});
