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
- evidence: COLETA-04 tests/unit/http.test.ts:61; EDGE-04 viewport 412 (tests) (+1 more)
- last seen: 2026-11-11T13:31:25Z

### L-008 - Give each disjunct of a boolean condition its own test case so dropping any branch fails a test
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ui` · harmful: 0
- features: perfil-parlamentar
- evidence: N1 src/components/nav-principal.tsx:26 (ui)
- last seen: 2026-11-11T13:31:25Z

### L-009 - For an ordered precedence list, test every adjacent pair with both candidates present so any swap fails a test
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `domain` · harmful: 0
- features: perfil-parlamentar
- evidence: N3 src/lib/metrics.ts:78 (domain)
- last seen: 2026-11-11T13:31:25Z

### L-010 - Each filter rule needs a fixture row that only that filter excludes, so removing the filter fails a test
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `data` · harmful: 0
- features: perfil-parlamentar
- evidence: N5 src/data/perfil.ts:192; N9 src/data/perfil.ts:240 (data)
- last seen: 2026-11-11T13:31:25Z

### L-011 - Build the fixture for a special-case branch so the default branch would produce the opposite result
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ingest` · harmful: 0
- features: perfil-parlamentar
- evidence: N7 src/ingest/http.ts:65; tests/unit/http.test.ts:47-57 (ingest)
- last seen: 2026-11-11T13:31:25Z

### L-012 - Test a transactional replace by forcing a failure mid-write and asserting the previous rows survive
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ingest` · harmful: 0
- features: perfil-parlamentar
- evidence: N6 src/ingest/camara.ts:236-239 (COLETA-07) (ingest)
- last seen: 2026-11-11T13:31:25Z

### L-013 - A test title must not claim a case its fixture does not contain
- signal: `ac_gap` · recurrence: 1 feature(s) · scope: `tests` · harmful: 0
- features: perfil-parlamentar
- evidence: tests/unit/metrics.test.ts:29 title vs fixture (VOTO-02) (tests) (+1 more)
- last seen: 2026-11-11T13:41:06Z

### L-014 - For an additive OR filter, test an input that matches both branches with rows that only one branch would return, so replacing the union with either branch fails a test
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `data` · harmful: 0
- features: perfil-parlamentar
- evidence: U3 src/data/perfil.ts:48-49 (BUSCA-04) (data)
- last seen: 2026-11-11T13:41:06Z

### L-015 - When a requirement has two structural parts, assert each part separately, since a fallback such as a root loading boundary can keep the build green when one part is removed
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ui` · harmful: 0
- features: perfil-parlamentar
- evidence: U5 U6 src/app/fontes/page.tsx:19-21, src/app/parlamentares/page.tsx (UI-03); tests/unit/paginas.test.ts:18 (ui)
- last seen: 2026-11-11T13:41:06Z

### L-016 - To prove a containment rule, assert the target is inside the container and none is outside, not just that the container exists
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ui` · harmful: 0
- features: perfil-parlamentar
- evidence: V5 tests/unit/paginas.test.ts:18-23 src/app/fontes/page.tsx:19-21 (ui)
- last seen: 2026-11-11T13:54:01Z

### L-017 - A change to a shared component with no consumers cannot be verified; apply it where elements render or add a consumer under test
- signal: `surviving_mutant` · recurrence: 1 feature(s) · scope: `ui` · harmful: 0
- features: perfil-parlamentar
- evidence: V3 src/components/ui/button.tsx:6 (ui)
- last seen: 2026-11-11T13:54:01Z

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

_none_
