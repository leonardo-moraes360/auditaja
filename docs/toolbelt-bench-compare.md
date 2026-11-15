# Comparação A/B de Benchmarks

**Variante A**: baseline (agente deterministic-baseline)
**Variante B**: with-tb (agente deterministic-with-tb)

| Métrica | A (baseline) | B (with-tb) | Δ |
|---------|-------|--------|---|
| sucesso (pass@1) | 75.0% | 100.0% | +25.0% |
| tempo médio | 0.1s | 0.1s | +0.0s |
| tokens médio | 1742 | 1350 | -22.5% |
| custo total | $0.0209 | $0.0162 | -22.5% |
| tool calls médio | 8.5 | 4.5 | -4.0 |

## Interpretação

**Melhorias (B vs A):**
- sucesso (pass@1) +25.0 pontos
- tokens médio -22.5%

