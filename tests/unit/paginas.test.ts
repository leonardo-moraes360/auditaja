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

/** Conta componentes assíncronos (as partes com dados) dentro e fora de <Suspense>. */
function contarAsync(no: ReactNode, dentro = false, acc = { dentro: 0, fora: 0 }) {
  if (Array.isArray(no)) {
    for (const n of no) contarAsync(n, dentro, acc);
    return acc;
  }
  if (!isValidElement(no)) return acc;
  if (typeof no.type === "function" && no.type.constructor.name === "AsyncFunction") {
    acc[dentro ? "dentro" : "fora"]++;
  }
  contarAsync((no.props as { children?: ReactNode }).children, dentro || no.type === Suspense, acc);
  return acc;
}

describe("UI-03: páginas com dados têm casca estática", () => {
  it.each(Object.entries(paginas))("%s exporta componente síncrono", async (_, carregar) => {
    const { default: Pagina } = await carregar();
    expect(Pagina.constructor.name).toBe("Function");
  });

  it.each(Object.entries(paginas))("%s carrega toda parte com dados dentro de <Suspense>", async (_, carregar) => {
    const { default: Pagina } = await carregar();
    const arvore = (Pagina as (p: typeof vazio) => ReactNode)(vazio);
    const n = contarAsync(arvore);
    expect(n.dentro).toBeGreaterThanOrEqual(1);
    expect(n.fora).toBe(0);
  });
});
