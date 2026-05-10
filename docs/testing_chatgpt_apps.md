# Testing ChatGPT Apps

The primary local validation path is now `mcp-use` Inspector.

## Local

```bash
npm install
npm run dev
```

Open the Inspector served by `mcp-use` and exercise the MVP flow:

1. `create_trip`
2. `add_trip_item`
3. `list_trip_inbox`
4. `update_trip_item_status`
5. `get_trip_board`
6. `render_trip_board`
7. `get_trip_itinerary`
8. `get_trip_budget`
9. `get_trip_summary`

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

This runs TypeScript typecheck, Vitest parity tests, and the `mcp-use` build for server plus widgets.

## Hosted Developer Mode

Hosted validation is required before submission-ready claims:

- Deploy the Node app to an HTTPS endpoint.
- Set `DATABASE_URL`.
- Confirm ChatGPT Developer Mode can connect to the MCP URL.
- Run the full MVP trip flow.
- Confirm trip state persists across app restart or redeploy.
- Confirm widgets render for inbox, board, itinerary, and budget.
