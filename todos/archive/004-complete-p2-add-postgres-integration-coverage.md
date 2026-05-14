---
status: complete
priority: p2
issue_id: "004"
tags: [code-review, database, reliability, typescript]
dependencies: []
---

# Add Postgres Integration Coverage

## Problem Statement

The TypeScript rewrite ports the Postgres trip store, schema creation, duplicate handling, and status updates, but the new test suite only verifies that an empty `DATABASE_URL` is rejected. The old Python suite had a `DATABASE_URL`-gated persistence test that covered cross-instance dedupe and reload behavior. Without equivalent coverage, hosted validation may uncover store bugs late.

## Findings

- `tests/tripStore.test.ts:84` only tests `PostgresTripStore("")` configuration failure.
- `src/stores/tripStore.ts:261` owns schema creation and should be exercised against a real Postgres connection.
- `src/stores/tripStore.ts:383` catches unique violations for dedupe, but no TypeScript integration test proves the `pg` error path works.
- `src/stores/tripStore.ts:425` updates item status and optional fields through SQL, but only in-memory/file store tests cover these behaviors.

## Proposed Solutions

### Option 1: DATABASE_URL-Gated Integration Test

**Approach:** Add a Vitest test skipped unless `DATABASE_URL` is present. Create a trip, insert duplicate items from two store instances, update status, reload, and clean up created rows.

**Pros:**
- Direct parity with the old Python integration test.
- Low infrastructure burden for local and CI environments without Postgres.

**Cons:**
- Skipped in normal CI unless a database is configured.
- Needs reliable cleanup.

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 2: CI Postgres Service

**Approach:** Add a GitHub Actions Postgres service and run the integration test on every PR.

**Pros:**
- Prevents hosted-only database regressions.
- Exercises real schema setup continuously.

**Cons:**
- Slightly slower CI.
- More CI configuration to maintain.

**Effort:** 2-4 hours

**Risk:** Medium

## Recommended Action

Completed with Option 1. The test suite now includes a `DATABASE_URL`-gated Postgres parity test while keeping normal local runs database-free.

## Technical Details

**Affected files:**
- `tests/tripStore.test.ts`
- `.github/workflows/check.yml`
- `src/stores/tripStore.ts`

**Database changes:** No production migration expected; test should use existing schema creation path.

## Resources

- Previous behavior source: deleted `tests/test_trip_store.py` in git history.
- Related migration plan: `docs/plans/2026-05-06-001-refactor-evaluate-mcp-use-migration-plan.md`

## Acceptance Criteria

- [x] Postgres test covers create, reload, duplicate detection, status update, and cleanup.
- [x] Test is skipped cleanly when `DATABASE_URL` is absent.
- [x] Optional CI Postgres service decision documented.
- [x] `npm run check` passes.

## Work Log

### 2026-05-06 - Initial Discovery

**By:** Codex

**Actions:**
- Reviewed TypeScript store coverage.
- Compared new tests with old Python Postgres integration coverage.

**Learnings:**
- The highest-risk persistence path currently has only configuration-level coverage.

### 2026-05-06 - Fixed

**By:** Codex

**Actions:**
- Added a `DATABASE_URL`-gated Vitest test covering Postgres schema creation, cross-instance reload, unique-constraint dedupe, status updates, optional metadata, and row cleanup.
- Left the CI service decision as optional because the current workflow still passes without provisioning Postgres.

**Learnings:**
- The same store API can now be validated against in-memory, file, and real Postgres backends without forcing every developer to run a database locally.

## Notes

- This is especially important before hosted ChatGPT Developer Mode validation with durable trip state.
