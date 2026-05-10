---
title: "docs: Align MCP app UI foundation"
type: docs
status: active
date: 2026-05-04
---

# docs: Align MCP app UI foundation

## Overview

Review and update the product, design, and related MCP Apps documents so future UI work follows current OpenAI Apps SDK UI guidance, preserves the Travel MCP product direction, and makes a deliberate decision about Tailwind CSS, shadcn/ui, and Apps SDK UI usage before any new UI implementation.

This is a planning and documentation task only. Do not change widget code, introduce build tooling, or implement shadcn/Tailwind in this work item.

## Problem Statement / Motivation

The repo already has first-pass MCP Apps UI resources for weather, packing, travel tips, Trip Inbox, and Trip Board. The current docs also contain strong product direction: ChatGPT users are mid-conversation, overwhelmed by scattered trip planning state, and need a persistent travel workspace rather than a standalone dashboard.

The risk is that future UI work drifts into incorrect patterns:

- Website-style navigation or dashboards inside ChatGPT widgets.
- Ornament-heavy card grids that conflict with the product's "quiet competence" direction.
- Stale MCP Apps assumptions, such as older MIME or bridge language.
- Framework adoption that breaks widget portability, CSP, bundle size, or ChatGPT runtime behavior.
- shadcn/ui or Tailwind adoption without deciding whether the project is ready for a React/Vite component build pipeline.

## Research Findings

### Local Repository

- `PRODUCT.md` defines the target user as a ChatGPT user planning in conversation, not a standalone web app user. It prioritizes persistence, saved fragments, and decision support over trip generation.
- `PRODUCT.md` explicitly says the UI should feel like a well-designed notebook, with dense but quiet information and no decorative excess.
- `DESIGN.md` already sets useful constraints: compact iframe layouts, no nested cards, restrained motion, two elevation levels, and spacing on a 4px rhythm.
- `docs/chatgpt_apps_readiness_review.md` says the project has first-pass Apps-aware UI resources but still needs hosted ChatGPT Developer Mode validation.
- `docs/testing_chatgpt_apps.md` correctly separates MCP protocol checks from real ChatGPT widget bridge checks and documents current widget resource URIs.
- `todos/001-ready-p1-mcp-learning-roadmap.md` says the first UI version should use vanilla JavaScript and avoid build tooling until the HTML contract works.
- No `docs/solutions/` institutional knowledge base exists in this repo.
- No `package.json`, Tailwind config, or `components.json` exists, so there is currently no frontend build pipeline.

### OpenAI Apps SDK Guidance

- Apps should extract a few atomic actions rather than porting a whole website into ChatGPT.
- UI should clarify actions, capture inputs, or present structured results; ornamental components that do not advance the task should be skipped.
- Inline widgets are best for lightweight, single-purpose content; fullscreen is for richer workflows that cannot be reduced to a single card.
- Pre-publish checks include conversational value, atomic model-friendly actions, helpful UI, in-chat completion, responsiveness, discoverability, and platform fit.
- `window.openai` is a ChatGPT compatibility layer and should be feature-detected; baseline MCP Apps compatibility should not rely blindly on ChatGPT-only helpers.
- Resource metadata should prefer `_meta.ui.prefersBorder`, `_meta.ui.csp`, and `_meta.ui.domain`; `_meta["openai/widgetDescription"]` remains useful to reduce redundant assistant narration.
- `_meta.ui.domain` is required for app submission and should be unique per app once the production domain is known.

### Tailwind, shadcn/ui, and Apps SDK UI

- OpenAI's UI guidelines recommend the Apps SDK UI design system as optional but helpful for ChatGPT-native consistency. It provides Tailwind foundations, CSS variable tokens, and accessible components.
- Apps SDK UI requires React 18 or 19 and Tailwind 4.
- Tailwind CSS v4 is compatible with Vite and can be compiled into static CSS.
- shadcn/ui supports Vite and Tailwind 4, but it assumes a React component project and generated component files.
- shadcn/ui can work for MCP Apps only if components are compiled into self-contained widget bundles and the final widget HTML respects Apps SDK bridge, CSP, metadata, iframe sizing, accessibility, and bundle-size constraints.
- For this repo's current stage, shadcn/ui should not be adopted wholesale. If React/Tailwind is introduced later, prefer Apps SDK UI first because it is purpose-built for ChatGPT Apps.

## Proposed Solution

Create a documentation foundation that makes future UI decisions explicit and hard to misread:

1. Add a concise MCP Apps UI foundation document.
2. Update product/design docs to cross-link the OpenAI UX/UI principles and local constraints.
3. Add a framework decision record for vanilla HTML/CSS, Tailwind CSS, Apps SDK UI, and shadcn/ui.
4. Update testing/readiness docs with explicit validation gates for any future UI or tooling change.
5. Add a "do not implement until" checklist for React/Tailwind/shadcn adoption.

## Priority Subtasks

### P0: Audit and source-of-truth map

- [ ] Review `PRODUCT.md`, `DESIGN.md`, `.kiro/specs/mcp-travel-planner-ui/requirements.md`, `.kiro/specs/mcp-travel-planner-ui/design.md`, `docs/chatgpt_apps_readiness_review.md`, `docs/testing_chatgpt_apps.md`, and `todos/001-ready-p1-mcp-learning-roadmap.md`.
- [ ] Create or update a single "UI foundation" doc that links to the canonical product, design, Apps SDK, and testing references.
- [ ] Mark stale or superseded guidance explicitly instead of leaving contradictory requirements in place.

### P1: Align product and design guidelines with Apps SDK UX

- [ ] Preserve the core product direction: capture first, decision support second, itinerary generation later.
- [ ] Add ChatGPT-native UX guardrails: atomic actions, conversational entry, no website porting, no redundant content, no ad/upsell surfaces.
- [ ] Document when to use inline widgets versus fullscreen requests.
- [ ] Add a short "wrong UI examples" section grounded in the product anti-references.

### P2: Define MCP Apps UI implementation standards

- [ ] Require every widget to render correctly between 320px and 800px.
- [ ] Require complete HTML resources with `text/html;profile=mcp-app` unless a future build pipeline produces equivalent bundled output.
- [ ] Require bridge feature detection for `window.openai`, `openai:set_globals`, and `ui/notifications/tool-result`.
- [ ] Require top-level `structuredContent`, concise `content`, and widget-only `_meta` separation.
- [ ] Require resource metadata using `_meta.ui.prefersBorder`, `_meta.ui.csp`, and eventually `_meta.ui.domain`.
- [ ] Require versioned `ui://...-vN.html` URIs for incompatible widget changes.

### P3: Decide Tailwind/shadcn foundation

- [ ] Record the current default: vanilla HTML/CSS/JS remains preferred until hosted ChatGPT Developer Mode validation is complete.
- [ ] Record Tailwind CSS as acceptable only as a compile-time tool that outputs static CSS for MCP widget bundles.
- [ ] Record Apps SDK UI as the preferred React/Tailwind path if the project moves to React widgets.
- [ ] Record shadcn/ui as conditional and secondary: only use generated components that are audited for iframe sizing, accessibility, CSP, bundle size, and design fit.
- [ ] Explicitly reject importing shadcn blocks wholesale, app-shell layouts, sidebars, marketing sections, or generic dashboard patterns into ChatGPT widgets.

### P4: Add validation gates

- [ ] Update testing docs so future UI work must pass MCP protocol checks and real ChatGPT Developer Mode bridge checks.
- [ ] Add a visual QA checklist for mobile/narrow iframe, desktop/wide iframe, loading, empty, error, long text, and sensitive-data display.
- [ ] Add a metadata checklist for MIME type, CSP, widget description, resource URI versioning, and production domain readiness.
- [ ] Add framework-specific checks for any React/Tailwind bundle: generated HTML size, no missing static assets, no external unapproved domains, no runtime dependency on local dev server paths.

## System-Wide Impact

### Interaction Graph

Documentation changes influence future implementation by setting clear gates:

User request in ChatGPT -> model chooses MCP tool -> MCP server returns `structuredContent`, `content`, and widget metadata -> ChatGPT reads `ui://` resource -> widget renders inside iframe -> widget receives tool output through bridge events -> user continues in conversation.

Every design guideline should map to that flow. If a proposed UI pattern does not improve one step of this chain, it should not become a default pattern.

### Error & Failure Propagation

The docs should identify common failure classes before implementation:

- MCP protocol passes but ChatGPT bridge fails.
- Widget renders locally but fails because `window.openai` is unavailable or not feature-detected.
- UI resource metadata is valid locally but missing production `_meta.ui.domain`.
- Tailwind/shadcn build works in dev but emits assets not allowed by widget CSP.
- Tool output is exposed incorrectly through `content` instead of widget-only `_meta`.

### State Lifecycle Risks

This plan does not change persisted trip state. The documentation should still require future UI changes to preserve the product's state model: Trip Inbox is the safe capture layer, Trip Board is organized decision state, and weather/packing/travel tips are supporting tools.

### API Surface Parity

Any documentation update should cover both standalone MCP servers and the unified `/mcp/travel-agent/` endpoint, since the unified endpoint is the preferred ChatGPT Developer Mode path.

### Integration Test Scenarios

- Protocol-only validation: each widget resource is readable and has current MIME/resource metadata.
- Bridge validation: each widget renders real tool output in ChatGPT Developer Mode.
- Narrow iframe validation: widget content at roughly 320px does not overflow or hide primary actions.
- Long-content validation: raw URLs, hotel names, and notes wrap without breaking cards.
- Framework validation: if React/Tailwind is added, the built widget still loads as an MCP Apps resource without external dev-server dependencies.

## Acceptance Criteria

- [ ] A new or updated UI foundation doc exists and clearly names canonical product, design, Apps SDK, and testing references.
- [ ] Product/design docs explicitly align with OpenAI Apps SDK UX principles and the local Travel MCP product direction.
- [ ] Stale Kiro requirements are either updated or labeled as historical where they conflict with current Apps SDK conventions.
- [ ] Tailwind CSS, Apps SDK UI, and shadcn/ui have a documented adoption decision with clear "allowed", "conditional", and "not yet" rules.
- [ ] Future widget work has a documented checklist for UX fit, accessibility, bridge behavior, metadata, CSP, responsive iframe layout, and hosted Developer Mode validation.
- [ ] The plan avoids implementation and does not add frontend tooling.

## Success Metrics

- A future contributor can answer "Should I use shadcn here?" from docs without asking.
- A future contributor can identify the correct source of truth for product direction, visual design, MCP Apps metadata, and widget testing.
- No future widget is started without an explicit validation path for ChatGPT Developer Mode.
- UI proposals are evaluated against ChatGPT-native UX rather than general website/app conventions.

## Dependencies & Risks

- Current OpenAI Apps SDK guidance may continue to evolve; docs should include source URLs and review dates.
- Apps SDK UI may be the best future React/Tailwind path, but adopting it requires adding Node/Vite/React tooling not present in the repo today.
- shadcn/ui can create high-quality React components, but many examples assume standalone web-app layouts that are inappropriate inside ChatGPT widgets.
- The production domain is not yet known, so final `_meta.ui.domain` cannot be set as part of this documentation-only work.

## SpecFlow Analysis

### User Flow Overview

1. Developer wants to improve a widget.
2. Developer reads the UI foundation doc.
3. Developer checks product purpose, visual design constraints, Apps SDK metadata requirements, and testing gates.
4. Developer chooses the lowest-complexity implementation path that satisfies the widget need.
5. Developer validates protocol and ChatGPT bridge behavior before polishing.

### Missing Elements & Gaps

- There is no single source-of-truth UI foundation doc today.
- Existing docs mention Tailwind, vanilla JS, and widget requirements in different places without a current framework decision.
- Some Kiro requirements describe broader app patterns such as maps, tabs, and build tooling that may be too large for the current ChatGPT-native product stage.
- Current design docs do not yet cite the OpenAI Apps SDK UX/UI principles that should govern future work.

### Critical Questions Requiring Clarification

1. Should historical Kiro specs be edited directly, or preserved with a new "superseded by current Apps SDK foundation" note?
   Assumption: preserve history, add explicit supersession notes where needed.

2. Should the project standardize on Apps SDK UI if/when React is introduced?
   Assumption: yes, because it is purpose-built for ChatGPT Apps and already aligns with Tailwind 4 and accessible components.

3. Should shadcn/ui be allowed for any future widget?
   Assumption: allow only selectively after React/Tailwind build tooling exists and after generated components are audited against MCP Apps constraints.

## Documentation Plan

Candidate files for the implementation phase:

- `docs/mcp_apps_ui_foundation.md` - new canonical UI foundation and guardrails.
- `PRODUCT.md` - add cross-links and ChatGPT-native UX constraints.
- `DESIGN.md` - add Apps SDK UI alignment, display-mode guidance, and framework constraints.
- `.kiro/specs/mcp-travel-planner-ui/requirements.md` - label stale historical requirements or update current accepted requirements.
- `.kiro/specs/mcp-travel-planner-ui/design.md` - label stale framework assumptions or update with current widget resource conventions.
- `docs/testing_chatgpt_apps.md` - add future UI/framework validation gates.
- `docs/chatgpt_apps_readiness_review.md` - update readiness review with the framework decision and remaining hosted validation dependency.
- `README.md` - optionally add a short pointer to the UI foundation doc.

## Sources & References

### Internal References

- `PRODUCT.md:7` - target users are ChatGPT users planning mid-conversation.
- `PRODUCT.md:13` - product purpose is persistent travel workspace, not trip generator.
- `PRODUCT.md:35` - design principles: capture over create, quiet competence, conversation-native, progressive structure.
- `PRODUCT.md:43` - accessibility requirements: WCAG 2.1 AA, 320px to 800px iframe widths, 44px touch targets.
- `DESIGN.md:3` - theme: light, warm, trustworthy.
- `DESIGN.md:46` - layout constraints for compact ChatGPT iframes.
- `DESIGN.md:80` - motion and elevation constraints.
- `docs/chatgpt_apps_readiness_review.md:24` - current gaps before end-to-end ChatGPT app validation.
- `docs/chatgpt_apps_readiness_review.md:78` - widget metadata guidance.
- `docs/testing_chatgpt_apps.md:1` - separate MCP protocol testing from ChatGPT Apps bridge testing.
- `docs/testing_chatgpt_apps.md:198` - hosted validation path through `/mcp/travel-agent/`.
- `todos/001-ready-p1-mcp-learning-roadmap.md:270` - avoid build tooling until the HTML contract works.

### External References

- OpenAI Apps SDK UI guidelines: https://developers.openai.com/apps-sdk/concepts/ui-guidelines
- OpenAI Apps SDK UX principles: https://developers.openai.com/apps-sdk/concepts/ux-principles
- OpenAI Apps SDK ChatGPT UI guide: https://developers.openai.com/apps-sdk/build/chatgpt-ui
- OpenAI Apps SDK reference: https://developers.openai.com/apps-sdk/reference
- Apps SDK UI design system: https://openai.github.io/apps-sdk-ui/
- shadcn/ui Vite installation: https://ui.shadcn.com/docs/installation/vite
- shadcn/ui Tailwind v4 guidance: https://ui.shadcn.com/docs/tailwind-v4
- Tailwind CSS installation docs: https://tailwindcss.com/docs/installation

