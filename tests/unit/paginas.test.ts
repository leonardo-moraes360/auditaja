import { isValidElement, Suspense, type ReactNode } from "react";
import { describe, expect, it } from "vitest";

/**
 * UI-03: com Cache Components, a casca da página (cabeçalho, título) precisa ser estática
 * para a navegação ser instantânea. Só a parte com dados fica num componente assíncrono
 * dentro de <Suspense>. Conferimos as duas metades: a página não é async e devolve um
 * <Suspense> na árvore.
 */
const vazio = { params: Promise.resolve({ id: "1" }), searchParams: Promise.resolve({}) };
const paginas = {
  "/parlamentares": () => import("@/app/parlamentares/page"),
  "/parlamentares/[id]": () => import("@/app/parlamentares/[id]/page"),
  "/parlamentares/[id]/contestar": () => import("@/app/parlamentares/[id]/contestar/page"),
  "/fontes": () => import("@/app/fontes/page"),
};

function temSuspense(no: ReactNode): boolean {
  if (Array.isArray(no)) return no.some(temSuspense);
  if (!isValidElement(no)) return false;
  if (no.type === Suspense) return true;
  return temSuspense((no.props as { children?: ReactNode }).children);
}

describe("UI-03: páginas com dados têm casca estática", () => {
  it.each(Object.entries(paginas))("%s exporta componente síncrono", async (_, carregar) => {
    const { default: Pagina } = await carregar();
    expect(Pagina.constructor.name).toBe("Function");
  });

  it.each(Object.entries(paginas))("%s envolve a parte com dados em <Suspense>", async (_, carregar) => {
    const { default: Pagina } = await carregar();
    const arvore = (Pagina as (p: typeof vazio) => ReactNode)(vazio);
    expect(temSuspense(arvore)).toBe(true);
  });
});
