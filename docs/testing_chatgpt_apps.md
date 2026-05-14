# Testing ChatGPT Apps

The primary local validation path is `mcp-use` Inspector plus the MCP integration tests.

## Local

```bash
npm install
npm run dev
```

Open the Inspector served by `mcp-use` and exercise the MVP flow in both supported widget protocol modes:

- **MCP Apps mode:** widget tools must advertise `_meta.ui.resourceUri`.
- **ChatGPT mode:** the same widget tools must advertise `_meta["openai/outputTemplate"]`.

For each mode, run this flow:

1. `create_trip`
2. `add_trip_item`
3. `list_trip_inbox`
4. `update_trip_item_status`
5. `get_trip_board`
6. `render_trip_board`
7. `get_trip_itinerary`
8. `get_trip_budget`
9. `get_trip_summary`

The MVP widget tools are `list_trip_inbox`, `render_trip_board`, `get_trip_itinerary`, `get_trip_budget`, `ask_trip_clarification`, and `render_trip_clarification`. Data and mutation tools such as `add_trip_item`, `get_trip_board`, and `prepare_trip_clarification` should not advertise widget templates.

For file-backed smoke testing:

```bash
TRIP_STORE_BACKEND=file TRIP_STORE_FILE_PATH=/tmp/travel-mcp-trips.json npm run dev
```

For database-backed testing:

```bash
DATABASE_URL="postgresql://..." TRIP_STORE_BACKEND=postgres npm run dev
```

## Automated Checks

```bash
npm run check
```

This runs TypeScript typecheck, Vitest parity tests, MCP descriptor assertions, and the `mcp-use` build for server plus widgets.

The MCP integration test should prove:

- public tool schemas stay ChatGPT-compatible
- widget tools expose both MCP Apps and ChatGPT metadata
- data-only tools do not advertise widgets
- widget tool calls return `structuredContent` plus model-visible text
- transient clarification submit keeps its close metadata

## Widget Scope

The main tool surface is the persisted trip workspace. Trip inbox, board, itinerary, budget, and clarification widgets are in the MVP validation path.

Other built resources, such as destination guide, activity cards, packing checklist, and explore places, are non-MVP/experimental unless redesigned around saved trip state. They should not be treated as submission-ready surfaces just because `mcp-use build` packages them.

## Hosted Developer Mode

Hosted validation is required before submission-ready claims:

- Deploy the Node app to an HTTPS endpoint.
- Set `DATABASE_URL`.
- Confirm ChatGPT Developer Mode can connect to the MCP URL.
- Run the full MVP trip flow.
- Confirm trip state persists across app restart or redeploy.
- Confirm widgets render for inbox, board, itinerary, budget, and clarification.
- Confirm production widget metadata, CSP, and domain settings match the hosted origin.
