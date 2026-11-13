import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";
import { HTML_LIMITED_BOT_UA_RE_STRING } from "next/dist/shared/lib/router/utils/is-bot";
import { ROBOS_DE_IA } from "./src/lib/site";

const { version } = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
  version: string;
};

/**
 * Hash curto do commit para o rodapé. Ordem: NEXT_PUBLIC_COMMIT explícito, SOURCE_COMMIT
 * (definido pelo Coolify no build) e, por fim, o git local. Sem nenhum deles, fica vazio.
 */
function hashCurto(): string {
  const explicito = process.env.NEXT_PUBLIC_COMMIT ?? process.env.SOURCE_COMMIT;
  if (explicito) return explicito.trim().slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

// Sem domínio no build de produção, canonical, sitemap e cartões apontariam para localhost.
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SITE_URL) {
  console.warn(
    "\n⚠ NEXT_PUBLIC_SITE_URL não definido: canonical, sitemap, robots.txt e llms.txt vão apontar para http://localhost:3000.\n",
  );
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Robôs que não executam JavaScript recebem title, description e Open Graph no <head>, sem streaming.
  // A lista padrão do Next.js não traz os robôs de IA (GPTBot, ClaudeBot, PerplexityBot...) nem o Googlebot,
  // que receberia canonical e description no <body> (o Google só garante o canonical no <head>).
  htmlLimitedBots: new RegExp(`${HTML_LIMITED_BOT_UA_RE_STRING}|Googlebot|${ROBOS_DE_IA.join("|")}`, "i"),
  partialPrefetching: true,
  env: {
    NEXT_PUBLIC_VERSAO: version,
    NEXT_PUBLIC_COMMIT: hashCurto(),
  },
  async rewrites() {
    // Resumo em Markdown do perfil, para agentes: /parlamentares/123.md → /parlamentares/123/perfil.md.
    return [{ source: "/parlamentares/:id(\\d{1,9}).md", destination: "/parlamentares/:id/perfil.md" }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
