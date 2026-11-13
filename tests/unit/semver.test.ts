import { describe, expect, it } from "vitest";
import { fecharChangelog, subirVersao } from "@/lib/semver";
import { montarVersao } from "@/lib/versao";

describe("subirVersao", () => {
  it("segue o semver", () => {
    expect(subirVersao("0.1.0", "patch")).toBe("0.1.1");
    expect(subirVersao("0.1.3", "minor")).toBe("0.2.0");
    expect(subirVersao("0.9.4", "major")).toBe("1.0.0");
  });
  it("recusa versão fora do formato", () => {
    expect(() => subirVersao("1.0", "patch")).toThrow();
  });
});

describe("fecharChangelog", () => {
  const base =
    "# Changelog\n\n## [Não publicado]\n\n### Adicionado\n\n- Coisa nova.\n\n## [0.1.0] - 2026-11-12\n\n- Início.\n";
  it("move as notas para a nova versão e reabre a seção", () => {
    expect(fecharChangelog(base, "0.2.0", "2026-12-01")).toBe(
      "# Changelog\n\n## [Não publicado]\n\n## [0.2.0] - 2026-12-01\n\n### Adicionado\n\n- Coisa nova.\n\n## [0.1.0] - 2026-11-12\n\n- Início.\n",
    );
  });
  it("recusa publicar sem notas", () => {
    expect(() => fecharChangelog("## [Não publicado]\n\n## [0.1.0] - x\n", "0.1.1", "y")).toThrow();
  });
});

describe("montarVersao (rodapé)", () => {
  it("mostra versão e hash curto", () => {
    expect(montarVersao("0.1.0", "688f1dc").rotulo).toBe("v0.1.0 · 688f1dc");
  });
  it("sem git, só a versão", () => {
    expect(montarVersao("0.1.0", "").rotulo).toBe("v0.1.0");
    expect(montarVersao("0.1.0", undefined).commit).toBeNull();
  });
});
