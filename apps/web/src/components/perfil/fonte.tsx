import Link from "next/link";
import type { Coleta } from "@/data/perfil";
import { dataHoraBr } from "@auditaja/core/format";

export type LinkFonte = { rotulo: string; href: string; externo?: boolean; download?: boolean };

/**
 * R1: toda seção mostra de onde veio o dado, quando foi coletado e um link para o original.
 * Desktop: texto à esquerda, links à direita (Main.dc.html:163-166).
 * Celular: uma linha curta com "ver original" (Mobile.dc.html:95).
 */
export function NotaFonte({
  rotulo,
  rotuloCurto,
  coleta,
  linkOriginal,
  rotuloOriginal = "Ver na fonte",
  extras = [],
  parlamentarId,
  secao,
}: {
  rotulo: string;
  rotuloCurto?: string;
  coleta?: Coleta;
  linkOriginal?: string;
  rotuloOriginal?: string;
  extras?: LinkFonte[];
  parlamentarId: number;
  secao: string;
}) {
  const original = linkOriginal ?? coleta?.url;
  const quando = coleta ? dataHoraBr(coleta.coletado_em) : null;
  return (
    <div className="border-t border-borda-suave pt-2.5 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:justify-between sm:gap-x-4 sm:gap-y-2 sm:pt-3 sm:text-xs">
      <p className="sm:hidden">
        Fonte: {rotuloCurto ?? rotulo} · {quando ? `coletado em ${quando.slice(0, 10)}` : "ainda não coletado"}
      </p>
      <p className="hidden sm:block">
        Fonte: {rotulo}
        {quando ? ` · coletado em ${quando}` : " · ainda não coletado"}
      </p>
      {/* No celular os links também aparecem (planilha e correção sumiam), com 44 px de alvo de toque. */}
      <p className="flex flex-wrap gap-x-4 sm:ml-auto sm:gap-y-1 [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center sm:[&_a]:min-h-0">
        {original && (
          <a href={original} rel="noopener noreferrer" target="_blank">
            {rotuloOriginal}
          </a>
        )}
        {extras.map((l) =>
          l.externo || l.download ? (
            <a key={l.rotulo} href={l.href} download={l.download || undefined}>
              {l.rotulo}
            </a>
          ) : (
            <Link key={l.rotulo} href={l.href}>
              {l.rotulo}
            </Link>
          ),
        )}
        <Link href={`/parlamentares/${parlamentarId}/contestar?secao=${encodeURIComponent(secao)}`}>
          Pedir correção
        </Link>
      </p>
    </div>
  );
}
