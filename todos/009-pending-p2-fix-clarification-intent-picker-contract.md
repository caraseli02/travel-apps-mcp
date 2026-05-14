---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, widgets, mcp, agent-native, quality]
dependencies: []
---

# Fix clarification intent picker contract

The clarification widget now shows an intent picker before the real questions, but the selected intent is local-only. Users can choose `experience`, `budget`, `dates`, or `loyalty`, yet that choice is not submitted to the MCP tool, persisted in answers, or included in the follow-up message.

## Findings

- `resources/trip-clarification/widget.tsx:264` stores the selected intent in `pickedIntent` and hides the picker.
- `resources/trip-clarification/widget.tsx:355` only displays the selected intent in the header.
- `resources/trip-clarification/widget.tsx:500` still submits the original session plus question answers only, so the chosen intent never reaches `submit_trip_clarification`.
- Known Pattern: `docs/solutions/integration-issues/chatgpt-apps-trip-clarification-widget-lifecycle-20260508.md` emphasizes that clarification widget interactions must be part of the real tool/bridge lifecycle, not just local UI state.

## Proposed Solutions

### Option 1: Remove the intent picker from production

**Approach:** Keep the widget limited to server-generated clarification questions unless the intent picker is implemented end to end.

**Pros:**
- Smallest fix.
- Avoids collecting a choice that has no effect.
- Preserves the known working clarification submit lifecycle.

**Cons:**
- Drops the new first-screen interaction from production.

**Effort:** Small

**Risk:** Low

---

### Option 2: Submit intent picker value as an answer

**Approach:** Store the selected intent under a stable answer key and include it in `answers_json` so `submit_trip_clarification` can summarize and use it.

**Pros:**
- Keeps the UI interaction meaningful.
- Minimal server changes if treated as another answer.

**Cons:**
- Needs schema and summary rules so the server knows what the value means.
- Needs tests for follow-up text and bridge behavior.

**Effort:** Medium

**Risk:** Medium

---

### Option 3: Convert it into a server-generated first question

**Approach:** Move the intent choice into the clarification domain model so it appears in `props.questions` and follows the existing answer/submission path.

**Pros:**
- Best model/UI parity.
- Reuses existing multi-choice logic.

**Cons:**
- Requires domain-level clarification changes and fixture updates.

**Effort:** Medium

**Risk:** Low

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:**
- `resources/trip-clarification/widget.tsx`
- `src/domain/clarification.ts`
- `src/tools/travelAgent.ts`
- `tests/travelAgentTools.test.ts`
- `tests/mcpIntegration.test.ts`

**Related components:**
- Clarification widget bridge submit flow
- `submit_trip_clarification`
- Follow-up message generation

**Database changes:** No

## Resources

- Known Pattern: `docs/solutions/integration-issues/chatgpt-apps-trip-clarification-widget-lifecycle-20260508.md`

## Acceptance Criteria

- [ ] Every visible clarification choice affects submitted tool data, or the choice is removed from production.
- [ ] Clarification submit still returns `_meta["openai/closeWidget"] === true`.
- [ ] Failed submit remains retryable without losing selected answers.
- [ ] Tests cover the chosen intent picker behavior or prove it is not in production.
- [ ] `npm run check` passes.

## Work Log

### 2026-05-13 - Code Review Discovery

**By:** Codex

**Actions:**
- Reviewed clarification widget submit path.
- Confirmed `pickedIntent` is display-only and not included in `answers_json`.

**Learnings:**
- Widget-local state is unsafe for meaningful choices unless it flows through the MCP tool result path.
