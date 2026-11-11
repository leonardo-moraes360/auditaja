/* eslint-disable @next/next/no-img-element -- fotos vêm do servidor da Câmara; sem otimização no MVP */
export function FotoParlamentar({ nome, url, tamanho }: { nome: string; url: string | null; tamanho: number }) {
  const iniciais = nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  if (!url) {
    return (
      <span
        aria-hidden="true"
        style={{ width: tamanho, height: tamanho }}
        className="flex shrink-0 items-center justify-center rounded-full bg-secondary font-heading font-bold text-secondary-foreground"
      >
        {iniciais}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt={`Foto oficial de ${nome}`}
      width={tamanho}
      height={tamanho}
      loading="lazy"
      className="shrink-0 rounded-full bg-muted object-cover"
      style={{ width: tamanho, height: tamanho }}
    />
  );
}
