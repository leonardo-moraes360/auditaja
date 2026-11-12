import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BLOQUEIA_TUDO, PERMITE_TUDO, parseRobots, type Robots } from "./robots";

/**
 * Cliente HTTP "educado" (R7):
 * - User-Agent que identifica o projeto e um contato;
 * - lê o robots.txt de cada host antes da primeira requisição e o respeita;
 * - no máximo 1 requisição por segundo por host (ou o Crawl-delay, se maior);
 * - backoff exponencial em 429/5xx, honrando Retry-After;
 * - nunca contorna login, captcha ou WAF: 401/403 encerram a coleta.
 */

export const USER_AGENT = `Auditaja/0.1 (+${
  process.env.AUDITAJA_CONTACT_URL ?? "https://github.com/leonardo-moraes360/auditaja"
}; coleta de dados abertos)`;

const INTERVALO_MIN_MS = 1000;
const MAX_TENTATIVAS = 4;

/** O que o servidor disse ao bloquear: o chamador decide se um 403 conhecido significa outra coisa. */
export type RespostaDeBloqueio = { status: number; contentType: string; corpo: string };

export class ColetaBloqueada extends Error {
  constructor(
    mensagem: string,
    readonly resposta?: RespostaDeBloqueio,
  ) {
    super(mensagem);
  }
}

const MAX_CORPO_ERRO = 2000;

/**
 * Até 2 KB do corpo de erro, só quando é XML/JSON/texto (ex.: erro do S3); nunca baixa um HTML
 * inteiro. Falha ao ler o corpo vira corpo vazio: o bloqueio tem de chegar como ColetaBloqueada.
 */
async function corpoDeErro(res: Response, contentType: string): Promise<string> {
  const leitor = /xml|json|text\/plain/.test(contentType) ? res.body?.getReader() : undefined;
  if (!leitor) {
    await res.body?.cancel().catch(() => {});
    return "";
  }
  const partes: Uint8Array[] = [];
  let lidos = 0;
  try {
    while (lidos < MAX_CORPO_ERRO) {
      const { done, value } = await leitor.read();
      if (done) break;
      partes.push(value);
      lidos += value.length;
    }
  } catch {
    return "";
  } finally {
    await leitor.cancel().catch(() => {});
  }
  return Buffer.concat(partes).toString("utf8").slice(0, MAX_CORPO_ERRO);
}

type Opcoes = {
  fetchImpl?: typeof fetch;
  dormir?: (ms: number) => Promise<void>;
  intervaloMinMs?: number;
  log?: (msg: string) => void;
};

export class ClienteEducado {
  private robots = new Map<string, Robots>();
  private ultimo = new Map<string, number>();
  private fetchImpl: typeof fetch;
  private dormir: (ms: number) => Promise<void>;
  private intervaloMinMs: number;
  private log: (msg: string) => void;

  constructor(op: Opcoes = {}) {
    this.fetchImpl = op.fetchImpl ?? fetch;
    this.dormir = op.dormir ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.intervaloMinMs = op.intervaloMinMs ?? INTERVALO_MIN_MS;
    this.log = op.log ?? ((m) => console.log(m));
  }

  private async aguardarVez(host: string) {
    const robots = this.robots.get(host);
    const delay = Math.max(this.intervaloMinMs, (robots?.crawlDelaySegundos ?? 0) * 1000);
    const desde = Date.now() - (this.ultimo.get(host) ?? 0);
    if (desde < delay) await this.dormir(delay - desde);
    this.ultimo.set(host, Date.now());
  }

  async robotsDe(origem: URL): Promise<Robots> {
    const cached = this.robots.get(origem.host);
    if (cached) return cached;
    let r: Robots;
    try {
      await this.aguardarVez(origem.host);
      const res = await this.fetchImpl(new URL("/robots.txt", origem), {
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
      const tipo = res.headers.get("content-type") ?? "";
      if (res.ok && !tipo.includes("text/html")) r = parseRobots(await res.text(), USER_AGENT);
      else if (res.ok)
        r = PERMITE_TUDO; // o host devolve uma página HTML: não há robots.txt
      else if (res.status >= 500) r = BLOQUEIA_TUDO;
      else r = PERMITE_TUDO;
    } catch {
      r = BLOQUEIA_TUDO;
    }
    this.robots.set(origem.host, r);
    return r;
  }

  async get(urlStr: string, accept = "application/json"): Promise<Response> {
    const url = new URL(urlStr);
    const robots = await this.robotsDe(url);
    if (!robots.permite(url.pathname + url.search)) {
      throw new ColetaBloqueada(`robots.txt de ${url.host} não permite ${url.pathname}`);
    }
    for (let tentativa = 1; ; tentativa++) {
      await this.aguardarVez(url.host);
      const res = await this.fetchImpl(url, {
        headers: { "User-Agent": USER_AGENT, Accept: accept },
        redirect: "follow",
      });
      if (res.ok) return res;
      if (res.status === 401 || res.status === 403) {
        const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
        throw new ColetaBloqueada(`${url.host} respondeu ${res.status}; não contornamos bloqueios`, {
          status: res.status,
          contentType,
          corpo: await corpoDeErro(res, contentType),
        });
      }
      const repetir = res.status === 429 || res.status >= 500;
      if (!repetir || tentativa >= MAX_TENTATIVAS) {
        throw new Error(`GET ${url} falhou: HTTP ${res.status}`);
      }
      const retryAfter = Number(res.headers.get("retry-after"));
      const espera = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** (tentativa - 1);
      this.log(`HTTP ${res.status} em ${url.host}; nova tentativa em ${espera / 1000}s`);
      await res.body?.cancel();
      await this.dormir(espera);
    }
  }

  async json<T>(url: string): Promise<T> {
    return (await (await this.get(url)).json()) as T;
  }

  /** Baixa um arquivo inteiro para o cache local e devolve caminho e hash (R1). */
  async baixar(url: string, dirCache: string) {
    const res = await this.get(url, "*/*");
    const buf = Buffer.from(await res.arrayBuffer());
    const sha256 = createHash("sha256").update(buf).digest("hex");
    await mkdir(dirCache, { recursive: true });
    const arquivo = path.join(dirCache, `${sha256.slice(0, 12)}-${path.basename(new URL(url).pathname)}`);
    await writeFile(arquivo, buf);
    return { arquivo, sha256, bytes: buf.length, buf };
  }
}

export function sha256De(dado: string | Buffer): string {
  return createHash("sha256").update(dado).digest("hex");
}
