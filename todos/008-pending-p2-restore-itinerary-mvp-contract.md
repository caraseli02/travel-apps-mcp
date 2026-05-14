---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, mcp, widgets, agent-native, quality]
dependencies: []
---

# Restore itinerary MVP contract

The production itinerary widget drifted beyond the saved-trip MVP contract. It now claims agentic insights, transit analysis, feasibility scoring, live status, and approval actions, while the server still returns ordinary `tripItineraryPropsSchema` data built from saved trip items.

## Findings

- `resources/trip-itinerary/widget.tsx:8` and `resources/trip-itinerary/widget.tsx:13` describe agentic insights, transit analysis, and feasibility scoring that the server does not produce.
- `resources/trip-itinerary/widget.tsx:34` adds optional `validation_report` fields and `resources/trip-itinerary/widget.tsx:87` erases schema-derived item types with `item: any` before recasting to `AgenticTripItem`.
- `resources/trip-itinerary/widget.tsx:116` renders `Approve Plan`, `Optimize Gaps`, and `Add Activity` buttons without handlers or corresponding MCP tools.
- The prior unscheduled-item section was removed, so `props.unscheduled` items remain in tool output but are invisible in the widget.
- Known Pattern: `docs/solutions/integration-issues/apps-sdk-trip-workspace-mvp-tool-render-alignment-20260505.md` says generic or over-broad widget surfaces should be pruned unless they add saved-trip workspace value.

## Proposed Solutions

### Option 1: Revert itinerary UI to saved-trip data only

**Approach:** Remove agentic-only optional fields, false action buttons, and ungrounded copy; restore the unscheduled saved-items section.

**Pros:**
- Restores parity with current server output.
- Removes false user affordances.
- Keeps the production widget inside the documented MVP.

**Cons:**
- Loses the newer demo visuals unless moved elsewhere.

**Effort:** Small

**Risk:** Low

---

### Option 2: Implement the agentic data and actions fully

**Approach:** Extend schemas, server output, MCP tools, tests, and docs so feasibility scoring, transit, grounding, approve, optimize, and add actions are real.

**Pros:**
- Preserves the richer concept.
- Makes all UI claims backed by data and tools.

**Cons:**
- Much larger than the metadata-alignment pass.
- Needs product and safety review for "live" and feasibility claims.

**Effort:** Large

**Risk:** Medium

---

### Option 3: Move agentic itinerary to Storybook-only experiment

**Approach:** Keep the demo component in story fixtures or a clearly experimental resource, but keep the production widget focused on current schema output.

**Pros:**
- Preserves exploratory work.
- Keeps hosted submission surface clean.

**Cons:**
- Requires separating production and demo imports/styles.

**Effort:** Medium

**Risk:** Low

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:**
- `resources/trip-itinerary/widget.tsx`
- `resources/trip-itinerary/widget.stories.tsx`
- `src/tools/travelAgent.ts`
- `tests/mcpIntegration.test.ts`

**Related components:**
- Trip itinerary widget resource
- MCP tool descriptor and structured output contract
- Storybook trip workflow previews

**Database changes:** No

## Resources

- Known Pattern: `docs/solutions/integration-issues/apps-sdk-trip-workspace-mvp-tool-render-alignment-20260505.md`
- Current plan: `docs/plans/2026-05-12-001-refactor-mcp-apps-metadata-alignment-plan.md`
- Requirements reference: `docs/brainstorms/2026-05-11-first-five-minutes-trip-workspace-requirements.md`

## Acceptance Criteria

- [ ] Production itinerary widget renders scheduled and unscheduled saved trip items.
- [ ] Production itinerary metadata describes only data actually produced by the server.
- [ ] No production itinerary buttons appear unless backed by real handlers and MCP tools.
- [ ] `TripItineraryLayout` no longer uses `any` or casts widget props to unsupported production fields.
- [ ] `npm run check` passes.

## Work Log

### 2026-05-13 - Code Review Discovery

**By:** Codex

**Actions:**
- Reviewed branch diff and configured TypeScript/code-simplicity/security findings.
- Confirmed itinerary widget has production UI claims not supported by current tool output.
- Confirmed unscheduled items are still part of the schema but no longer rendered.

**Learnings:**
- Metadata alignment should not import demo-only itinerary concepts into the hosted widget surface.

### 2026-05-13 - Browser Verification

**By:** Codex

**Actions:**
- Ran Storybook through `agent-browser` at `http://127.0.0.1:6007`.
- Verified `widgets-tripitinerary--default` at 390px renders `Optimize Gaps` and `Add Activity` but does not render `Needs Day Assignment`.
- Verified `widgets-tripitinerary--agentic` renders `Approve Plan` and `Live Status` claims.
- Captured screenshots at `/tmp/travel-itinerary-default.png` and `/tmp/travel-itinerary-agentic.png`.

**Learnings:**
- The issue is visible in the browser, not only in static code review.
