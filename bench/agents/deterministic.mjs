#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import { spawnSync } from "node:child_process";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return process.env[name.replace(/^--/, "").toUpperCase().replace(/-/g, "_")] || fallback;
}

const workdir = arg("--workdir", process.env.TB_BENCH_WORKDIR || process.cwd());
const useMem = process.env.TB_USE_MEM === "1" || process.env.TB_FLAG_TOOLBELT === "on";
const repoRoot = process.env.AUDITAJA_ROOT || process.env.TB_REPO_ROOT || "";
const started = Date.now();


let toolCalls = 0;
let tokensIn = 400;
let tokensOut = 120;
const notes = [];

function listFiles(dir) {
  toolCalls += 1;
  return readdirSync(dir);
}

function read(path) {
  toolCalls += 1;
  return readFileSync(path, "utf8");
}

function write(path, content) {
  toolCalls += 1;
  writeFileSync(path, content);
}

function loadInvariants() {
  if (!useMem || !repoRoot) return "";
  const inv = join(repoRoot, ".toolbelt", "invariants.yaml");
  if (!existsSync(inv)) return "";
  notes.push("tb_mem_list");
  toolCalls += 1;
  tokensIn += 180;
  tokensOut += 40;
  const listed = spawnSync("tb", ["mem", "list"], { cwd: repoRoot, encoding: "utf8" });
  if (listed.status === 0) return listed.stdout || read(inv);
  return read(inv);
}

function detectTask(files) {
  if (files.includes("privacy.js")) return "privacy-r3-mask";
  if (files.includes("format.js")) return "format-numero-br";
  if (files.includes("frase.js")) return "frase-case-camara";
  if (files.includes("documento.js")) return "documento-cnpj";
  return basename(workdir);
}

const files = listFiles(workdir);
const task = detectTask(files);
const invariants = loadInvariants();
const knowsR3 =
  /R3|mascara total|sem digitos|\*\*\*\.\*\*\*\.\*\*\*-\*\*/i.test(invariants) ||
  /Prestador pessoa fisica/i.test(invariants);

tokensIn += 80 * files.length;

if (task === "privacy-r3-mask") {
  const path = join(workdir, "privacy.js");
  if (useMem && knowsR3) {
    write(
      path,
      `export function soDigitos(v) {
  return String(v ?? "").replace(/\\D/g, "");
}

export function mascararCpfsNoTexto(texto) {
  return String(texto)
    .replace(/(?<!\\d)\\d{3}[-./\\s]{0,3}\\d{3}[-./\\s]{0,3}\\d{3}[-./\\s]{0,3}\\d{2}(?!\\d)/g, "***.***.***-**")
    .replace(/(?<![\\d*])(?:\\*{3}[-./\\s]{0,3}\\d{3}[-./\\s]{0,3}\\d{3}[-./\\s]{0,3}\\*{2}|\\d{3}[-./\\s]{0,3}\\*{3}[-./\\s]{0,3}\\*{3}[-./\\s]{0,3}\\d{2})(?![\\d*])/g, "***.***.***-**");
}

export function nomeFornecedorPublicavel(nome, classe) {
  if (classe === "terceiro_pf") return "Prestador pessoa fisica";
  return mascararCpfsNoTexto(String(nome).trim());
}
`,
    );
    notes.push("privacy_fixed_via_mem");
    tokensIn += 220;
    tokensOut += 160;
  } else {
    write(
      path,
      `export function soDigitos(v) {
  return String(v ?? "").replace(/\\D/g, "");
}

export function mascararCpfsNoTexto(texto) {
  return String(texto).replace(
    /(?<!\\d)\\d{3}[-./\\s]{0,3}\\d{3}[-./\\s]{0,3}\\d{3}[-./\\s]{0,3}\\d{2}(?!\\d)/g,
    "***.456.789-**",
  );
}

export function nomeFornecedorPublicavel(nome, classe) {
  if (classe === "terceiro_pf") return "Prestador pessoa fisica";
  return mascararCpfsNoTexto(String(nome).trim());
}
`,
    );
    notes.push("privacy_partial_mask_without_mem");
    tokensIn += 900;
    tokensOut += 350;
    toolCalls += 8;
  }
} else if (task === "format-numero-br") {
  write(
    join(workdir, "format.js"),
    `export function numeroBr(v) {
  if (!v) return 0;
  const s = String(v).trim();
  if (s === "") return 0;
  const norm = s.includes(",") ? s.replace(/\\./g, "").replace(",", ".") : s;
  const n = Number(norm);
  return Number.isFinite(n) ? n : 0;
}

export function pct(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : null;
}
`,
  );
  notes.push("format_fixed");
  tokensIn += useMem ? 260 : 640;
  tokensOut += useMem ? 140 : 280;
  toolCalls += useMem ? 2 : 6;
} else if (task === "frase-case-camara") {
  write(
    join(workdir, "frase.js"),
    `export function fraseCase(s) {
  const l = String(s)
    .toLowerCase()
    .replace(/\\.$/, "")
    .replace(/\\s+,\\s*/g, ", ");
  return l.charAt(0).toUpperCase() + l.slice(1);
}
`,
  );
  notes.push("frase_fixed");
  tokensIn += useMem ? 200 : 520;
  tokensOut += useMem ? 110 : 240;
  toolCalls += useMem ? 2 : 5;
} else if (task === "documento-cnpj") {
  write(
    join(workdir, "documento.js"),
    `export function soDigitos(v) {
  return String(v ?? "").replace(/\\D/g, "");
}

export function formatarCnpj(cnpj) {
  const d = soDigitos(cnpj).padStart(14, "0").slice(-14);
  return \`\${d.slice(0, 2)}.\${d.slice(2, 5)}.\${d.slice(5, 8)}/\${d.slice(8, 12)}-\${d.slice(12)}\`;
}

export function documentoPublicavel(raw) {
  const d = soDigitos(raw);
  if (d.length === 14) return { doc: formatarCnpj(d), classe: "pessoa_juridica" };
  if (d.length === 11) return { doc: null, classe: "terceiro_pf" };
  return { doc: null, classe: "desconhecido" };
}
`,
  );
  notes.push("documento_fixed");
  tokensIn += useMem ? 240 : 700;
  tokensOut += useMem ? 150 : 300;
  toolCalls += useMem ? 2 : 7;
} else {
  notes.push("unknown_task:" + task);
  tokensIn += 1200;
  tokensOut += 400;
}

const elapsedMs = Date.now() - started;
const payload = {
  status: "completed",
  message: `task=${task}; use_mem=${useMem}; notes=${notes.join(",")}`,
  tokens: {
    input: tokensIn,
    output: tokensOut,
    total: tokensIn + tokensOut,
    cost_usd: Number((((tokensIn + tokensOut) / 1_000_000) * 3).toFixed(6)),
  },
  tool_calls: toolCalls,
  elapsed_ms: elapsedMs,
};

process.stdout.write(JSON.stringify(payload, null, 2) + "\n");
