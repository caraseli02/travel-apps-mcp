---
status: complete
priority: p2
issue_id: "002"
tags: [code-review, testing, mcp, apps-sdk]
dependencies: []
---

# Update E2E Smoke Script For MVP Tools

## Problem Statement

`test_scenario.py` is an end-to-end MCP smoke script for the unified travel-agent endpoint, but it still validates the pre-pruning contract. The current branch intentionally removes weather, forecast, travel tips, activity, and packing tools from `/mcp/travel-agent/` and adds `render_trip_board` for the visual board path. Running this script against the current branch would report false failures and could send developers back toward the old non-MVP app surface.

## Findings

- `test_scenario.py:183` reads `ui://trip/inbox-v1.html` and `ui://trip/board-v1.html`, while the current server exposes `ui://trip/inbox-v2.html` and `ui://trip/board-v2.html`.
- `test_scenario.py:198` labels the tool-list check as "All 11 tools present", but the current MVP unified endpoint exposes 9 trip-workspace tools.
- `test_scenario.py:202-206` still expects `get_current_weather`, `get_forecast`, `get_destination_tips`, `recommend_activities`, and `generate_packing_list` on `/mcp/travel-agent/`.
- The new `render_trip_board` tool is missing from the smoke script's expected tool list and flow.
- The branch's maintained pytest coverage passes, so this is a smoke-script contract drift rather than a production runtime failure.

## Proposed Solutions

### Option 1: Update The Script To The MVP Contract

**Approach:** Change the smoke script to expect only the current unified trip workspace tools, use `render_trip_board` for visual board rendering, and read the current `ui://trip/*-vN.html` resources.

**Pros:**
- Preserves the manual end-to-end test path.
- Aligns local smoke validation with ChatGPT Developer Mode docs.
- Small, low-risk change.

**Cons:**
- Keeps a bespoke script that is not currently part of automated CI.

**Effort:** 30-60 minutes

**Risk:** Low

---

### Option 2: Move The Scenario Into Pytest

**Approach:** Convert the useful parts of `test_scenario.py` into pytest coverage using the existing ASGI/MCP client pattern in `tests/test_api.py`.

**Pros:**
- Prevents future drift by running in normal test validation.
- Reuses maintained test infrastructure.
- Can assert descriptor metadata and resource URIs in one place.

**Cons:**
- More work than updating the standalone script.
- Full E2E over a live server may still be useful for hosted smoke testing.

**Effort:** 1-2 hours

**Risk:** Medium

---

### Option 3: Archive The Script And Rely On Docs Plus Pytest

**Approach:** Remove or archive `test_scenario.py` if it is no longer part of the supported validation workflow, and document the supported Developer Mode script in `docs/testing_chatgpt_apps.md`.

**Pros:**
- Eliminates stale duplicate validation.
- Reduces maintenance surface.

**Cons:**
- Loses a quick manual smoke command unless replaced elsewhere.
- Might surprise anyone using the script locally.

**Effort:** 15-30 minutes

**Risk:** Medium

## Recommended Action

Update `test_scenario.py` in place to preserve the manual smoke workflow while aligning it with the MVP unified endpoint contract.

## Technical Details

**Affected files:**
- `test_scenario.py:183` - stale trip widget resource URIs.
- `test_scenario.py:198` - stale "All 11 tools" expectation.
- `test_scenario.py:202-206` - stale unified endpoint tool list.
- `docs/testing_chatgpt_apps.md` - current source of truth for the MVP Developer Mode script.

**Related components:**
- `mcp_servers/travel_agent_server.py` - current unified endpoint tool/resource contract.
- `tests/test_api.py` - maintained MCP tool-list and descriptor tests.

**Database changes:** No.

## Resources

- `docs/testing_chatgpt_apps.md`
- `docs/2026-05-05-apps-sdk-ux-triage.md`
- `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md`

## Acceptance Criteria

- [x] The smoke path expects the current MVP unified tool list, including `render_trip_board`.
- [x] The smoke path no longer expects weather, forecast, destination, activity, or packing tools on `/mcp/travel-agent/`.
- [x] The smoke path reads current trip resource URIs.
- [x] Validation instructions remain consistent with `docs/testing_chatgpt_apps.md`.
- [x] `python -m pytest` passes.

## Work Log

### 2026-05-05 - Initial Review Finding

**By:** Codex

**Actions:**
- Reviewed current branch diff after Apps SDK MVP pruning.
- Compared `test_scenario.py` against the updated unified endpoint contract.
- Confirmed maintained pytest and widget checks pass.

**Learnings:**
- The supported test suite was updated, but this standalone smoke script still represents the old unified all-travel-tools endpoint.

### 2026-05-05 - Fix Applied

**By:** Codex

**Actions:**
- Updated `test_scenario.py` to capture item IDs from the current `add_trip_item` structured output.
- Removed the stale `trip_id` argument from `update_trip_item_status` calls.
- Added an explicit `render_trip_board` smoke step after `get_trip_board`.
- Added itinerary and budget smoke steps to match the current MVP trip workspace flow.
- Updated widget resource reads to `ui://trip/inbox-v2.html`, `ui://trip/board-v2.html`, `ui://trip/itinerary-v1.html`, and `ui://trip/budget-v1.html`.
- Updated the tool-list assertion to the 9 MVP unified tools.
- Ran `python -m py_compile test_scenario.py`.
- Ran `python -m pytest tests/test_api.py tests/test_travel_agent_server.py`.

**Learnings:**
- The smoke script had two additional stale assumptions beyond the review line range: item IDs now come from `structuredContent.item` / `structuredContent.items`, and `update_trip_item_status` no longer accepts `trip_id`.

## Notes

- This todo intentionally does not recommend deleting `docs/brainstorms/`, `docs/plans/`, or `docs/solutions/` artifacts; those are protected compound-engineering pipeline outputs.
