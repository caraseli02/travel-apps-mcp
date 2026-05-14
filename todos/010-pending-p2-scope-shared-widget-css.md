---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, performance, widgets, frontend]
dependencies: []
---

# Scope shared widget CSS

The shared widget stylesheet grew substantially and is imported by every widget resource. New clarification, itinerary, inbox, and Storybook/demo styles now increase the CSS payload for unrelated widgets, including non-MVP resources.

## Findings

- `resources/styles.css` grew by more than one thousand lines in the current branch.
- `resources/styles.css:872` starts new agentic UI styles, `resources/styles.css:1026` starts intent picker styles, and `resources/styles.css:1504` starts first-five-workspace story/demo styles.
- Every widget entry imports `../styles.css`, including `resources/trip-board/widget.tsx:4`, `resources/trip-budget/widget.tsx:4`, `resources/trip-inbox/widget.tsx:4`, and non-MVP widgets.
- Known Pattern: `docs/solutions/ui-bugs/chatgpt-native-widget-overflow-travel-mcp-widgets-20260504.md` recommends focused ChatGPT-native widget styles and mobile-safe layout constraints.

## Proposed Solutions

### Option 1: Split per-widget CSS files

**Approach:** Move widget-specific styles into files imported only by the widgets that use them.

**Pros:**
- Reduces unrelated widget payload.
- Makes ownership clearer.
- Prevents demo styles from leaking into production resources.

**Cons:**
- Requires careful import updates across resources and stories.

**Effort:** Medium

**Risk:** Low

---

### Option 2: Keep shared base plus scoped feature files

**Approach:** Keep base tokens/layout primitives in `styles.css`, and move itinerary, clarification, inbox, and story-only styles into scoped files.

**Pros:**
- Preserves common design primitives.
- Smaller change than fully splitting every widget.

**Cons:**
- Requires discipline to keep future additions scoped.

**Effort:** Medium

**Risk:** Low

---

### Option 3: Accept larger shared CSS for now and add a bundle budget

**Approach:** Keep current structure but add a build/report check that warns when widget CSS grows past a threshold.

**Pros:**
- Fastest to implement.
- Provides future visibility.

**Cons:**
- Does not reduce current payload.
- Leaves non-MVP widgets paying for unrelated styles.

**Effort:** Small

**Risk:** Medium

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:**
- `resources/styles.css`
- `resources/*/widget.tsx`
- `resources/**/*.stories.tsx`

**Related components:**
- `mcp-use build`
- Widget resource bundles
- Storybook previews

**Database changes:** No

## Resources

- Known Pattern: `docs/solutions/ui-bugs/chatgpt-native-widget-overflow-travel-mcp-widgets-20260504.md`

## Acceptance Criteria

- [ ] Story/demo-only styles are not imported by production widget entries.
- [ ] Widget-specific styles are scoped to the widgets that use them.
- [ ] Existing widget visual behavior is preserved.
- [ ] `npm run check` passes.
- [ ] `mcp-use build` output remains successful for all retained widgets.

## Work Log

### 2026-05-13 - Code Review Discovery

**By:** Codex

**Actions:**
- Reviewed performance-oracle report and build output.
- Confirmed shared stylesheet is imported by all widget entries.

**Learnings:**
- Shared CSS is convenient but quickly turns every production widget into the cost center for unrelated experiments.

### 2026-05-13 - Browser Verification

**By:** Codex

**Actions:**
- Ran Storybook widget smoke checks through `agent-browser` at a 390px viewport.
- Verified `widgets-tripboard--default`, `widgets-tripbudget--default`, `widgets-tripinbox--default`, and `workflows-trip-planning-scenarios--case-1-b-first-five-minutes-workspace` had no horizontal overflow by comparing `scrollWidth` and `clientWidth`.
- Checked `agent-browser errors --clear` for those pages; no page errors were reported.

**Learnings:**
- The current shared CSS concern is payload/scope rather than an observed mobile overflow regression in the checked stories.
