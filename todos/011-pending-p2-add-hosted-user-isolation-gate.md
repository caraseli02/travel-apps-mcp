---
status: pending
priority: p2
issue_id: "011"
tags: [code-review, security, mcp, hosted-readiness]
dependencies: []
---

# Add hosted user isolation gate

Hosted readiness docs require HTTPS, database configuration, metadata, and Developer Mode validation, but they do not require an auth or user-isolation plan for persisted trip data. In a shared Postgres deployment, trip read and mutation tools are scoped by trip IDs only.

## Findings

- `docs/chatgpt_apps_readiness_review.md:18` lists hosted blockers without auth or user/session isolation.
- `docs/testing_chatgpt_apps.md:69` lists hosted validation steps without cross-user access checks.
- `src/server.ts:5` creates a public MCP server without an auth/security scheme.
- `src/tools/travelAgent.ts:163` and `src/tools/travelAgent.ts:175` expose read and mutation tools by IDs.
- If a trip ID leaks or is guessed, persisted trip data could be read or modified across users in a hosted shared database.

## Proposed Solutions

### Option 1: Document auth/user isolation as a hard hosted blocker

**Approach:** Update readiness and testing docs to require a user/session isolation strategy before hosted submission claims.

**Pros:**
- Fast and accurate.
- Prevents premature submission-ready claims.

**Cons:**
- Does not implement isolation.

**Effort:** Small

**Risk:** Low

---

### Option 2: Add explicit owner/session fields to trips

**Approach:** Store a ChatGPT subject/session/user key with each trip and require it on every read/mutation path.

**Pros:**
- Directly addresses cross-user access.
- Makes hosted persistence safer.

**Cons:**
- Requires schema/store changes and host identity design.
- Needs migration and compatibility decisions.

**Effort:** Large

**Risk:** Medium

---

### Option 3: Use unguessable capability tokens per trip

**Approach:** Treat trip IDs as internal and expose separate capability tokens for user-facing access.

**Pros:**
- Can work without a full account system.
- Limits impact of sequential or predictable IDs if those exist.

**Cons:**
- Still needs careful storage and rotation rules.
- Less strong than real user/session binding.

**Effort:** Medium

**Risk:** Medium

## Recommended Action

To be filled during triage.

## Technical Details

**Affected files:**
- `docs/chatgpt_apps_readiness_review.md`
- `docs/testing_chatgpt_apps.md`
- `src/server.ts`
- `src/tools/travelAgent.ts`
- `src/stores/*`

**Related components:**
- Hosted MCP transport
- Postgres trip store
- ChatGPT Developer Mode validation

**Database changes:** Possible if implementing owner/session fields.

## Resources

- Current readiness doc: `docs/chatgpt_apps_readiness_review.md`
- Current testing doc: `docs/testing_chatgpt_apps.md`

## Acceptance Criteria

- [ ] Hosted readiness docs list auth/user isolation as required before submission-ready claims.
- [ ] Hosted smoke checklist includes cross-user read/write isolation validation.
- [ ] If implementation proceeds, every trip read/mutation path enforces the chosen isolation mechanism.
- [ ] Tests cover unauthorized or cross-user trip access.
- [ ] `npm run check` passes.

## Work Log

### 2026-05-13 - Code Review Discovery

**By:** Codex

**Actions:**
- Reviewed hosted readiness docs and server/tool registration.
- Identified that persisted trip data is currently protected only by IDs in a hosted scenario.

**Learnings:**
- Metadata readiness and database readiness are not enough for a persisted multi-user MCP app.
