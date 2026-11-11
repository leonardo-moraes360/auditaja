/** Placeholders exibidos enquanto a parte com dados da página carrega (streaming). */
export function Esqueleto({ linhas = 3, className = "" }: { linhas?: number; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={`space-y-3 ${className}`}>
      <span className="sr-only">Carregando dados…</span>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} aria-hidden="true" className="h-16 animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  );
}
