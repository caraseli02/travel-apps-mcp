---
status: complete
priority: p2
issue_id: "006"
tags: [code-review, reliability, apps-sdk, widget]
dependencies: []
---

# Add Clarification Widget Submit Error Handling

## Problem Statement

The trip clarification widget calls `submit_trip_clarification` and then posts a follow-up message, but failures in either host bridge call are not handled. If `callTool` or `sendFollowUpMessage` rejects, the widget can stay in the `submitting` state with no visible retry path or explanation.

This matters because the widget is meant to be tested in ChatGPT Developer Mode, where bridge calls can fail because of host permissions, network issues, reconnects, session expiry, or tool errors. A stuck widget makes the user think the app is broken and gives the model no clean recovery signal.

## Findings

- `resources/trip-clarification/widget.tsx:100` sets `submitState` to `submitting`, awaits `onSubmit`, and only then sets `submitted`.
- `resources/trip-clarification/widget.tsx:212` calls `callTool("submit_trip_clarification", ...)` and `sendFollowUpMessage(...)` without a `try/catch`.
- If either call throws, `submitAnswers` exits before setting a final state.
- There is no user-visible error message, retry button, or fallback text output for the failed submission.
- Known pattern: `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md` emphasizes testing widget host bridge behavior, not just static rendering.

## Proposed Solutions

### Option 1: Local Error State And Retry

**Approach:** Add `submitState: "idle" | "submitting" | "submitted" | "error"` and `submitError`. Wrap `onSubmit` in `try/catch`, reset to `error` on failure, and render a concise retry affordance in the footer.

**Pros:**
- Smallest change.
- Preserves current tool flow.
- Gives users a visible recovery path.

**Cons:**
- Does not distinguish tool failure from follow-up message failure unless error metadata is surfaced.

**Effort:** Small

**Risk:** Low

---

### Option 2: Split Tool Submit From Follow-Up Message

**Approach:** Call `submit_trip_clarification`, update local UI to submitted after tool success, then separately try `sendFollowUpMessage`. If follow-up fails, show a copyable summary or prompt the user to continue manually.

**Pros:**
- Avoids losing successfully submitted answers because a follow-up message failed.
- Better reflects the two separate operations.

**Cons:**
- Slightly more UI state and copy.

**Effort:** Small/Medium

**Risk:** Low

---

### Option 3: Defer Widget-Originated Submit

**Approach:** Keep the widget selection local and rely on the model/chat turn to call `submit_trip_clarification`.

**Pros:**
- Avoids bridge-call error handling in the first version.

**Cons:**
- Weakens the interactive Apps SDK value and may make the widget feel inert.

**Effort:** Small

**Risk:** Medium

## Recommended Action

Completed with local error state, retry handling, and explicit ChatGPT widget close requests after successful submission.

## Technical Details

**Affected files:**
- `resources/trip-clarification/widget.tsx:100` - submit state transition
- `resources/trip-clarification/widget.tsx:212` - host bridge tool call and follow-up message
- `resources/trip-clarification/widget.stories.tsx` - add an error-state story if UI copy is introduced

**Related components:**
- ChatGPT Apps bridge via `mcp-use/react`
- `submit_trip_clarification` tool

**Database changes:** No.

## Resources

- **Review target:** current branch `codex/evaluate-mcp-use-migration`
- **Known pattern:** `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md`
- **Plan:** `docs/plans/2026-05-08-001-feat-trip-clarification-widget-plan.md`

## Acceptance Criteria

- [x] Failed `callTool` does not leave the widget permanently stuck in `submitting`.
- [x] Failed `sendFollowUpMessage` has a visible fallback or retry path.
- [x] User can retry submission or continue manually after a bridge failure.
- [ ] Storybook covers the error state or a direct component test covers the failed submit path.
- [x] `npm run check` passes.

## Work Log

### 2026-05-08 - Initial Code Review

**By:** Codex

**Actions:**
- Reviewed the clarification widget bridge submission flow.
- Identified missing error handling around widget-originated tool and follow-up calls.
- Created this todo as a P2 reliability finding.

**Learnings:**
- Static Storybook and protocol tests pass, but the bridge failure path is not covered.

### 2026-05-08 - Implemented

**By:** Codex

**Actions:**
- Added `error` submit state and visible retry copy in the clarification widget.
- Wrapped widget-originated submit/follow-up work in `try/catch`.
- Added `window.openai.requestClose()` support with a collapsed fallback.
- Added `openai/closeWidget` metadata to the submit tool response.
- Verified with `npm run check`.

**Learnings:**
- ChatGPT does not automatically remove the widget iframe after a component-originated tool call; the widget or tool response must request closure explicitly.

## Notes

- This is not a merge blocker if Developer Mode tests are strictly exploratory, but it should be addressed before treating the widget as production-ready.
