# Salary Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build and run the approved Chinese offer calculator at http://localhost:5173.

**Architecture:** React/TypeScript browser application backed by an independent integer-money calculation engine and versioned city data. No runtime API or backend. The existing folder has no Git repository, so work in place without initializing Git.

**Tech Stack:** React, TypeScript, Vite, Node built-in test runner; CSS/SVG charts.

**Spec:** ../specs/2026-11-02-salary-calculator-design.md

## Global Constraints

- localhost:5173, fixed port; `npm run dev` starts the application.
- Four city selectors plus custom region; unsupported policy fields cannot silently inherit another city.
- 2026 actual policy periods and explicitly marked 2027 forecasts; basic fund automatic defaults use local normal minimum, supplemental fund off.
- Money in integer fen, rates in basis points; preserve gross cash vs taxable benefits vs allowable deductions.
- Single employer, 12-month natural-year ledger; future-year bonus excluded and shown separately.
- No publishing, accounts, database, Git initialization or commits.
- User approved scope and implementation; execute inline without asking for routine implementation choices again. Keep a local progress ledger because Git-based skill helpers do not apply.

## Review Focus

1. Empty/NaN/negative inputs must never yield a plausible stale amount; parsing tests in Task 1.
2. Switching city or year must not reuse invisible manual limits; resolver tests in Task 1 and browser check in Task 3.
3. Company-paid benefits must affect tax without becoming received cash; Task 2 fixtures.
4. Bonuses outside the selected year must never leak into year totals or bonus optimization; Task 2 fixtures.
5. Corrupt storage and CSV formula strings must not crash the app or produce executable cells; Task 3 storage/export tests.

## Files and interfaces

- `src/domain/types.ts`, `money.ts`, `money.test.ts`: shared `SalaryInput`, `CityPolicy`, `MonthResult`, `CalculationResult`; `parseMoney(string): number | null`, `tax(number): number`, `bonusTax(number): number`, integer rounding.
- `src/policies/cities.ts`, `cities.test.ts`: dated sources, separate pension/medical/unemployment/fund limits; `resolvePolicy(cityId, year, month): ResolvedPolicy` with verified/forecast/incomplete status.
- `src/calculator/calculate.ts`, `calculate.test.ts`: `calculate(input: SalaryInput): CalculationResult`; validates, generates months, actual cash and alternative annual settlements, assumptions and warnings.
- `src/lib/persistence.ts`, `persistence.test.ts`, `export.ts`: versioned local state and escaped CSV.
- `src/App.tsx`, `components/Inputs.tsx`, `components/Results.tsx`, `components/Icons.tsx`, `styles.css`, `main.tsx`: accessible reactive inputs, summary, SVG chart, monthly drilldown and sources.
- `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`, `README.md`: reproducible setup, local dev, typecheck/test/build scripts.
- `docs/research/city-policy-sources.md`: verified parameter evidence and known limitations.

### Task 1: Money primitives and dated city policies

**Consumes:** approved policy research. **Produces:** money/type and resolver interfaces above.

- [x] Verify missing 2026 city personal rates, caps, fixed fees, fund rounding and source dates; list absent evidence explicitly.
- [x] Create package configuration and write Node tests for parsing, tax boundaries, bonus boundaries, automatic minimum fund, monthly policy selection and missing-period status.
- [x] Run `npm test`; confirm expected missing-feature failure.
- [x] Implement exact money operations and dated policy resolver; no inferred official values.
- [x] Run `npm test`; confirm those tests pass.

### Task 2: Calculation engine

**Consumes:** Task 1 types and resolver. **Produces:** `calculate(input): CalculationResult`.

- [x] Add failing tests for independent 40k×16 fixture: wage tax 4908000 fen, bonus tax 3059000 fen, cash 46433000 fen; combined tax 9228000 fen, combined cash 45172000 fen.
- [x] Add fixtures for join-year deductions, first-month fund, nonrefundable withholding, annual adjustments, contribution caps, annuity cap, cash-vs-taxable employer benefits, unknown insurance range, cross-year bonus, quarterly salary and invalid inputs.
- [x] Run `npm test`, see expected failures; implement calendar, contributions, withholding and annual settlement.
- [x] Run full `npm test`, inspect monthly/year aggregate consistency.

### Task 3: Working responsive page, persistence and export

**Consumes:** Task 2 `calculate` and Task 1 policy metadata. **Produces:** usable application and startup commands.

- [x] Add failing behavioral tests for corrupt/version-mismatched storage and CSV escaping/numeric preservation; run `npm test`.
- [x] Implement persistence and CSV; run full suite.
- [x] Implement salary/fund/bonus/city controls, optional advanced settings, result cards, cash chart, drilldown ledger, benefit/settlement panels and source links.
- [x] Include zero-data/error/forecast/range states, reset/delete/export controls and mobile layout; no stale results on invalid input.
- [x] Install declared dependencies, run `npm run typecheck`, `npm test`, `npm run build`.
- [x] Start `npm run dev`, check HTTP, open localhost preview and verify main flows and narrow viewport; fix observed defects.

### Task 4: Review and delivery

**Consumes:** complete app and spec. **Produces:** checked running local app, README and final status.

- [x] Fresh independent reviewer checks the whole implementation against spec and Review Focus; review does not authorize messaging other chats or publishing.
- [x] Reproduce material defects with failing tests, fix them and rerun relevant checks.
- [x] README documents exact commands, all supported parameters, source/forecast boundaries and limitations.
- [x] Verify localhost:5173 again; retain the user-requested running server and report URL and checks.

## Plan self-review

All four tasks share the declared types/resolver/calculate contracts. Scope covers the approved spec, including actual withholding versus final settlement, unknown-benefit ranges, first-job mode and localhost startup. Native execution is selected to preserve the already-authorized scope without another approval round. Styling details remain implementation choices.
