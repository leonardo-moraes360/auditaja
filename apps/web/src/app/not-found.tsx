import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="mx-auto max-w-3xl space-y-3 px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço não corresponde a nenhum parlamentar ou página do Auditaja.</p>
      <Link href="/parlamentares">Ver deputados em exercício</Link>
    </div>
  );
}
