import { ImageResponse } from "next/og";

/** Cartão de compartilhamento (Open Graph e X): 1200 × 630, tokens do tema claro. */
export const TAMANHO_CARTAO = { width: 1200, height: 630 };

const COR = {
  fundo: "#f7f7f4",
  superficie: "#ffffff",
  borda: "#e2e2dc",
  texto: "#14171c",
  texto2: "#3d424b",
  primaria: "#1a44b8",
  azul: "#002776",
  verde: "#009c3b",
  amarelo: "#ffdf00",
};

/** Mesmo desenho do favicon (src/app/icon.svg): "A" com visto, faixa da bandeira embaixo. */
function Marca({ tamanho }: { tamanho: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      width={tamanho}
      height={tamanho}
      alt=""
      src={`data:image/svg+xml,${encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1a44b8"/><path d="M15 49 32 13 49 49" fill="none" stroke="#fff" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 38l6 5.5L41.5 30" fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      )}`}
    />
  );
}

function Moldura({ children, rodape }: { children: React.ReactNode; rodape: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: COR.fundo,
        color: COR.texto,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "48px 64px 0" }}>
        <Marca tamanho={56} />
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>Auditaja</div>
      </div>
      <div style={{ flex: 1, display: "flex", padding: "0 64px" }}>{children}</div>
      <div style={{ display: "flex", padding: "0 64px 28px", fontSize: 24, color: COR.texto2 }}>{rodape}</div>
      <div style={{ display: "flex", height: 14 }}>
        <div style={{ flex: 2, background: COR.azul }} />
        <div style={{ flex: 1, background: COR.verde }} />
        <div style={{ flex: 1, background: COR.amarelo }} />
      </div>
    </div>
  );
}

export function cartaoDoSite() {
  return new ImageResponse(
    <Moldura rodape="Dados abertos da Câmara, do Senado, do TSE e da CGU, com fonte e data de coleta">
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 24 }}>
        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, maxWidth: 1000 }}>
          Veja o que seu deputado ou senador faz com o mandato e com o dinheiro público.
        </div>
        <div style={{ fontSize: 30, color: COR.texto2 }}>
          Gastos da cota · Votações e presença · Emendas · Bens declarados
        </div>
      </div>
    </Moldura>,
    TAMANHO_CARTAO,
  );
}

/** Foto oficial como data URL; sem foto ou com falha da fonte, o cartão usa as iniciais. */
async function fotoEmbutida(url: string | null): Promise<string | null> {
  if (!url || !/^https:\/\//.test(url)) return null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const tipo = r.headers.get("content-type") ?? "";
    if (!r.ok || !/^image\/(jpeg|png|webp)/.test(tipo)) return null;
    const bytes = Buffer.from(await r.arrayBuffer());
    if (bytes.length > 2_000_000) return null;
    return `data:${tipo.split(";")[0]};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join("")
    .toUpperCase();

export async function cartaoDoPerfil(p: {
  nome: string;
  cargo: string;
  partidoUf: string;
  urlFoto: string | null;
  destaque: string | null;
}) {
  const foto = await fotoEmbutida(p.urlFoto);
  const nomeGrande = p.nome.length <= 22;
  return new ImageResponse(
    <Moldura rodape="Gastos, votações, emendas e bens declarados, com fonte oficial">
      <div style={{ display: "flex", alignItems: "center", gap: 48, width: "100%" }}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto}
            alt=""
            width={240}
            height={300}
            style={{ objectFit: "cover", borderRadius: 24, border: `1px solid ${COR.borda}` }}
          />
        ) : (
          <div
            style={{
              width: 240,
              height: 300,
              borderRadius: 24,
              background: COR.primaria,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 96,
              fontWeight: 700,
            }}
          >
            {iniciais(p.nome)}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          <div style={{ display: "flex", fontSize: 30, color: COR.texto2 }}>
            {p.partidoUf ? `${p.cargo} · ${p.partidoUf}` : p.cargo}
          </div>
          <div style={{ fontSize: nomeGrande ? 76 : 60, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>
            {p.nome}
          </div>
          {p.destaque && (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                marginTop: 8,
                padding: "14px 22px",
                borderRadius: 14,
                background: COR.superficie,
                border: `1px solid ${COR.borda}`,
                fontSize: 32,
              }}
            >
              {p.destaque}
            </div>
          )}
        </div>
      </div>
    </Moldura>,
    TAMANHO_CARTAO,
  );
}
