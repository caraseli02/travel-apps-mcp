---
status: complete
priority: p2
issue_id: "005"
tags: [code-review, widgets, apps-sdk, testing]
dependencies: []
---

# Add Widget Inspector Regression Tests

## Problem Statement

The old Storybook/static widget path was removed, and `mcp-use build` proves that widgets compile, but there is no automated regression test that exercises `tools/list`, widget-producing tool calls, widget resource metadata, or rendered widget output through the local Inspector/MCP path. This leaves the exact integration surface that failed during manual chat testing under-tested.

## Findings

- `npm run check` runs typecheck, Vitest tests, and `mcp-use build`, but no MCP server smoke test.
- `tests/travelAgentTools.test.ts` calls exported functions directly instead of exercising `server.tool` registration, Zod parsing, `tools/list`, or widget metadata.
- `resources/*/widget.tsx` are only compiled, not rendered or checked for basic empty/long-content states.
- The recent Inspector chat schema error would not have been caught by the current test suite.

## Proposed Solutions

### Option 1: MCP Protocol Smoke Test

**Approach:** Start the built/dev server in a test helper, call `tools/list`, invoke the 9 MVP tools over MCP, and assert widget-producing tools include output templates/resources.

**Pros:**
- Directly covers the integration contract.
- Catches descriptor/schema regressions before manual testing.

**Cons:**
- Requires server lifecycle setup in tests.
- Slightly slower than direct function tests.

**Effort:** 3-5 hours

**Risk:** Medium

---

### Option 2: Browser-Based Inspector Smoke Test

**Approach:** Use Playwright or the browser testing skill to open the Inspector, run a scripted MVP flow, and assert no console errors plus visible widget output.

**Pros:**
- Closest to actual user validation.
- Covers UI rendering and bridge behavior.

**Cons:**
- More moving parts and potential flake.
- Requires stable selectors or protocol helpers.

**Effort:** 4-8 hours

**Risk:** Medium

## Recommended Action

Completed with Option 1. The suite now starts a real MCP server, connects through `MCPClient`, validates `tools/list` descriptors, calls the MVP mutation/render flow over MCP, and asserts retained widget output templates.

## Technical Details

**Affected files:**
- `tests/`
- `resources/*/widget.tsx`
- `src/tools/travelAgent.ts`
- `docs/testing_chatgpt_apps.md`

**Database changes:** No.

## Resources

- Known Pattern: `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md`
- Known Pattern: `docs/solutions/test-failures/storybook-widget-typescript-pr-checks.md`

## Acceptance Criteria

- [x] Automated test validates `tools/list` schemas for OpenAI/Inspector compatibility.
- [x] Automated test calls at least create, add, status update, render board, itinerary, and budget through MCP.
- [x] Widget resources/templates are asserted for the four retained widgets.
- [x] At least one serialized widget-output smoke test covers non-empty board, itinerary, and budget states.
- [x] `npm run check` passes.

## Work Log

### 2026-05-06 - Initial Discovery

**By:** Codex

**Actions:**
- Reviewed current test strategy after Storybook removal.
- Compared direct function tests with actual Inspector/MCP failure mode.

**Learnings:**
- Compile-only widget checks are not enough for ChatGPT Apps bridge confidence.

### 2026-05-06 - Fixed

**By:** Codex

**Actions:**
- Added `tests/mcpIntegration.test.ts` to start the MCP server on an ephemeral port and exercise the Inspector-style tool path.
- Asserted output templates for trip inbox, board, itinerary, and budget widgets.
- Called board, itinerary, and budget widget-producing tools through MCP and checked their serialized non-empty state payloads.

**Learnings:**
- The regression that produced the Inspector chat schema error is now covered by automated MCP protocol tests, not only direct handler tests.

## Notes

- This should happen before replacing manual Inspector checks with CI confidence.
