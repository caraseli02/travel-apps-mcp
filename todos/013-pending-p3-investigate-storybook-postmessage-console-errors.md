---
status: pending
priority: p3
issue_id: "013"
tags: [code-review, browser-test, storybook, developer-experience]
dependencies: []
---

# Investigate Storybook postMessage console errors

During headless Storybook browser testing, the Storybook dev server repeatedly logged `TypeError: Cannot destructure property 'key' ... as it is null` from Storybook's internal preview runtime. The affected widget stories still rendered and `agent-browser errors --clear` did not report page-level errors, but the repeated console noise can hide real widget regressions during QA.

## Findings

- Storybook was started on `http://127.0.0.1:6007`.
- Browser tests navigated directly to `iframe.html?id=...&viewMode=story` URLs.
- On shutdown, the Storybook server output contained repeated `Vite [console.error] TypeError: Cannot destructure property 'key' ... as it is null` entries from `storybook_internal_preview_runtime.js`.
- The issue may be Storybook/agent-browser postMessage interaction rather than application code, but it reduces confidence in console-error based QA.

## Proposed Solutions

### Option 1: Reproduce with a clean Storybook session

**Approach:** Start Storybook, open the same iframe routes manually and with `agent-browser`, and compare browser console output.

**Pros:**
- Separates app story errors from automation/tooling noise.
- Low implementation cost.

**Cons:**
- May not produce a code change if the cause is upstream Storybook behavior.

**Effort:** Small

**Risk:** Low

---

### Option 2: Test through full Storybook story URLs

**Approach:** Use `/?path=/story/...` routes instead of direct iframe routes and see whether manager/preview postMessage state remains valid.

**Pros:**
- May eliminate the internal preview runtime error.
- More closely resembles human Storybook use.

**Cons:**
- Adds iframe traversal complexity to automated checks.

**Effort:** Small

**Risk:** Low

---

### Option 3: Add a documented ignore for known Storybook runtime noise

**Approach:** If confirmed as an upstream/tooling artifact, document it in the browser QA workflow and filter it from failure criteria.

**Pros:**
- Keeps QA focused on actionable widget errors.

**Cons:**
- Filtering console errors can hide real regressions if too broad.

**Effort:** Small

**Risk:** Medium

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:**
- `.storybook/main.ts`
- `.storybook/preview.ts`
- `resources/**/*.stories.tsx`

**Related components:**
- Storybook 10 preview runtime
- `agent-browser`
- Widget browser QA workflow

**Database changes:** No

## Resources

- Browser test target: `http://127.0.0.1:6007/iframe.html?id=widgets-tripitinerary--default&viewMode=story`

## Acceptance Criteria

- [ ] Determine whether the error reproduces outside `agent-browser`.
- [ ] Determine whether direct iframe URLs or full Storybook story URLs avoid the error.
- [ ] Browser QA instructions document the chosen route and console-error expectations.
- [ ] Real widget console errors remain visible to reviewers.

## Work Log

### 2026-05-13 - Browser Verification Discovery

**By:** Codex

**Actions:**
- Ran affected widget stories through `agent-browser`.
- Observed repeated Storybook internal `postMessage`/preview runtime console errors in the dev server output.
- Confirmed checked widget pages still rendered.

**Learnings:**
- Current Storybook browser QA has tooling-level console noise that should be understood before treating console output as a strict failure signal.
