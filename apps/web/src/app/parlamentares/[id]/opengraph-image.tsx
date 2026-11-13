import { connection } from "next/server";
import { resumoDoParlamentar } from "@/data/seo";
import { cartaoDoPerfil, cartaoDoSite, TAMANHO_CARTAO } from "@/lib/cartao-og";
import { brl } from "@auditaja/core/format";
import { cargoParlamentar } from "@auditaja/core/rotulos";
import { partidoUf } from "@/lib/seo-perfil";

export const alt = "Cartão do perfil no Auditaja: nome, cargo, partido, UF e gasto da cota parlamentar";
export const size = TAMANHO_CARTAO;
export const contentType = "image/png";

/** Cartão de compartilhamento do perfil: foto oficial, cargo, partido-UF e o gasto da cota no último ano. */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const r = /^\d{1,9}$/.test(id) ? await resumoDoParlamentar(Number(id)) : null;
  if (!r) return cartaoDoSite();
  return cartaoDoPerfil({
    nome: r.nome,
    cargo: cargoParlamentar(r.casa, r.sexo),
    partidoUf: partidoUf(r),
    urlFoto: r.url_foto,
    destaque: r.cota ? `Cota parlamentar em ${r.cota.ano}: ${brl(r.cota.total)}` : null,
  });
}
