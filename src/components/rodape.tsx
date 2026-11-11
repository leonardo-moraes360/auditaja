import Link from "next/link";

/** R13: identificação pública do controlador e do encarregado (LGPD). */
export function Rodape() {
  const controlador = process.env.NEXT_PUBLIC_CONTROLADOR_NOME ?? "[NOME DO CONTROLADOR]";
  const doc = process.env.NEXT_PUBLIC_CONTROLADOR_DOC ?? "[CNPJ]";
  const encarregado = process.env.NEXT_PUBLIC_ENCARREGADO_NOME ?? "[NOME DO ENCARREGADO]";
  const email = process.env.NEXT_PUBLIC_ENCARREGADO_EMAIL ?? "[E-MAIL DO ENCARREGADO]";
  return (
    <footer className="mt-16 border-t bg-superficie">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm text-muted-foreground md:grid-cols-2">
        <div className="space-y-1">
          <p className="font-heading font-bold text-foreground">Auditaja</p>
          <p>
            Controlador: {controlador} · {doc}
          </p>
          <p>
            Encarregado (LGPD): {encarregado} · {email}
          </p>
        </div>
        <div className="space-y-2 md:text-right">
          <p>Alertas e indicadores são pontos de partida para verificação, não acusações.</p>
          <p className="flex flex-wrap gap-x-4 md:justify-end">
            <Link href="/metodologia">Metodologia</Link>
            <Link href="/fontes">Fontes e licenças</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
