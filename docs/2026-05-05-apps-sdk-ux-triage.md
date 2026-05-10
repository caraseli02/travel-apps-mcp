---
date: 2026-05-05
topic: apps-sdk-ux-triage
---

# Apps SDK UX Triage

Source: https://developers.openai.com/apps-sdk/concepts/ux-principles
Related UI guidance: https://developers.openai.com/apps-sdk/concepts/ui-guidelines

## MVP Standard

The MVP app should be a ChatGPT-native trip workspace, not a bundle of travel content widgets. A surface stays in the MVP only when it provides at least one of:

- persisted trip state ChatGPT cannot provide alone
- a clear in-chat action such as saving, moving, grouping, or reviewing saved trip items
- a compact visual representation that is materially better than plain text
- guided decision support based on the user's saved trip context

## Decisions

| Surface | MVP decision | Rationale |
| --- | --- | --- |
| `create_trip` | Keep | Creates persistent trip state beyond base ChatGPT. |
| `add_trip_item` | Keep, redesign as data/mutation first | Core capture action. It should save fragments without always forcing a widget render. |
| `list_trip_inbox` / Trip Inbox | Keep with constraints | Useful only as compact triage: recent saved fragments, counts, and next actions. It must not become a long static list. |
| `update_trip_item_status` | Keep | Atomic in-chat action that turns messy saved fragments into planning state. |
| `get_trip_board` / Trip Board data | Keep as data-only | Fetches board state for ChatGPT reasoning without forcing a widget render after every state change. |
| `render_trip_board` / Trip Board UI | Keep as render-only | Visual board is materially better than plain text when the user asks to scan open decisions, shortlisted, booked, and itinerary draft state. |
| `get_trip_itinerary` / Trip Itinerary | Keep | Timeline view is useful when it reflects saved scheduled items. |
| `get_trip_budget` / Trip Budget | Keep | Useful when based on saved prices and budget constraints from trip state. |
| `get_trip_summary` | Keep | Conversational summary of saved state and missing pieces. |
| Weather / forecast | Out of MVP | ChatGPT already handles weather reasoning well enough for the MVP. Maintaining these widgets does not add enough app-specific value. |
| Destination guide | Out of MVP unless redesigned | Current guide-style content is close to static travel content better suited to ChatGPT text or a website. |
| Activity cards | Defer | Could become useful if recommendations are generated from saved trip constraints, but generic city/weather recommendations are not enough. |
| Packing checklist | Defer | Could become useful if generated from the saved itinerary, traveler constraints, and booked items. Current weather-based checklist is not MVP-critical. |

## Display Mode Fit

The UI guidelines do not require maps, fullscreen, or carousels for every app. They define when each surface is appropriate. The MVP should use them deliberately:

| Pattern | Current MVP decision | When to use later |
| --- | --- | --- |
| Inline card | Primary MVP mode | Trip capture confirmation, board summary, itinerary summary, budget summary, and small triage batches. |
| Inline carousel | Plan for option selection | Hotel, restaurant, activity, flight, or saved-fragment alternatives where 3-8 similar items need quick comparison. Each item should have concise metadata, a visual when available, and one clear CTA such as Save, Shortlist, or Booked. |
| Fullscreen | Defer until richer workflows exist | Use for rich workflows that cannot fit in one card: map exploration, multi-day itinerary editing, or dense board review. Do not use fullscreen to recreate a standalone travel dashboard. |
| Map | Defer, but likely important | Use when geography changes the decision: hotel neighborhoods, restaurant clusters, route feasibility, or itinerary pacing. A map should help the user decide, not decorate a card. |
| PiP | Out of scope | Trip planning does not currently need an ongoing parallel live session. |

## UI Corrections From The Guidelines

- Current trip widgets are acceptable as an MVP starting point only if they stay lightweight and single-purpose.
- Trip Inbox should avoid deep navigation, tabs, nested scrolling, or unbounded item lists.
- Trip Board can remain inline while it is a compact state summary; if it becomes a dense planning workspace, request fullscreen.
- Future option comparison should not be a static list. Use an inline carousel for small sets of comparable options.
- Future map work should be tied to a concrete saved-trip decision, such as "Which hotel area is best for this itinerary?"

## Immediate Pruning

The unified `/mcp/travel-agent/` app surface should expose only trip workspace tools for MVP validation:

- `create_trip`
- `add_trip_item`
- `list_trip_inbox`
- `update_trip_item_status`
- `get_trip_board`
- `render_trip_board`
- `get_trip_itinerary`
- `get_trip_budget`
- `get_trip_summary`

Standalone weather, travel tips, and packing servers can remain as legacy or experimental surfaces, but they should not be part of the current ChatGPT Developer Mode MVP script.

## Developer Mode MVP Script

```text
Create a Tokyo trip.
Save this hotel option to the Tokyo trip: Booking.com hotel near Shibuya, about $180/night.
Show my trip inbox.
Move the hotel to shortlisted.
Fetch my trip board, then show the visual trip board.
Add a Day 1 morning museum visit to the trip, move it to shortlisted, then show my day-by-day itinerary.
Show my trip budget.
```

Pass condition: ChatGPT can complete the flow in-chat through persisted trip state, render only useful trip workspace widgets, and continue the conversation from the resulting state.
