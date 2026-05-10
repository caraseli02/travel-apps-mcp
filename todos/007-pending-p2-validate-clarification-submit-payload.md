---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, quality, apps-sdk, validation]
dependencies: []
---

# Validate Clarification Submit Payload

## Problem Statement

`submit_trip_clarification` accepts `session_json` and `answers_json` as strings, parses them as generic objects, and passes the result into `summarizeClarification` without validating the session shape, question ids, answer types, or answer membership.

This creates a weak tool contract. Malformed or stale widget payloads can produce generic errors, impossible summaries, or recommendations based on answers that were never valid options. Because the tool is callable from both the model and the widget bridge, it should reject invalid payloads with specific, model-readable validation errors.

## Findings

- `src/tools/travelAgent.ts:431` parses `session_json` into `ClarificationSession` using a type assertion only.
- `src/tools/travelAgent.ts:434` parses `answers_json` into a generic record.
- `src/domain/clarification.ts:78` iterates `session.questions` assuming the parsed session is structurally valid.
- `src/domain/clarification.ts:88` accepts any answer value for a question, including values not present in that question's options.
- Existing tests cover valid submissions but do not cover malformed session payloads, unknown question ids, invalid option values, or multi-choice answer type mismatches.

## Proposed Solutions

### Option 1: Reuse Zod Schemas For Submit Validation

**Approach:** Export or share the `tripClarificationPropsSchema` from `src/domain/widgetTypes.ts` and use it to validate `session_json`. Add an answer validation function that checks question ids, answer type, skipped values, and option membership.

**Pros:**
- Keeps widget props and tool submit contract aligned.
- Produces precise errors.
- Extends the existing schema pattern.

**Cons:**
- Introduces a dependency from tool/domain validation to widget prop schema unless factored carefully.

**Effort:** Medium

**Risk:** Low

---

### Option 2: Add Domain-Level Session And Answer Schemas

**Approach:** Move clarification session schemas into `src/domain/clarification.ts`, export inferred types from those schemas, and import them in `widgetTypes.ts`.

**Pros:**
- Domain owns the canonical contract.
- Avoids widget schema becoming the source of business validation.

**Cons:**
- Slight refactor of current type/schema ownership.

**Effort:** Medium

**Risk:** Low

---

### Option 3: Keep Generic JSON But Add Defensive Guards

**Approach:** Before summarizing, check `Array.isArray(session.questions)`, required string fields, and basic answer shape.

**Pros:**
- Minimal patch.

**Cons:**
- Easy to miss cases.
- Duplicates schema logic and leaves option membership under-specified.

**Effort:** Small

**Risk:** Medium

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:**
- `src/tools/travelAgent.ts:431` - submit parsing and type assertion
- `src/domain/clarification.ts:78` - answer summarization assumes valid session shape
- `src/domain/widgetTypes.ts` - existing Zod props schema can be reused or refactored
- `tests/travelAgentTools.test.ts` - add invalid submit cases

**Related components:**
- `resources/trip-clarification/widget.tsx`
- ChatGPT Apps widget bridge tool calls

**Database changes:** No.

## Resources

- **Review target:** current branch `codex/evaluate-mcp-use-migration`
- **Known pattern:** `docs/solutions/integration-issues/schema-compatible-mcp-chatgpt-apps-inspector-20260506.md`
- **Plan:** `docs/plans/2026-05-08-001-feat-trip-clarification-widget-plan.md`

## Acceptance Criteria

- [ ] `submit_trip_clarification` validates `session_json` against the canonical clarification session schema.
- [ ] Unknown question ids in answers are ignored or rejected deliberately.
- [ ] Single-choice answers must be strings and, unless free text is allowed, valid option values.
- [ ] Multi-choice answers must be string arrays and, unless free text is allowed, valid option values.
- [ ] Invalid payload tests return clear `isError` tool results.
- [ ] `npm run check` passes.

## Work Log

### 2026-05-08 - Initial Code Review

**By:** Codex

**Actions:**
- Reviewed submit tool parsing and domain summarization path.
- Identified type assertions over untrusted JSON and missing answer membership validation.
- Created this todo as a P2 contract-quality finding.

**Learnings:**
- The current valid-path tests pass, but malformed widget/model payloads are not covered.

## Notes

- This is especially relevant because the widget uses `JSON.stringify(props)` and `JSON.stringify(answers)` across the host bridge; stale or malformed payloads should fail predictably.
