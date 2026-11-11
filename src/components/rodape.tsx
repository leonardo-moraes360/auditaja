import Link from "next/link";
import { responsavel } from "@/lib/responsavel";

/** R13: identificação pública do controlador e do encarregado (LGPD). */
export function Rodape() {
  const { controlador, doc, encarregado, email } = responsavel();
  return (
    <footer className="mt-16 bg-[#15181e] text-[#d5d7dc]">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm md:grid-cols-2">
        <div className="space-y-1">
          <p className="font-heading font-bold text-white">Auditaja</p>
          <p>
            Controlador: {controlador} · {doc}
          </p>
          <p>
            Encarregado (LGPD): {encarregado} · {email}
          </p>
        </div>
        <div className="space-y-2 md:text-right">
          <p>Alertas e indicadores são pontos de partida para verificação, não acusações.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
            <Link href="/metodologia" className="text-[#a9bef5] hover:text-white">
              Metodologia
            </Link>
            <Link href="/privacidade" className="text-[#a9bef5] hover:text-white">
              Política de privacidade
            </Link>
            <Link href="/fontes" className="text-[#a9bef5] hover:text-white">
              Fontes e licenças
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
