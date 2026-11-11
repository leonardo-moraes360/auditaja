import Link from "next/link";
import type { Coleta } from "@/data/perfil";
import { dataHoraBr } from "@/lib/format";

/** R1: toda seção mostra de onde veio o dado, quando foi coletado e um link para o original. */
export function NotaFonte({
  rotulo,
  coleta,
  linkOriginal,
  parlamentarId,
  secao,
}: {
  rotulo: string;
  coleta?: Coleta;
  linkOriginal?: string;
  parlamentarId: number;
  secao: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
      <p>
        Fonte: {rotulo}
        {coleta ? ` · coletado em ${dataHoraBr(coleta.coletado_em)}` : " · ainda não coletado"}
      </p>
      <p className="flex gap-4">
        {(linkOriginal ?? coleta?.url) && (
          <a href={linkOriginal ?? coleta!.url} rel="noopener noreferrer" target="_blank">
            Ver na fonte
          </a>
        )}
        <Link href={`/parlamentares/${parlamentarId}/contestar?secao=${encodeURIComponent(secao)}`}>Contestar</Link>
      </p>
    </div>
  );
}
