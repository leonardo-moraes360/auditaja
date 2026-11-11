import Link from "next/link";

export default function Inicio() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
      <div className="max-w-3xl space-y-6">
        <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Acompanhe o que seu deputado federal faz com o mandato e com a cota.
        </h1>
        <p className="text-lg text-muted-foreground">
          Gastos da cota parlamentar, votações nominais e bens declarados à Justiça Eleitoral, reunidos a partir de
          dados que a Câmara e o TSE já publicam. Cada número mostra de onde veio e quando foi coletado.
        </p>
        <form action="/parlamentares" role="search" className="flex max-w-xl flex-col gap-2 sm:flex-row">
          <label htmlFor="busca-inicio" className="sr-only">
            Nome do deputado
          </label>
          <input
            id="busca-inicio"
            name="q"
            type="search"
            placeholder="Digite o nome do deputado"
            className="h-11 flex-1 rounded-md border border-input bg-white px-4"
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Buscar
          </button>
        </form>
        <p className="text-sm text-muted-foreground">
          Ou <Link href="/parlamentares">veja todos os deputados em exercício</Link>.
        </p>
      </div>
    </div>
  );
}
