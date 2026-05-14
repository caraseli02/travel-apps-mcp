---
date: 2026-05-11
topic: current-widget-ux
focus: Review current changes and identify better user experience directions
---

# Ideation: Current Widget UX

## Codebase Context

The project is a TypeScript `mcp-use` ChatGPT Apps MCP server with React widget resources in `resources/`, Zod widget prop contracts in `src/domain/widgetTypes.ts`, and tests/build validation through `npm run check`. Current uncommitted changes focus on `resources/styles.css`, `resources/trip-clarification/widget.tsx`, `resources/trip-itinerary/widget.tsx`, and the itinerary Storybook story.

The current diff moves the UI in two promising directions:

- Trip clarification now has a front-door intent picker, destination hero strip, progress dots, and a live context bar.
- Trip itinerary now experiments with feasibility scoring, live status grounding, transit lines, rationale text, and action buttons.

Important constraints from existing docs and prior learnings:

- Widgets should feel ChatGPT-native: focused, compact, no app-shell chrome, no excessive decorative styling, no nested scrolling, mobile-safe at narrow widths.
- Prior UI bug docs warn against generic demo polish, emoji-heavy affordances, and broad multicolor treatment.
- `DESIGN.md` calls for a warm travel journal feel, restrained category colors, compact cards, no nested cards, no glassmorphism, and spacing on a 4px rhythm.
- The current itinerary agentic data is Storybook-only and not part of `tripItineraryPropsSchema`; production props still expose scheduled items, unscheduled items, gaps, and counts.
- `npm run typecheck` passes, but `git diff --check` currently reports whitespace issues in `resources/trip-itinerary/widget.tsx` and `resources/styles.css`.

## Ranked Ideas

### 1. Turn Clarification Into a True Guided Intake State Machine
**Description:** Make the new intent picker operational instead of cosmetic. Persist the chosen intent into answers or widget state, use it to branch the remaining questions, and show a concrete "what we know / what is missing / what happens next" summary after each answer.
**Rationale:** The current intent picker is visually strong but does not yet alter the downstream flow. The highest UX gain is reducing irrelevant questions and making each tap feel like it changed the trip plan. This fits the existing `prepare_trip_clarification`, `ask_trip_clarification`, and `submit_trip_clarification` tool surface.
**Downsides:** Requires schema/tool work, not just UI polish. The branching rules need to stay explainable so the agent does not feel arbitrary.
**Confidence:** 92%
**Complexity:** Medium
**Status:** Explored

### 2. Replace "Agentic Demo" Itinerary Badges With Verified Plan Diagnostics
**Description:** Convert feasibility score, live status, transit time, and rationale from demo-only display fields into first-class, schema-backed diagnostics. Start small: support per-item `rationale`, per-transition `transit_to_next`, and a top-level `validation_report` produced by deterministic trip builders.
**Rationale:** The itinerary direction is the most compelling current change, but trust collapses if "Live Status" and "Feasibility Score" are only fixture labels. Users need to know what is verified, what is estimated, and what still needs checking.
**Downsides:** Requires domain model changes and careful language around "live" if the system is not actually checking external sources.
**Confidence:** 90%
**Complexity:** Medium
**Status:** Explored

### 3. Add a "Next Best Action" Rail Across Widgets
**Description:** Every widget should surface one contextual next action tied to real tool calls: answer missing dates, shortlist an item, assign a day, optimize an overpacked gap, review budget risk, or confirm a booked item. Keep it compact and anchored at the bottom or header, not as a large empty-state panel.
**Rationale:** The current changes add action buttons like "Approve Plan", "Optimize Gaps", and "Add Activity", but they are not connected to state. A consistent next-action pattern would make the workspace feel collaborative without turning widgets into a full app.
**Downsides:** Needs a shared action vocabulary and may require disabling or hiding actions when no tool handler exists.
**Confidence:** 88%
**Complexity:** Medium
**Status:** Explored

### 4. Reframe the Trip Board Around Planning Phases
**Description:** Replace the five-lane decision board with a compact three-phase view: Researching, Chosen, Confirmed. Keep missing pieces visible as a small guided checklist rather than a full lane. Use existing statuses internally but present the mental model users naturally understand.
**Rationale:** Current CSS already sketches a `phase-board`, but the rendered board still exposes implementation lanes like `open_decisions` and `itinerary_draft`. A phase model would make the board easier to scan and aligns with how people actually plan trips.
**Downsides:** Status mapping must be precise so power users do not lose important distinctions like `needs_review` versus `shortlisted`.
**Confidence:** 84%
**Complexity:** Medium
**Status:** Unexplored

### 5. Make Trust States Explicit: Verified, Estimated, User-Provided, Needs Check
**Description:** Introduce a small trust vocabulary across context chips, itinerary items, budget rows, and board cards. Avoid theatrical "live" copy unless data was checked recently. Example labels: "You said", "Estimated", "Saved", "Needs dates", "Checked 10m ago".
**Rationale:** Travel planning has high trust friction. The current UI mixes known fields, answers, grounding, and rationale, but the user cannot tell which claims are durable facts versus model suggestions.
**Downsides:** Adds visual vocabulary and requires discipline in data provenance. Overuse can make cards noisy.
**Confidence:** 86%
**Complexity:** Low/Medium
**Status:** Unexplored

### 6. Build a Widget Story Matrix for End-to-End Planning Moments
**Description:** Add Storybook stories that represent full user moments rather than isolated happy states: vague first prompt, known destination with missing dates, overpacked itinerary warning, budget over target, shortlist-to-booked transition, failed save rollback, and mobile 390px views.
**Rationale:** Previous docs show Storybook is the review surface. The current changes add important new states, but only itinerary has a new "Agentic" fixture and clarification does not yet cover the destination-less intent picker. Better stories will make UX iteration faster and catch regressions before ChatGPT Developer Mode.
**Downsides:** Does not directly improve production behavior unless paired with visual/interaction QA.
**Confidence:** 82%
**Complexity:** Low
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Add more visual polish to the current itinerary demo | Too vague and risks deepening the gap between demo labels and real data. |
| 2 | Keep the intent picker as a purely visual warm-up step | Weak value; it adds friction unless it changes the question path or saved context. |
| 3 | Add a map as the next major widget | Potentially valuable, but not grounded in current trip item coordinates or tool data. |
| 4 | Build a standalone full-screen travel app now | Too expensive relative to the current ChatGPT Apps widget surface. |
| 5 | Add drag-and-drop everywhere | Attractive but heavier than needed; button-based state changes already exist and fit iframe constraints better. |
| 6 | Make every widget use the new agentic blue/green visual language | Duplicates weaker generic dashboard patterns and conflicts with the warmer design direction. |
| 7 | Use emoji as primary category and status icons | Prior UI docs explicitly warn this made widgets feel generic and less ChatGPT-native. |
| 8 | Add loyalty optimization as a visible section immediately | Interesting, but the current app has no loyalty data or tool contract. |
| 9 | Show a large onboarding explainer inside widgets | ChatGPT users are mid-conversation; visible instructions would add clutter. |
| 10 | Convert every prop schema to flexible `z.any()` blocks for generative UI | Too risky for reliability; better to extend typed contracts intentionally. |
| 11 | Add decorative destination imagery to the widget headers | Not grounded in current resources and likely to consume scarce iframe space. |
| 12 | Use a single global feasibility score as the main itinerary headline | Too reductive unless backed by item-level diagnostics and constraints. |
| 13 | Add background animations to make widgets feel alive | Decorative motion conflicts with the compact, task-focused widget surface. |
| 14 | Hide all uncertainty to keep the UI clean | Better visually, but undermines trust in travel planning where uncertainty is central. |
| 15 | Split clarification into one screen per micro-intent category | Duplicates the stronger guided intake state machine idea without solving persistence. |
| 16 | Add more lanes to the board for every status | Increases cognitive load; phase grouping is a stronger user-facing abstraction. |

## Session Log

- 2026-05-11: Initial ideation - 22 generated, 6 survived. Grounded in current uncommitted widget changes, project docs, prior UI learnings, and typecheck/diff-check results.
- 2026-05-11: Expanded ideas 1-5 with deeper UX detail, excluding Storybook story matrix per request.
- 2026-05-11: User identified ideas 1, 2, and 4 as most interesting candidates for deeper brainstorming.
- 2026-05-11: Handed off combined ideas 1, 2, and 4 to ce:brainstorm as one UX system.
- 2026-05-11: Brainstorm resolved first 5 minutes as the priority, hybrid workspace creation as the save rule, and readiness checks as the first diagnostic layer.

## Expanded Notes

### 1. Guided Intake State Machine

The current clarification widget has the right emotional shape: it asks "what kind of trip are you planning?" before dropping the user into form-like questions. The missing piece is that this answer should alter the actual questioning strategy.

Concrete version:

- Experience-first: ask about pace, interests, must-have vibe, mobility tolerance, and preferred neighborhoods before asking budget.
- Budget-first: ask total budget, comfort/flexibility, party size, dates, and what tradeoffs are acceptable.
- Date-constrained: ask fixed anchor, arrival/departure flexibility, event times, and transport constraints.
- Loyalty-driven: ask airline/hotel programs, points versus cash preference, status goals, and acceptable routing tradeoffs.

The UI should also show what changed after a choice. For example: "Budget-first selected. I will ask cost and flexibility questions first." This makes the picker feel useful rather than decorative.

Implementation implication: add an answer like `{ planning_priority: "budget" }` or a dedicated field to the clarification state, then let the domain builder reorder or filter questions. Avoid hardcoding too much in the widget; the widget should render the flow selected by the backend.

### 2. Verified Plan Diagnostics

The current itinerary experiment points at the right trust problem: users do not just need a pretty itinerary, they need to know whether the plan works. But the labels must be honest. "Live Status" and "Feasibility Score" are high-trust claims and should not appear unless the backend can support them.

Useful first diagnostic fields:

- `validation_report`: status, score, message, and checked inputs.
- `item.rationale`: why this item is scheduled here.
- `item.grounding`: source/status/checked_at, but only when real.
- `transition.transit_to_next`: duration, mode, confidence, buffer.
- `warnings`: impossible opening hours, too-tight transfer, budget risk, duplicate area backtracking.

The better UX is not one big score. It is a readable plan audit: "2 tight transitions", "1 missing reservation", "Budget still estimated", "All booked items preserved." This helps users trust the agent without forcing them to manually verify every line.

Implementation implication: extend `tripItineraryPropsSchema` intentionally instead of casting fixture-only fields with `any`. Start with deterministic local diagnostics from known item data before promising external verification.

### 3. Next Best Action Rail

Right now the widgets show some actions, but the user has to infer what matters next. A next-action rail would make each widget answer: "What should I do now?"

Examples:

- Clarification: "Answer dates" or "Skip and continue with estimates."
- Inbox: "Review 3 new saved items."
- Board: "Choose between 2 hotels."
- Itinerary: "Fix tight transfer on Day 2."
- Budget: "Add prices for 4 unpriced items."

The action should be singular or at most two choices. It should map to an actual tool call, follow-up message, or existing interaction. Avoid buttons that only look useful.

The most important design rule: next actions should be state-derived. If the trip has missing dates, dates are the action. If the itinerary is feasible but has unpriced hotels, budget is the action. This makes the app feel like a partner tracking planning progress.

Implementation implication: define a shared `next_actions` shape or compute per-widget actions from existing props. Then render a consistent compact component across widgets.

### 4. Planning Phases Board

The current board lanes expose internal workflow language: open decisions, shortlisted, booked, itinerary draft, missing pieces. That is useful for implementation but heavier than how travelers think.

A better user-facing model:

- Researching: ideas still being collected or compared.
- Chosen: likely picks that need dates, prices, booking, or placement.
- Confirmed: booked or locked items.

Missing pieces should not be a full lane. They should be a checklist or prompt area: "Need dates", "Need budget", "Need departure city", "Need hotel area." This keeps gaps visible without making them compete with real trip items.

The benefit is scannability. A traveler can immediately answer: what are we considering, what have we chosen, what is locked?

Implementation implication: keep existing statuses internally, but map them into phases for display. For example, `needs_review` and inbox-like items can appear under Researching; `shortlisted` under Chosen; `booked` under Confirmed. Preserve detailed status in card metadata or actions.

### 5. Explicit Trust States

Travel planning fails when users cannot tell what the agent knows versus what it guessed. The UI should label provenance lightly.

Useful trust labels:

- "You said" for user-provided answers.
- "Saved" for persisted trip state.
- "Estimated" for inferred prices, transit, durations, or dates.
- "Checked" for verified external or tool-backed facts.
- "Needs check" for claims that should not be trusted yet.

These labels should be small and sparse. Use them on the claims that affect decisions: prices, availability, opening hours, transit time, reservation status, cancellation policy, and dates.

Better copy examples:

- Bad: "Live Status: Available"
- Better: "Checked now: available" if truly checked.
- Better fallback: "Needs check: availability not verified"
- Bad: "Feasibility Score 94%"
- Better: "Plan check: 1 tight transfer, budget still estimated"

Implementation implication: add a simple provenance/trust model to item fields or diagnostics. Avoid styling every row with badges; the goal is confidence, not visual clutter.
