import { describe, expect, it } from "vitest";

/**
 * UI-03: com Cache Components, a casca da página (cabeçalho, título) precisa ser estática
 * para a navegação ser instantânea. Só a parte com dados fica num componente assíncrono
 * dentro de <Suspense>. Por isso o componente da página não pode ser async.
 */
const paginas = {
  "/parlamentares": () => import("@/app/parlamentares/page"),
  "/parlamentares/[id]": () => import("@/app/parlamentares/[id]/page"),
  "/parlamentares/[id]/contestar": () => import("@/app/parlamentares/[id]/contestar/page"),
  "/fontes": () => import("@/app/fontes/page"),
};

describe("UI-03: páginas com dados têm casca estática", () => {
  it.each(Object.entries(paginas))("%s exporta componente síncrono", async (_, carregar) => {
    const { default: Pagina } = await carregar();
    expect(Pagina.constructor.name).toBe("Function");
  });
});
