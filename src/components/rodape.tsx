import Link from "next/link";
import { responsavel } from "@/lib/responsavel";

/**
 * R13: identificação pública do controlador e do encarregado (LGPD).
 * Desktop: faixa escura em duas colunas (Main.dc.html:279-284). Celular: nota clara no fim do
 * conteúdo (Mobile.dc.html:132), mantendo o link da política de privacidade (PRIV-07).
 */
export function Rodape() {
  const { controlador, doc, encarregado, email } = responsavel();
  return (
    <footer className="bg-background text-muted-foreground sm:bg-[#15181e] sm:text-[#d5d7dc]">
      <div className="mx-auto flex max-w-[1248px] flex-wrap gap-x-12 gap-y-2 px-4 pt-2 pb-6 text-xs leading-relaxed sm:gap-y-5 sm:px-6 sm:py-7 sm:text-[13px]">
        <div className="flex-[1_1_280px]">
          <p className="hidden font-bold text-white sm:block">Auditaja</p>
          {/* LGPD art. 41, § 1º: identidade e contato do encarregado também no celular. */}
          <p className="sm:hidden">
            Controlador: {controlador} · Encarregado (LGPD): {encarregado} · {email}
          </p>
          <p className="hidden sm:block">
            Controlador: {controlador} · {doc}
          </p>
          <p className="hidden sm:block">
            Encarregado (LGPD): {encarregado} · {email}
          </p>
        </div>
        <p className="flex-[1_1_280px]">
          <span className="sm:hidden">Alertas são indícios para verificação, não acusações. </span>
          <span className="hidden sm:inline">Alertas são indícios estatísticos para verificação, não acusações. </span>
          <Link href="/metodologia" className="sm:text-[#a9bef5] sm:hover:text-white">
            Metodologia
          </Link>{" "}
          ·{" "}
          <Link href="/privacidade" className="sm:text-[#a9bef5] sm:hover:text-white">
            Política de privacidade
          </Link>
          <span className="hidden sm:inline">
            {" "}
            ·{" "}
            <Link href="/fontes" className="text-[#a9bef5] hover:text-white">
              Licenças dos dados
            </Link>
          </span>
        </p>
      </div>
    </footer>
  );
}
