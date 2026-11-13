import { cartaoDoSite, TAMANHO_CARTAO } from "@/lib/cartao-og";
import { CARTAO_ALT } from "@/lib/site";

export const alt = CARTAO_ALT;
export const size = TAMANHO_CARTAO;
export const contentType = "image/png";

export default function Image() {
  return cartaoDoSite();
}
