import { describe, expect, it } from "vitest";
import { parseRobots } from "@/ingest/robots";

const UA = "Auditaja/0.1 (+https://exemplo)";

describe("R7: robots.txt", () => {
  it("aplica o grupo * quando não há grupo específico", () => {
    const r = parseRobots(`User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nDisallow: /api/\nCrawl-Delay: 10`, UA);
    expect(r.permite("/api/3/action")).toBe(false);
    expect(r.permite("/dataset/x")).toBe(true);
    expect(r.crawlDelaySegundos).toBe(10);
  });

  it("usa o grupo específico do nosso agente", () => {
    const r = parseRobots(`User-agent: *\nDisallow: /\n\nUser-agent: auditaja\nAllow: /`, UA);
    expect(r.permite("/qualquer")).toBe(true);
  });

  it("regra mais longa vence; empate favorece Allow", () => {
    const r = parseRobots(`User-agent: *\nDisallow: /dados/\nAllow: /dados/abertos/`, UA);
    expect(r.permite("/dados/abertos/x.csv")).toBe(true);
    expect(r.permite("/dados/fechados")).toBe(false);
  });

  it("suporta curingas e âncora $", () => {
    const r = parseRobots(`User-agent: *\nDisallow: /*?q=\nDisallow: /*.pdf$`, UA);
    expect(r.permite("/busca?q=x")).toBe(false);
    expect(r.permite("/a.pdf")).toBe(false);
    expect(r.permite("/a.pdf.html")).toBe(true);
  });

  it("Disallow vazio permite tudo e agentes empilhados compartilham regras", () => {
    const r = parseRobots(`User-agent: a\nUser-agent: *\nDisallow:\n`, UA);
    expect(r.permite("/x")).toBe(true);
  });
});
