---
title: "ChatGPT Apps trip clarification widget routing and iframe close behavior"
module: "Travel MCP ChatGPT Apps"
date: 2026-05-08
problem_type: integration_issue
component: trip_clarification_widget
severity: medium
status: resolved
root_cause: apps_sdk_lifecycle_contract_gap
resolution_type: code_fix
tags:
  - chatgpt-apps
  - apps-sdk
  - mcp
  - widgets
  - iframe-lifecycle
  - tool-routing
  - trip-planning
related_files:
  - src/tools/travelAgent.ts
  - src/domain/clarification.ts
  - src/domain/widgetTypes.ts
  - resources/trip-clarification/widget.tsx
  - resources/trip-clarification/widget.stories.tsx
  - resources/stories/TripWorkflow.stories.tsx
  - resources/styles.css
  - tests/travelAgentTools.test.ts
  - tests/mcpIntegration.test.ts
---

# Troubleshooting: ChatGPT Apps Trip Clarification Widget Lifecycle

## Problem

The travel MCP app added a ChatGPT Apps clarification widget for broad prompts like "I want to plan a trip to Venecia", but real ChatGPT testing initially showed a normal `create_trip` tool call and text response instead of the interactive UI. After the tool routing was corrected, selecting options in the widget left the iframe visible in the conversation instead of closing after submission.

This was not a visual styling problem. It was a contract issue between model tool selection, widget-originated bridge calls, and the ChatGPT Apps iframe lifecycle.

## Symptoms

- For "I want to plan a trip to Venecia", ChatGPT called `create_trip` and responded with text rather than opening the clarification UI.
- Once a widget-first tool was introduced, the clarification widget rendered, but the iframe stayed on screen after the user selected options.
- The widget submit flow could also stay stuck in `submitting` if `callTool` or `sendFollowUpMessage` rejected.
- Local Storybook and direct tool tests did not fully prove the ChatGPT iframe behavior because the bug depended on Apps SDK host lifecycle semantics.

## Root Cause

There were two related integration gaps.

First, the tool surface did not make the clarification path obvious enough to the model. `create_trip` was a plausible first tool for vague trip-planning requests, so ChatGPT could create a workspace before asking clarifying questions. The fix added `ask_trip_clarification` as a widget-first tool and made `create_trip` explicitly say not to use it as the first action for vague requests.

Second, the widget submitted answers and sent a follow-up message, but it never asked ChatGPT to close the iframe. In ChatGPT Apps, a widget iframe is not automatically removed just because a component calls a tool or posts a follow-up message. The host needs an explicit close signal, either from the widget with `window.openai.requestClose()` or from the tool result with `_meta["openai/closeWidget"] = true`.

The original submit flow did the work but left out that lifecycle signal:

```ts
await callTool("submit_trip_clarification", {
  session_json: JSON.stringify(props),
  answers_json: JSON.stringify(answers),
});

await sendFollowUpMessage(resultText);
```

That let the app process the answers while leaving the iframe mounted.

## Investigation

The issue was first visible in ChatGPT Developer Mode screenshots: the app tool was called, but the intended UI did not appear for the vague trip prompt. Tool inspection showed the model had chosen `create_trip`, so the first fix was descriptor-level: introduce `ask_trip_clarification` and make `create_trip` less attractive for underspecified travel prompts.

After the widget rendered, the remaining iframe behavior pointed at the component submit path rather than resource registration. The relevant code was in `resources/trip-clarification/widget.tsx`, where the widget called `submit_trip_clarification` and then `sendFollowUpMessage`, and in `src/tools/travelAgent.ts`, where `submitTripClarification` returned a normal text/object tool result with no close metadata.

This matched prior project learning that Apps SDK behavior has to be tested through the real tool metadata and bridge lifecycle, not only through static Storybook rendering.

## Solution

### 1. Add a widget-first clarification tool

`ask_trip_clarification` gives the model a direct first action for simple vague prompts, while `create_trip` now tells the model to avoid creating a workspace before clarification.

```ts
server.tool(
  {
    name: "ask_trip_clarification",
    title: "Ask trip clarification questions",
    description:
      "Use this as the first action for simple underspecified travel requests: 'I want to plan a trip to X', 'I want to book hotel in X', or 'I want to book fly to X'. This renders the interactive question widget instead of creating a trip immediately.",
    schema: renderClarificationSchema,
    annotations: READ_ONLY,
    widget: { name: "trip-clarification", invoking: "Opening trip questions", invoked: "Opened trip questions" },
  },
  renderTripClarification
);
```

The paired `create_trip` description now explicitly says to use it only after the user has confirmed a saved trip workspace or after clarification answers are collected.

### 2. Request close from the widget after successful submit

The React widget now feature-detects ChatGPT's close API and calls it after the submit/follow-up path succeeds.

```ts
type OpenAIWithClose = NonNullable<Window["openai"]> & {
  requestClose?: () => Promise<void> | void;
};

async function requestHostClose(): Promise<void> {
  const openai = window.openai as OpenAIWithClose | undefined;
  await openai?.requestClose?.();
}
```

`TripClarificationLayout` receives that as `onRequestClose` and invokes it after the submit work completes:

```ts
async function submitAnswers(nextAnswers: Record<string, unknown> = answers) {
  if (!onSubmit || submitState === "submitting" || submitState === "submitted") return;
  setSubmitState("submitting");
  setSubmitError(null);
  try {
    await onSubmit(nextAnswers);
    setSubmitState("submitted");
    await onRequestClose?.();
    setIsClosed(true);
  } catch {
    setSubmitState("error");
    setSubmitError("Could not save answers. Try again.");
  }
}
```

This fixed the iframe lifecycle and also added a local collapsed fallback if the host close request is unavailable.

### 3. Return close metadata from the submit tool

The submit tool now wraps its normal result with `_meta["openai/closeWidget"] = true`.

```ts
export async function submitTripClarification(input: SubmitClarificationToolInput): Promise<CallToolResult> {
  return runTripTool(async () => {
    const session = parseJsonObject<ClarificationSession>(input.session_json, "session_json");
    const answers = parseJsonObject<Record<string, unknown>>(input.answers_json, "answers_json");
    const result = summarizeClarification(session, answers);
    return closeWidget(withText(object(result), result.summary));
  });
}

function closeWidget(result: CallToolResult): CallToolResult {
  return {
    ...result,
    _meta: {
      ...result._meta,
      "openai/closeWidget": true,
    },
  };
}
```

Using both close paths is deliberate. The widget-originated `requestClose()` handles the direct UI interaction, while the tool result metadata gives the host a lifecycle signal tied to the MCP response and is easy to cover in server-side tests.

### 4. Add submit error and retry state

The widget submit flow now treats bridge calls as unreliable IO. If `callTool`, `sendFollowUpMessage`, or `requestClose` rejects, the widget exits `submitting`, shows an alert, and keeps the selected answers available for retry.

```tsx
{submitError ? <p className="clarify-error" role="alert">{submitError}</p> : null}
```

This prevents a bridge failure from looking like an iframe-close bug.

### 5. Add regression coverage

The direct tool test now asserts the submit response carries the close metadata:

```ts
expect(submitted._meta).toMatchObject({ "openai/closeWidget": true });
```

MCP integration tests also assert that the clarification tools advertise the `trip-clarification` output template.

## Verification

The final implementation was verified with:

```bash
npm run check
```

Verified result:

- TypeScript typecheck passed.
- Vitest passed: 4 test files, 28 tests passed, 1 skipped.
- `mcp-use build` built 9 widgets successfully, including `trip-clarification`.

The local MCP dev server was also restarted during testing and exposed 13 tools, including `ask_trip_clarification`, `render_trip_clarification`, and `submit_trip_clarification`.

## Prevention

Treat tool descriptions as part of the runtime contract. If a workflow should start with a widget, provide a tool whose name and description make that first action unambiguous, and make persistence tools precise about when they should be used.

Every transient ChatGPT Apps widget should define its close lifecycle before implementation. For question flows, pickers, modals, and wizards, use both of these when practical:

```ts
await window.openai?.requestClose?.();
```

```ts
_meta: {
  "openai/closeWidget": true
}
```

Design widget bridge calls as unreliable IO. Use a small state machine such as `idle`, `submitting`, `submitted`, and `error`; keep selections intact across failures; and provide a visible retry path.

Do not trust client-controlled widget payloads. `submit_trip_clarification` still needs stricter validation for `session_json` and `answers_json`; this is tracked in `todos/007-pending-p2-validate-clarification-submit-payload.md`.

Use Storybook for visual and local interaction coverage, but verify actual tool selection, iframe lifecycle, bridge submit behavior, and close metadata in ChatGPT Developer Mode or MCP Inspector.

## Recommended Tests

- Assert `ask_trip_clarification` advertises the `trip-clarification` output template.
- Assert `submit_trip_clarification` returns `_meta["openai/closeWidget"] === true`.
- Add invalid submit payload tests for malformed JSON, unknown question ids, invalid option values, and wrong answer types.
- Add widget-level tests or stories for successful submit, failed tool call, failed follow-up message, bridge unavailable state, and selected answers preserved after failure.
- In ChatGPT Developer Mode, test exact prompts:
  - "I want to plan a trip to Venecia"
  - "I want to book hotel in Paris"
  - "I want to book fly to Tokyo"

## Related Documentation

- `docs/plans/2026-05-08-001-feat-trip-clarification-widget-plan.md` is the implementation plan for this widget. It should be refreshed with the verified close-lifecycle learning.
- `docs/solutions/integration-issues/apps-sdk-trip-workspace-mvp-tool-render-alignment-20260505.md` documents the predecessor principle: data/mutation tools should not automatically advertise widgets, while render tools own UI templates. This solution adds the transient-widget rule: render/open is not enough; completion needs explicit close behavior.
- `docs/solutions/integration-issues/schema-compatible-mcp-chatgpt-apps-inspector-20260506.md` explains why handler tests are insufficient and why real MCP tool descriptors and metadata need validation.
- `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md` explains nested iframe and bridge harness testing. The current TypeScript/React widget flow may eventually need a refreshed harness that simulates close behavior too.

## Refresh Candidates

High-confidence narrow refresh:

- `docs/plans/2026-05-08-001-feat-trip-clarification-widget-plan.md` should mention that ChatGPT does not automatically remove completed widget iframes, and that transient widgets should call `window.openai.requestClose()` and/or return `_meta["openai/closeWidget"] = true`.

Medium-confidence future refresh:

- `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md` still documents the older static HTML/Python-era harness. If refreshed, include current TypeScript/React widget behavior and close-lifecycle simulation.

Optional checklist refresh:

- `docs/plans/2026-05-04-001-docs-align-mcp-ui-foundation-plan.md` could add `requestClose` / `openai/closeWidget` to its future widget bridge checklist for transient forms, pickers, and clarification flows.
