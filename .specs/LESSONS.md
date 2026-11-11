# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

### L-001 - Run pnpm build after any UI commit because Cache Components prerender fails on client hooks like usePathname outside Suspense
- signal: `gate_fail` · recurrence: 1 feature(s) · scope: `ui` · harmful: 0
- features: perfil-parlamentar
- evidence: src/components/nav-principal.tsx:14 (pnpm build at 34fcdb3) (ui)
- last seen: 2026-11-11T13:18:57Z

### L-002 - Test every status-code branch and the exact backoff sequence and retry cap of an HTTP client, not only one representative status
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ingest` · harmful: 0
- features: perfil-parlamentar
- evidence: M3 M5 M10 src/ingest/http.ts:20,90,98 (ingest)
- last seen: 2026-11-11T13:18:57Z

### L-003 - Seed enough rows to exceed every query limit and exercise every fallback parameter in read-layer integration tests
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `data` · harmful: 0
- features: perfil-parlamentar
- evidence: M8 M9 src/data/perfil.ts:102,134 (data)
- last seen: 2026-11-11T13:18:58Z

### L-004 - Each deduplication rule needs its own fixture with a real duplicate that survives earlier filters
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ingest` · harmful: 0
- features: perfil-parlamentar
- evidence: M6 src/ingest/camara.ts:145 (ingest)
- last seen: 2026-11-11T13:18:58Z

### L-005 - Cover error and empty-state paths of each route in e2e asserting the exact message the spec defines, not only the happy path
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `routes` · harmful: 0
- features: perfil-parlamentar
- evidence: CORR-02 CORR-03 EDGE-02 EDGE-03 EDGE-05 (routes)
- last seen: 2026-11-11T13:18:58Z

### L-006 - Do not assert a transformed value that the seed already stores pre-transformed; test the transformation through the real ingestion path
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: perfil-parlamentar
- evidence: tests/integracao/perfil.test.ts:38 (tests)
- last seen: 2026-11-11T13:18:58Z

### L-007 - Assert the exact spec value such as the computed delay or viewport width instead of a loose threshold or a nearby device preset
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: perfil-parlamentar
- evidence: COLETA-04 tests/unit/http.test.ts:61; EDGE-04 viewport 412 (tests)
- last seen: 2026-11-11T13:18:58Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
