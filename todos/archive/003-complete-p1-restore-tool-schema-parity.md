---
status: complete
priority: p1
issue_id: "003"
tags: [code-review, apps-sdk, mcp, quality]
dependencies: []
---

# Restore Tool Schema Parity

## Problem Statement

The MCP tool schemas were narrowed to avoid the Inspector chat OpenAI schema error, but the handlers and tests still assume richer inputs such as `destination`, `start_date`, `item_type`, `day_label`, and `notes`. In real MCP calls, Zod strips unknown fields by default, so the model cannot persist trip metadata, item titles, item types, day labels, or notes through the advertised tool contracts.

This is a merge-blocking functional regression because the rewritten app can pass direct function tests while failing the actual ChatGPT/Inspector workflow the branch is meant to evaluate.

## Findings

- `src/tools/travelAgent.ts:47` advertises `create_trip` with only `title`, but `createTrip()` still reads `destination`, `start_date`, and `end_date`.
- `src/tools/travelAgent.ts:51` advertises `add_trip_item` with only `trip_id` and `raw_content`, but `addTripItem()` still reads `item_type`, `source_label`, `title`, `day_label`, `date_note`, `price_note`, `location_note`, and `notes`.
- `src/tools/travelAgent.ts:60` advertises `update_trip_item_status` with only `item_id` and `status`, but `updateTripItemStatus()` still reads `day_label` and `notes`.
- `tests/travelAgentTools.test.ts` calls exported functions directly, bypassing MCP/Zod parsing, so it does not catch schema-stripping behavior.

## Proposed Solutions

### Option 1: OpenAI-Compatible Rich Schemas

**Approach:** Restore the optional fields in tool schemas using an OpenAI-compatible JSON Schema shape, then verify `tools/list` and Inspector chat both accept the schema.

**Pros:**
- Preserves the intended tool surface and model ergonomics.
- Keeps trip metadata and scheduling available in normal ChatGPT flows.

**Cons:**
- Requires understanding the `mcp-use` schema conversion limits.
- May need a small compatibility helper to avoid unsupported `anyOf` or optional forms.

**Effort:** 2-4 hours

**Risk:** Medium

---

### Option 2: Split Minimal Chat Tools From Enrichment Tools

**Approach:** Keep minimal schemas for initial create/save/status operations, then add explicit enrichment tools such as `update_trip_details` and `update_trip_item_details` with compatible required-nullable fields.

**Pros:**
- Keeps each tool schema small.
- Avoids overloading `add_trip_item`.

**Cons:**
- Adds more tool-choice surface area.
- More conversation turns may be needed for common workflows.

**Effort:** 4-6 hours

**Risk:** Medium

## Recommended Action

Completed with Option 1. The schemas now advertise the full MVP metadata surface using required string fields with empty-string sentinels for unknown optional values, and handlers normalize empty strings before writing to the trip store.

## Technical Details

**Affected files:**
- `src/tools/travelAgent.ts`
- `tests/travelAgentTools.test.ts`
- `tests/tripStore.test.ts`
- `docs/testing_chatgpt_apps.md`

**Database changes:** No.

## Resources

- Related migration plan: `docs/plans/2026-05-06-001-refactor-evaluate-mcp-use-migration-plan.md`
- Known Pattern: `docs/solutions/integration-issues/apps-sdk-trip-workspace-mvp-tool-render-alignment-20260505.md`

## Acceptance Criteria

- [x] `tools/list` advertises all intended trip metadata/item metadata fields.
- [x] MCP-level tests call tools through the MCP server or schema parser, not only direct exported functions.
- [x] Inspector chat can create a trip, save a titled/priced item, assign a day label, and render itinerary/budget.
- [x] `npm run check` passes.

## Work Log

### 2026-05-06 - Initial Discovery

**By:** Codex

**Actions:**
- Reviewed current branch diff after TypeScript migration.
- Compared tool schemas with handler inputs and test coverage.
- Identified direct-function tests masking MCP schema behavior.

**Learnings:**
- The quick schema narrowing fixed one Inspector chat failure but removed model-accessible inputs required by the MVP flow.

### 2026-05-06 - Fixed

**By:** Codex

**Actions:**
- Restored create trip, add item, and status update metadata fields in `src/tools/travelAgent.ts`.
- Used OpenAI-compatible string fields instead of nullable/optional schema forms.
- Added MCP-level coverage that validates schema required arrays, rejects boolean `required` values, calls tools over MCP, and checks persisted metadata.

**Learnings:**
- Required string fields with empty-string normalization keep the OpenAI function schema simple while preserving the richer app workflow.

## Notes

- This should be resolved before relying on Inspector chat validation results.
