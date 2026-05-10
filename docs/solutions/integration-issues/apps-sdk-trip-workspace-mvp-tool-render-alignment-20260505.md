---
module: Travel MCP ChatGPT Apps
date: 2026-05-05
problem_type: integration_issue
component: apps_sdk_tool_descriptors
symptoms:
  - "The unified travel-agent endpoint exposed weather, forecast, destination, activity, packing, and trip workspace tools through one ChatGPT app surface"
  - "Several data and mutation tools advertised widget templates, causing every save or read to look like a render operation"
  - "Static destination and support widgets risked failing Apps SDK UX principles because ChatGPT could already answer them without app-specific state"
  - "The manual MCP smoke script still expected the old 11-tool unified endpoint after the MVP pruning"
  - "Initial Storybook QA looked blank until nested widget iframes were inspected"
root_cause: apps_sdk_contract_drift
resolution_type: architecture_alignment
severity: medium
tags: [apps-sdk, chatgpt-apps, mcp, tool-descriptors, storybook, qa, travel-agent]
---

# Troubleshooting: Apps SDK Trip Workspace MVP Tool/Render Alignment

## Problem

The travel-agent ChatGPT app surface had grown into a bundle of travel utilities instead of a focused trip workspace. The unified `/mcp/travel-agent/` endpoint exposed weather, destination tips, activity cards, packing, and trip planning tools together, while data and mutation tools such as `add_trip_item` and `get_trip_board` advertised widget templates directly.

That made the app weaker on Apps SDK fit. ChatGPT already handles generic weather, destination summaries, and packing reasoning well enough for the MVP. The app's real advantage is persisted trip state: save this option, move it to shortlisted, show what is missing, render the board when visual scanning helps.

## Environment

- Module: Travel MCP ChatGPT Apps
- Primary endpoint: `/mcp/travel-agent/`
- Server file: `mcp_servers/travel_agent_server.py`
- Widget project: `mcp_servers/widgets`
- Test files: `tests/test_api.py`, `tests/test_travel_agent_server.py`, `tests/test_apps_ui_resources.py`
- Manual smoke script: `test_scenario.py`
- Runtime: Python FastMCP plus self-contained HTML widgets in Storybook

## Symptoms

- The unified endpoint mixed MVP trip workspace actions with generic support tools:
  - `get_current_weather`
  - `get_forecast`
  - `get_destination_tips`
  - `recommend_activities`
  - `generate_packing_list`
- `add_trip_item` saved a fragment but also advertised the inbox widget, so a capture action could force a render.
- `get_trip_board` fetched data but also owned `ui://trip/board-v2.html`, so ChatGPT had less room to inspect board data before deciding whether the visual board was useful.
- Storybook's chat preview still centered the old weather/activity/packing scenario.
- `test_scenario.py` still checked for the old 11-tool endpoint and stale `ui://trip/inbox-v1.html` / `ui://trip/board-v1.html` resources.
- A naive Storybook QA pass treated widget stories as blank because the actual widget content rendered inside nested iframes.

## Root Cause

The implementation drifted from a model-friendly Apps SDK contract. The app had working MCP tools and widgets, but the unified ChatGPT app surface lacked a product gate: every existing widget stayed because it existed, not because it passed the current UX principles.

There were two contract problems:

1. **Product contract drift:** Generic weather, forecast, destination, activity, and packing widgets did not add enough MVP value beyond base ChatGPT unless redesigned around saved trip state.
2. **Tool/render coupling:** Data and mutation tools advertised widget resources directly. That is fine for simple one-shot widgets, but richer trip workspace flows need chainable `structuredContent` first and render tools only when UI helps.

The manual smoke script added a third drift point: it encoded the old unified endpoint as a contract, so a successful MVP pruning looked like a test failure.

## What Didn't Work

**Keeping all existing tools in the unified app:** This made ChatGPT app discovery broader but less confident. The endpoint became a travel grab bag, not a clear saved trip workspace.

**Treating widgets as inherently valuable:** A widget is only worth keeping if replacing it with text would materially hurt the user. Generic destination guides and weather displays did not pass that MVP bar.

**Attaching output templates to every useful tool:** This blurred the difference between "fetch or mutate state" and "show a visual state." It also made remounts more likely after intermediate tool calls.

**Testing Storybook only through the parent canvas text:** The parent Storybook iframe may contain little or no text while the actual widget iframe renders correctly. QA has to inspect child frames.

## Solution

### 1. Prune The Unified MVP Endpoint

Remove generic support tools and resources from `mcp_servers/travel_agent_server.py`. Keep the standalone weather, travel tips, and packing servers available for legacy or experimental surfaces, but remove them from the unified ChatGPT Developer Mode MVP path.

The unified endpoint now exposes only trip workspace tools:

```python
{
    "create_trip",
    "add_trip_item",
    "list_trip_inbox",
    "update_trip_item_status",
    "get_trip_board",
    "render_trip_board",
    "get_trip_itinerary",
    "get_trip_budget",
    "get_trip_summary",
}
```

This keeps `/mcp/travel-agent/` focused on app-specific state and actions.

### 2. Add Descriptor Metadata For Model-Friendly Tool Choice

FastMCP supports `title`, `annotations`, and `meta` on `@server.tool`, so descriptor quality can be added without lower-level registration code.

```python
READ_ONLY = ToolAnnotations(
    readOnlyHint=True,
    destructiveHint=False,
    idempotentHint=True,
    openWorldHint=False,
)

def _status_meta(invoking: str, invoked: str) -> dict[str, str]:
    return {
        "openai/toolInvocation/invoking": invoking,
        "openai/toolInvocation/invoked": invoked,
    }
```

Use annotations to separate read tools from mutation tools, and status strings to improve ChatGPT's in-chat tool invocation UX.

### 3. Split Trip Board Data From Trip Board Rendering

Keep `get_trip_board` as a data-only read tool:

```python
@server.tool(
    name="get_trip_board",
    title="Get trip board data",
    description=(
        "Use this to fetch the current trip decision state grouped into inbox, "
        "shortlist, booked items, itinerary draft, and missing planning pieces."
    ),
    annotations=READ_ONLY,
    meta=_status_meta("Fetching trip board", "Fetched trip board"),
)
def get_trip_board(trip_id: str) -> CallToolResult:
    ...
```

Add `render_trip_board` as the render tool that owns the widget template:

```python
@server.tool(
    name="render_trip_board",
    title="Render trip board",
    description=(
        "Use this after fetching or changing trip state when the user asks to see a "
        "visual trip board of decisions, shortlist, booked items, itinerary draft, "
        "and missing pieces."
    ),
    annotations=READ_ONLY,
    meta=_render_meta(
        "ui://trip/board-v2.html",
        "Rendering trip board",
        "Rendered trip board",
    ),
)
def render_trip_board(trip_id: str) -> CallToolResult:
    ...
```

This lets ChatGPT fetch state, reason conversationally, and only render the board when the UI is useful.

### 4. Keep Simple Renderable Tools Where They Still Fit

`list_trip_inbox`, `get_trip_itinerary`, and `get_trip_budget` can remain simple data-plus-render tools for now because their UI is compact and directly answers a user request. `add_trip_item` became data/mutation-first so saving a fragment does not automatically mount a widget.

### 5. Update Tests And Manual Smoke Paths

Update protocol tests to assert:

- the unified endpoint exposes the 9 MVP tools
- `get_trip_board` has no `openai/outputTemplate`
- `render_trip_board` advertises both `_meta.ui.resourceUri` and `_meta["openai/outputTemplate"]`
- `add_trip_item` is idempotent and does not advertise a widget template

Update `test_scenario.py` to:

- expect the 9-tool MVP contract
- call `render_trip_board`
- read current trip widget resource URIs
- remove weather, destination, activity, and packing expectations from `/mcp/travel-agent/`

### 6. Verify Storybook Through Nested Iframes

Use Storybook's `index.json` to enumerate every story, then load each `iframe.html?id=...` story. For widget stories, inspect every frame on the page, not just the parent `body`.

```js
for (const frame of page.frames()) {
  const text = await frame.locator("body").innerText({ timeout: 2000 });
  frameTexts.push({ url: frame.url(), text: text.trim() });
}
```

This avoids false "blank story" reports when the visible widget is inside a child iframe.

## Verification

Run Python tests:

```bash
python -m pytest
```

Verified result:

```text
52 passed, 1 skipped
```

Run widget checks:

```bash
cd mcp_servers/widgets
npm run check
```

Verified result:

```text
tsc --noEmit passed
storybook build completed successfully
```

Run Storybook QA:

```bash
cd mcp_servers/widgets
npm run storybook -- --host 127.0.0.1
```

Then use browser automation to load all Storybook stories and inspect nested frames. Verified results:

- 28 stories checked
- 0 console errors
- 0 page errors
- 0 failed requests
- 0 blank or No Preview stories
- 0 responsive overflow failures at 320px and 800px

Evidence files:

- `.gstack/qa-reports/storybook-qa.json`
- `.gstack/qa-reports/storybook-responsive-qa.json`
- `.gstack/qa-reports/qa-report-storybook-2026-05-05.md`

## Prevention

- Gate every ChatGPT app widget through the Apps SDK UX questions before keeping it in the MVP:
  - Does it rely on conversation or saved context?
  - Does it provide something beyond base ChatGPT?
  - Would plain text materially degrade the experience?
  - Can the user complete a meaningful task in chat?
- Keep generic support tools out of the unified app surface unless they use saved app state or unlock a specific in-chat action.
- Treat data tools, mutation tools, and render tools as separate roles. Only render tools should own widget templates for richer flows.
- Add descriptor tests whenever tool metadata changes. Tool names alone are not enough.
- Keep manual smoke scripts in sync with the same contract as `tests/test_api.py`.
- QA Storybook widgets by inspecting nested frames. Parent-frame text is not reliable evidence.
- Store the MVP Developer Mode prompt in `docs/testing_chatgpt_apps.md` and update it whenever tool names or render flow changes.

## Related Documentation

- `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md` documents Storybook iframe and widget resource drift issues.
- `docs/solutions/test-failures/storybook-widget-typescript-pr-checks.md` documents the TypeScript and static Storybook validation surface.
- `docs/solutions/ui-bugs/chatgpt-native-widget-overflow-travel-mcp-widgets-20260504.md` documents ChatGPT-native widget visual guidance and responsive polish.
- `docs/testing_chatgpt_apps.md` is the current Developer Mode validation guide.
- `docs/2026-05-05-apps-sdk-ux-triage.md` records the MVP keep/defer/remove decisions.
- `docs/plans/2026-05-05-001-refactor-apps-sdk-trip-workspace-alignment-plan.md` tracks the implementation checklist.

## Refresh Candidate

`docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md` is still relevant, but it now describes a broader widget set than the current unified MVP validation path. If this area changes again, refresh that file with a narrow scope around "Storybook widget QA and resource versioning" rather than doing a broad historical sweep.
