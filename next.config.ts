import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  env: {
    NEXT_PUBLIC_VERSAO: version,
    NEXT_PUBLIC_COMMIT: hashCurto(),
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
