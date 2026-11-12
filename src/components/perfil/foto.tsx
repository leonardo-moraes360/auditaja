/* eslint-disable @next/next/no-img-element -- fotos vêm do servidor da Câmara; sem otimização no MVP */

/**
 * Foto oficial. Sem `tamanho`: retangular do perfil, 72×88 no celular e 112×136 no desktop (protótipo).
 * Com `tamanho`: avatar redondo das listas.
 */
export function FotoParlamentar({
  nome,
  url,
  tamanho,
  raio = "rounded-full",
}: {
  nome: string;
  url: string | null;
  tamanho?: number;
  /** Arredondamento do avatar das listas; a lista de parlamentares usa 8 px, como no artboard. */
  raio?: string;
}) {
  const caixa = tamanho
    ? `shrink-0 ${raio}`
    : "h-[88px] w-[72px] shrink-0 rounded-[10px] sm:h-[136px] sm:w-[112px] sm:rounded-[12px]";
  const medida = tamanho ? { width: tamanho, height: tamanho } : undefined;
  if (!url) {
    const iniciais = nome
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
    return (
      <span
        role="img"
        aria-label={`Sem foto oficial de ${nome}`}
        style={medida}
        className={`${caixa} flex items-center justify-center bg-secondary font-heading font-bold text-primary ${
          tamanho ? "" : "text-[1.625rem] sm:text-[2.5rem]"
        }`}
      >
        {iniciais}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={`Foto oficial de ${nome}`}
      width={tamanho ?? 112}
      height={tamanho ?? 136}
      loading={tamanho ? "lazy" : undefined}
      style={medida}
      className={`${caixa} bg-secondary object-cover`}
    />
  );
}
