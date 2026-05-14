---
status: pending
priority: p3
issue_id: "012"
tags: [code-review, tests, mcp, quality]
dependencies: []
---

# Reduce metadata test copy brittleness

The MCP integration test now hard-codes each widget invocation status string. That proves the exact current copy, but it duplicates strings already declared in tool registration and widget metadata, making harmless wording changes require coordinated test edits.

## Findings

- `tests/mcpIntegration.test.ts:63` hard-codes every widget tool's invoking and invoked strings.
- The same strings are declared in `src/tools/travelAgent.ts:170`, `src/tools/travelAgent.ts:209`, `src/tools/travelAgent.ts:221`, `src/tools/travelAgent.ts:234`, and `src/tools/travelAgent.ts:272`.
- Exact copy assertions are useful only if status wording is a product contract; otherwise the important descriptor contract is that status fields exist and are non-empty.

## Proposed Solutions

### Option 1: Assert status shape instead of exact wording

**Approach:** Check that `openai/toolInvocation/invoking` and `openai/toolInvocation/invoked` are non-empty strings.

**Pros:**
- Keeps descriptor coverage.
- Avoids brittle copy-only failures.

**Cons:**
- Does not catch accidental wording drift.

**Effort:** Small

**Risk:** Low

---

### Option 2: Centralize expected widget metadata

**Approach:** Export a shared metadata expectation map or constants used by tool registration and tests.

**Pros:**
- Preserves exact copy assertions without duplicating literals.
- Makes intended copy easier to review.

**Cons:**
- Adds a production/test coupling that may be overkill.

**Effort:** Small

**Risk:** Medium

---

### Option 3: Keep exact assertions and document copy as contract

**Approach:** Leave the test strict, but add a comment explaining that invocation copy is intentionally contract-tested.

**Pros:**
- No code change.
- Makes intent clear.

**Cons:**
- Future copy edits still require test updates.

**Effort:** Small

**Risk:** Low

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:**
- `tests/mcpIntegration.test.ts`
- `src/tools/travelAgent.ts`

**Related components:**
- MCP tool descriptors
- ChatGPT status metadata compatibility

**Database changes:** No

## Resources

- MCP Apps metadata alignment plan: `docs/plans/2026-05-12-001-refactor-mcp-apps-metadata-alignment-plan.md`

## Acceptance Criteria

- [ ] Test intent is clear: either exact status copy is a contract, or only descriptor presence is asserted.
- [ ] Widget descriptor tests still assert MCP Apps resource URI and ChatGPT output template compatibility.
- [ ] `npm run check` passes.

## Work Log

### 2026-05-13 - Code Review Discovery

**By:** Codex

**Actions:**
- Reviewed code-simplicity finding on duplicated status strings.
- Confirmed descriptor shape coverage remains useful independent of exact copy.

**Learnings:**
- Metadata tests should distinguish compatibility contract from copy preference.
