---
date: 2026-05-05
topic: apps-sdk-revalidation
---

# Apps SDK Revalidation

## Problem Frame

The Travel MCP app already has working MCP tools, persisted trip state, and first-pass widget resources. Current OpenAI Apps SDK docs and official examples show that the next iteration should reuse Apps SDK component and bridge patterns rather than continuing to hand-roll every widget and tool/render coupling.

The goal is not to restart the app. The goal is to keep the current trip-planning product direction while correcting the implementation path before more UI complexity accumulates.

## Requirements

- R1. Revalidate future widget work against current OpenAI Apps SDK docs before implementation, especially component planning, ChatGPT UI, MCP server metadata, and reference pages.
- R2. Prefer official OpenAI example patterns when they match the trip use case: Pizzaz list/map/carousel patterns for travel options, Kitchen Sink Lite for host APIs and widget actions, Shopping Cart for stateful session patterns, and authenticated Python examples if account auth becomes necessary.
- R3. Keep the unified `/mcp/travel-agent/` endpoint as the primary ChatGPT Developer Mode path for trip workspace state. Weather and forecast tools/widgets are out of scope for the current MVP because ChatGPT already handles that part well enough.
- R4. Move non-trivial trip workspace flows toward the decoupled Apps SDK pattern: data/mutation tools return reusable `structuredContent`; render tools own `_meta.ui.resourceUri` and `_meta["openai/outputTemplate"]`.
- R5. Preserve simple one-shot widgets only when they directly support the MVP trip workspace. Do not spend current MVP effort aligning weather or forecast widgets.
- R6. Apply the Apps SDK UX principles as a mandatory MVP gate: the app must show conversational value, value beyond base ChatGPT, atomic model-friendly actions, helpful UI only, in-chat completion, responsiveness, discoverability, and platform fit.
- R7. Remove or redesign long-form/static widgets that are better handled by ChatGPT text or a normal website. Destination-guide style content is out of MVP unless it becomes a concise decision-support or guided-flow surface.
- R8. Trip Inbox must not become a passive long static list. It should be a compact capture/triage surface for saved fragments, with clear next actions and conversation handoff.
- R9. Add or verify tool descriptor quality for all MVP tools: clear titles, intent-based descriptions, explicit schemas, accurate annotations, and useful invocation status strings.
- R10. Treat `_meta.ui.*` as the primary metadata surface and keep OpenAI-specific aliases only for ChatGPT compatibility.
- R11. Use the MCP Apps bridge and documented `window.openai` helpers deliberately. Widgets should keep bridge event support and feature-detect optional ChatGPT helpers.
- R12. Do not adopt shadcn/ui as the default. If the project moves to React/Tailwind, prefer Apps SDK UI first and compile self-contained widget bundles with validated CSP and iframe behavior.
- R13. Require hosted ChatGPT Developer Mode validation before calling the app submission-ready, even when local protocol tests and Storybook previews pass.

## Success Criteria

- A planner can identify which official example pattern to adapt for each trip widget before writing custom UI.
- Each MVP widget passes a "helpful UI only" test: replacing it with plain text would materially degrade the task.
- The app can name at least one primary capability that relies on conversation context and persisted trip state beyond base ChatGPT.
- Tool calls are easier for ChatGPT to choose because descriptors and annotations match user intent.
- Trip Board/Inbox/Itinerary/Budget do not remount unnecessarily during multi-turn or UI-initiated interactions.
- Widgets render from tool results through Apps SDK-compatible bridge paths and still work in the Storybook harness.
- Hosted Developer Mode tests prove that ChatGPT can create a trip, save fragments, render trip workspace widgets, and continue the conversation from UI state.

## Scope Boundaries

- Do not rewrite the product around a standalone travel dashboard.
- Do not include weather or forecast widgets in the current MVP alignment scope; rely on ChatGPT for weather reasoning unless this becomes a clear product gap later.
- Do not include travel-destination long-form guide content in the current MVP unless it is reframed as a concise, app-specific decision or triage aid.
- Do not ship widgets whose main value is displaying static content that ChatGPT could answer well in plain text.
- Do not replace the Python MCP server solely because examples often use TypeScript.
- Do not migrate to React, Tailwind, Apps SDK UI, or shadcn/ui until a specific widget needs that complexity and the build/output contract is planned.
- Do not treat local Storybook or MCP protocol tests as a substitute for real ChatGPT Developer Mode widget validation.

## Key Decisions

- Keep current direction: The app remains a ChatGPT-native travel workspace centered on capture, decision support, and itinerary support.
- Simplify the MVP: Weather and forecast functionality is not important enough for the current app-specific surface, so it should not drive tool, widget, or validation work now.
- Raise the UX bar: the app should focus on persistent saved trip state and guided in-chat decisions, not content widgets or mini-website surfaces.
- Correct the architecture path: Trip workspace widgets should evolve toward decoupled data/render tools instead of attaching UI templates to most tools.
- Reuse upstream examples selectively: The official examples are starting points for interaction patterns and host API wiring, not a wholesale repo transplant.
- Stay Python-first for now: The current FastAPI/FastMCP implementation is working, tested, and compatible with official Python examples.

## Dependencies / Assumptions

- OpenAI Apps SDK docs reviewed on 2026-05-05:
  - https://developers.openai.com/apps-sdk/plan/components
  - https://developers.openai.com/apps-sdk/build/chatgpt-ui
  - https://developers.openai.com/apps-sdk/build/mcp-server
  - https://developers.openai.com/apps-sdk/reference
- Official examples reviewed on 2026-05-05:
  - https://github.com/openai/openai-apps-sdk-examples
- Current local tests pass: `51 passed, 1 skipped`.

## Outstanding Questions

### Resolve Before Planning

- None.

### Deferred to Planning

- [Affects R2][Technical] Which exact official example should be adapted first for Trip Board: Pizzaz list/map/carousel, Kitchen Sink Lite, or Shopping Cart session state?
- [Affects R4][Technical] Which current tools should split first into data-only and render-only tools without harming ChatGPT tool choice?
- [Affects R6-R8][Product/UX] Which current widgets fail the Apps SDK UX checklist and should be removed, collapsed into plain text, or redesigned before implementation?
- [Affects R9][Technical] Does the current Python FastMCP decorator surface support every descriptor field we need, or should some tools use lower-level MCP registration like the official Python examples?
- [Affects R13][Needs research] What production/tunnel host values should be used for DNS rebinding protection and `_meta.ui.domain` during Developer Mode validation?

## Next Steps

-> `/prompts:ce-plan` for structured implementation planning.
