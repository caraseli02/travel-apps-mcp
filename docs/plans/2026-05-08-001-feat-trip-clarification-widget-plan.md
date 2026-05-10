---
title: "feat: Add Trip Clarification Widget"
type: feat
status: active
date: 2026-05-08
origin: docs/brainstorms/2026-05-05-apps-sdk-revalidation-requirements.md
---

# feat: Add Trip Clarification Widget

## Overview

Add a ChatGPT Apps clarification widget for early, underspecified travel intents such as "I want to plan a trip to X", "I want to book hotel in X", and "I want to book fly to X". The widget should let ChatGPT ask a small sequence of high-value questions with multiple-choice answers, a free-form "Something else" affordance, skip support, previous/next navigation, and close behavior matching the provided screenshots.

This plan carries forward the origin decision that the app should stay centered on persisted trip workspace state and guided in-chat decisions, not generic destination content (see origin: `docs/brainstorms/2026-05-05-apps-sdk-revalidation-requirements.md`). The clarification widget is in scope because it improves an app-specific workflow: turning vague travel intent into a saved trip workspace, hotel/flight fragment, or missing-piece decision without forcing ChatGPT to ask a long text questionnaire.

## Problem Statement / Motivation

Today the travel-agent MCP surface can create trips, save travel fragments, and render trip workspace views, but it has no compact UI for gathering missing constraints before creating or enriching state. A vague first message leaves ChatGPT to continue with plain text, which is slower and less structured than the MCP Apps UI pattern shown in the screenshots:

- `/Users/vladislavcaraseli/Desktop/Screenshot 2026-05-07 at 14.56.13.png`
- `/Users/vladislavcaraseli/Desktop/Screenshot 2026-05-07 at 14.56.38.png`
- `/Users/vladislavcaraseli/Desktop/Screenshot 2026-05-07 at 14.56.21.png`

The new widget should ask only for missing information. If memory or existing trip state already contains destination, dates, party size, budget, or preference signals, those should reduce or reshape the questions. The answer options must vary by intent:

- Trip planning: duration, travel style, approximate timing, party profile, budget comfort, must-haves.
- Hotel booking: dates/nights, area preference, budget per night, room/party needs, hotel style, cancellation flexibility.
- Flight booking: origin, dates/flexibility, round trip vs one way, airport preference, baggage, budget/time tradeoff.

## Proposed Solution

Introduce a clarification flow with three parts:

1. A data tool that creates a clarification session from inferred intent, destination, known trip memory/state, and missing fields.
2. A render tool that displays a new `trip-clarification` React widget from structured session props.
3. A mutation/finalization path that records selected answers, returns model-visible context, and allows ChatGPT to create/update the trip workspace or save hotel/flight constraints.

Prefer a decoupled Apps SDK shape from the origin document: data/mutation tools return reusable `structuredContent`, while render tools own widget metadata and output templates (see origin: `docs/brainstorms/2026-05-05-apps-sdk-revalidation-requirements.md`). The widget should use the MCP Apps bridge for UI-originated actions where supported, with compatibility metadata retained for ChatGPT.

## Technical Approach

### Intended Tool Surface

Add tools in `src/tools/travelAgent.ts`:

- `prepare_trip_clarification`: read-only/data-oriented tool. Input includes `utterance`, optional `trip_id`, inferred `intent` (`plan_trip`, `book_hotel`, `book_flight`), `destination`, and any known values ChatGPT can infer from memory or conversation. Output is a normalized clarification session.
- `render_trip_clarification`: read-only render tool. Input accepts the session payload or session id and returns the `trip-clarification` widget with the same structured content.
- `submit_trip_clarification`: mutation tool. Input includes answers, skipped question ids, optional free-form values, and optional `trip_id`. Output includes `resolved_fields`, `remaining_fields`, and recommended next action (`create_trip`, `save_constraints`, `save_hotel_request`, `save_flight_request`, or `ask_followup_text`).

Implementation can start with stateless session payloads to avoid premature persistence. If ChatGPT Developer Mode proves the widget needs resume/close recovery across turns, add a persisted session model later.

### Structured Data Contract

Add types and Zod schemas in `src/domain/widgetTypes.ts`:

```ts
// src/domain/widgetTypes.ts
export const tripClarificationPropsSchema = z.object({
  session_id: z.string(),
  intent: z.enum(["plan_trip", "book_hotel", "book_flight"]),
  destination: z.string().nullable(),
  current_index: z.number(),
  total_questions: z.number(),
  known_fields: z.record(z.string(), z.unknown()),
  questions: z.array(z.object({
    id: z.string(),
    prompt: z.string(),
    reason: z.string().optional(),
    required: z.boolean(),
    answer_type: z.enum(["single_choice", "multi_choice", "free_text"]),
    options: z.array(z.object({
      id: z.string(),
      label: z.string(),
      value: z.string(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })),
    allow_free_text: z.boolean(),
    allow_skip: z.boolean(),
  })),
  answers: z.record(z.string(), z.unknown()),
});
```

Keep domain logic for question selection outside the React component, likely in `src/domain/trips.ts` or a new `src/domain/clarification.ts`, so it can be unit-tested without rendering.

### Widget Resource

Add `resources/trip-clarification/widget.tsx` and `resources/trip-clarification/widget.stories.tsx`.

The widget should visually follow the screenshots while still matching local widget design constraints in `DESIGN.md`: compact iframe surface, maximum widget width, restrained styling, no dashboard feel, and no marketing copy. Use stable layout dimensions so question rows, skip buttons, and navigation do not shift as answers change.

Core UI behavior:

- Header with current question prompt and right-side controls: previous, step count, next, close.
- Answer rows with numeric key badges, hover/selected state, and trailing arrow/enter affordance.
- "Something else" free-form row with edit icon.
- Skip button when allowed.
- Keyboard shortcuts for numeric selection, Enter, Escape, and arrow navigation where feasible.
- Accessible labels and focus order for all controls.
- Empty/error state if no questions are returned.

### Existing State And Memory Input

The app cannot directly read ChatGPT memory. Instead, tool schemas should let ChatGPT pass model-known facts into `prepare_trip_clarification`. Existing local trip state can be read by `trip_id`:

- If `trip_id` exists, use `getTripStore().getTrip()` and saved items to avoid asking for already-known destination, dates, hotel, transport, and activity signals.
- If no `trip_id` exists, use parsed destination/intent from the current utterance and any fields ChatGPT includes from conversation memory.
- Preserve origin scope: do not add generic destination guide content as part of this flow unless the answer becomes a saved preference, constraint, or decision-support field (see origin).

### Intent-Specific Question Strategy

The question engine should choose up to 3 initial questions by default, with dynamic additions only when critical fields remain unknown.

For `plan_trip`:

- Ask duration if no dates/nights are known.
- Ask travel style if no preference signals exist.
- Ask timing if no date or season is known.

For `book_hotel`:

- Ask check-in/check-out or nights if unknown.
- Ask budget/area/style based on what is missing.
- Prefer saving the result as a hotel constraint or hotel search brief, not as a booked hotel.

For `book_flight`:

- Ask origin if unknown.
- Ask travel dates/flexibility if unknown.
- Ask round-trip/one-way or time/budget tradeoff if unknown.
- Use `flight` or `transport` item types consistently with `ITEM_TYPES` in `src/domain/trips.ts`.

## System-Wide Impact

- **Interaction graph:** user utterance -> ChatGPT chooses `prepare_trip_clarification` -> optional `render_trip_clarification` -> widget selection calls `submit_trip_clarification` or posts model-visible context -> ChatGPT calls `create_trip` / `add_trip_item` / `get_trip_board` as needed.
- **Error propagation:** bad intent, missing destination, invalid answer ids, unknown trip ids, and store failures should return `isError` tool results using the existing `runTripTool`/`toolError` pattern.
- **State lifecycle risks:** avoid creating a trip before the user has confirmed enough fields unless ChatGPT explicitly chooses to create a minimal workspace. Do not mark hotel/flight requests as booked.
- **API surface parity:** update MCP integration tests, direct tool tests, widget type schemas, Storybook scenarios, README tool list, and any generated `mcp-use` registry output.
- **Integration test scenarios:** cover first-time trip planning, existing trip enrichment, hotel-specific clarification, flight-specific clarification, skip/free-text answers, and widget render metadata.

## SpecFlow Analysis

### User Flow Overview

1. First-time planning flow: user says "I want to plan a trip to Venice" -> app asks duration/style/timing -> answers become structured trip preferences -> ChatGPT creates trip and optionally renders the board.
2. Existing trip flow: user already has a trip workspace -> app asks only missing questions -> answers save as constraints/questions/items on that trip.
3. Hotel booking flow: user says "I want to book hotel in Paris" -> app asks lodging-specific missing fields -> answer becomes a hotel search/decision brief in the trip inbox.
4. Flight booking flow: user says "I want to book fly to Tokyo" -> app asks transport-specific missing fields -> answer becomes a flight/transport search brief in the trip inbox.
5. Partial completion flow: user skips or closes -> ChatGPT receives partial context and can continue conversationally without losing completed selections.

### Key Gaps To Resolve During Implementation

- Decide whether `submit_trip_clarification` should directly persist constraints or only return model-visible structured context for ChatGPT to act on. Recommended MVP: return structured context and let ChatGPT call existing persistence tools, except when a `trip_id` is provided and the user clearly submitted.
- Decide whether sessions are persisted. Recommended MVP: stateless payload with `session_id`, because current stores persist trip state, not transient UI state.
- Decide exact ChatGPT bridge support in `mcp-use/react` for widget-originated `tools/call` and `ui/message`. If the abstraction is insufficient, use feature-detected `window.openai` APIs directly behind a small helper.
- Define how many questions are acceptable. Recommended MVP: 3-question default matching screenshots, with hard cap of 5.

## Acceptance Criteria

- [ ] Vague trip, hotel, and flight utterances can produce a `trip-clarification` widget with intent-specific questions and options.
- [ ] Questions are omitted or changed when destination, dates, duration, party, budget, hotel, or transport facts are already known from `trip_id` state or model-provided memory fields.
- [ ] Widget answers produce structured output that ChatGPT can use to create a trip, save constraints, or save hotel/flight request fragments.
- [ ] Skip and "Something else" are supported per question.
- [ ] Closing or partially completing the widget does not create false bookings or destructive state.
- [ ] Existing trip tools remain backward-compatible.
- [ ] Storybook includes screenshot-aligned stories for plan-trip, hotel, flight, known-memory, skipped, free-text, mobile, and empty/error states.
- [ ] `npm run check` passes.
- [ ] Hosted ChatGPT Developer Mode is used before marking the feature submission-ready, consistent with the origin requirement.

## Success Metrics

- For the three target utterances, the model can move from vague input to a usable trip workspace/search brief with no more than one text-only follow-up.
- The widget asks no duplicate question when equivalent information is already in trip state.
- Tool metadata remains clear enough that ChatGPT chooses clarification only for underspecified planning/booking intents, not for every travel message.
- Storybook and MCP integration tests catch schema drift between `structuredContent`, widget props, and tool descriptors.

## Dependencies & Risks

- `mcp-use` widget registration and React `useWidget` should remain the primary local abstraction.
- Official Apps SDK docs emphasize that UI components turn structured tool results into iframe UI, and the MCP Apps bridge supports tool inputs/results, UI tool calls, follow-up messages, and model-context updates.
- ChatGPT memory is not directly queryable by this app, so "memory" must arrive through model-provided tool input or existing trip store state.
- UI-originated tool calls may require `_meta.ui.visibility` / `tools/call` compatibility checks and ChatGPT Developer Mode validation.
- The app should avoid adding external booking APIs in this feature. "Book hotel/flight" should mean clarify and save the booking/search intent unless a future plan adds real booking integration.

## Implementation Notes

- Add a focused domain module if `src/domain/trips.ts` becomes too broad: `src/domain/clarification.ts`.
- Keep `ITEM_TYPES` unchanged unless a new persisted type is genuinely needed. Hotel and flight map cleanly to existing `hotel` and `flight` values.
- Prefer a render/data split similar to `get_trip_board` and `render_trip_board`.
- Keep the widget resource named `trip-clarification` and add it to generated resources via `mcp-use build`.
- Update README tool list after the tool surface changes.

## Test Plan

- Unit tests in `tests/travelAgentTools.test.ts` for question generation and answer submission.
- MCP integration coverage in `tests/mcpIntegration.test.ts` for advertised tool schemas, output templates, and structured content.
- Widget schema tests through `src/domain/widgetTypes.ts`.
- Storybook stories in `resources/trip-clarification/widget.stories.tsx`, plus a workflow story in `resources/stories/TripWorkflow.stories.tsx`.
- Browser QA in Storybook across desktop and mobile widths, with nested iframe inspection if the harness renders iframes.
- Hosted ChatGPT Developer Mode validation for:
  - "I want to plan a trip to Venecia"
  - "I want to book hotel in Venice"
  - "I want to book fly to Venice"
  - same flows with an existing saved trip.

## Sources & References

### Origin

- **Origin document:** `docs/brainstorms/2026-05-05-apps-sdk-revalidation-requirements.md` — carried-forward decisions: keep current ChatGPT-native trip workspace direction, focus widgets on persisted state and guided decisions, prefer decoupled data/render tools, require Apps SDK validation, and keep generic destination/weather content out of MVP.

### Internal References

- `src/tools/travelAgent.ts` — existing tool registration, tool metadata, and data/render split.
- `src/domain/trips.ts` — trip item types, classification, board/itinerary/budget builders, and validation.
- `src/domain/widgetTypes.ts` — current widget prop schemas.
- `resources/trip-board/widget.tsx` — current React widget metadata/useWidget pattern.
- `resources/stories/TripWorkflow.stories.tsx` — current chat workflow Storybook examples.
- `DESIGN.md` — ChatGPT iframe visual constraints.
- `docs/solutions/integration-issues/apps-sdk-trip-workspace-mvp-tool-render-alignment-20260505.md` — prior tool/render alignment learning.
- `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md` — prior Storybook/widget verification learning.

### External References

- OpenAI Apps SDK component planning: https://developers.openai.com/apps-sdk/plan/components
- OpenAI Apps SDK ChatGPT UI: https://developers.openai.com/apps-sdk/build/chatgpt-ui
- OpenAI Apps SDK MCP server: https://developers.openai.com/apps-sdk/build/mcp-server
- OpenAI Apps SDK reference: https://developers.openai.com/apps-sdk/reference
- mcp-use TypeScript widget/tool docs: https://docs.mcp-use.com/typescript/server/apps-sdk-resources
