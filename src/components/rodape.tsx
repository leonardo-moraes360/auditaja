import Link from "next/link";
import { CAMINHO_LICENCA, LICENCA_CODIGO, LICENCA_DADOS, REPOSITORIO_URL } from "@/lib/licenca";
import { responsavel } from "@/lib/responsavel";
import { versaoDoSite } from "@/lib/versao";

/**
 * R13: identificação pública do controlador e do encarregado (LGPD).
 * Desktop: faixa escura em duas colunas (Main.dc.html:279-284). Celular: nota clara no fim do
 * conteúdo (Mobile.dc.html:132), mantendo o link da política de privacidade (PRIV-07).
 */
export function Rodape() {
  const { controlador, doc, encarregado, email } = responsavel();
  const { versao, commit } = versaoDoSite();
  // Versão e commit lidos no build (next.config.ts). Sem git, só a versão.
  const marcaVersao = (
    <span className="tabular-nums" data-testid="versao-site">
      <span className="sr-only">
        Versão {versao}
        {commit ? `, commit ${commit}` : ""}
      </span>
      <span aria-hidden="true">
        v{versao}
        {commit ? (
          <>
            {" "}
            · <code className="font-mono">{commit}</code>
          </>
        ) : null}
      </span>
    </span>
  );
  // Licença do que o Auditaja publica (dados e textos) e do código; detalhes em /sobre#licenca.
  const linkLicenca = (
    <>
      <Link href={CAMINHO_LICENCA} className="sm:text-rodape-link sm:hover:text-white">
        Licença: dados {LICENCA_DADOS.nome}, código {LICENCA_CODIGO.curto}
      </Link>{" "}
      ·{" "}
      <a href={REPOSITORIO_URL} className="sm:text-rodape-link sm:hover:text-white">
        Código-fonte
      </a>
    </>
  );
  return (
    <footer className="bg-background text-muted-foreground sm:border-t sm:border-borda sm:bg-rodape-fundo sm:text-rodape-texto">
      <div className="mx-auto flex max-w-[1248px] flex-wrap gap-x-12 gap-y-2 px-4 pt-2 pb-6 text-xs leading-relaxed sm:gap-y-5 sm:px-6 sm:py-7 sm:text-sm">
        <div className="flex-[1_1_280px]">
          <p className="hidden sm:block">
            <span className="font-bold text-white">Auditaja</span> {marcaVersao}
          </p>
          <p className="hidden sm:block">{linkLicenca}</p>
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
          Indicadores são pontos de partida para verificação, não acusações.{" "}
          <Link href="/metodologia" className="sm:text-rodape-link sm:hover:text-white">
            Metodologia
          </Link>{" "}
          ·{" "}
          <Link href="/privacidade" className="sm:text-rodape-link sm:hover:text-white">
            Política de privacidade
          </Link>
          <span className="hidden sm:inline">
            {" "}
            ·{" "}
            <Link href="/fontes" className="text-rodape-link hover:text-white">
              Licenças dos dados
            </Link>
          </span>
        </p>
        <p className="sm:hidden">
          Auditaja {marcaVersao} · {linkLicenca}
        </p>
      </div>
    </footer>
  );
}
