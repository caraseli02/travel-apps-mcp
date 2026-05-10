---
module: Travel MCP ChatGPT Apps
date: 2026-05-06
problem_type: integration_issue
component: mcp_tool_schemas
symptoms:
  - "Inspector chat returned OpenAI 400: Invalid schema for function 'create_trip': True is not of type 'array'."
  - "A temporary minimal schema workaround avoided the OpenAI error but hid trip and item metadata from real MCP clients."
  - "Direct handler tests passed while the Inspector/ChatGPT path could not persist destination, dates, titles, item types, day labels, price notes, or notes."
root_cause: openai_schema_contract_drift
resolution_type: schema_compatibility_fix
severity: high
tags: [apps-sdk, chatgpt-apps, mcp, openai-schema, zod, inspector, typescript, testing]
related:
  - docs/solutions/integration-issues/apps-sdk-trip-workspace-mvp-tool-render-alignment-20260505.md
  - docs/testing_chatgpt_apps.md
  - docs/migration/python-to-typescript.md
---

# Troubleshooting: Schema-Compatible MCP Tools For ChatGPT Apps Inspector

## Problem

Inspector chat rejected the travel MCP app with an OpenAI schema error:

```text
Invalid schema for function 'create_trip': True is not of type 'array'.
```

The first workaround narrowed `create_trip`, `add_trip_item`, and `update_trip_item_status` to only the smallest required fields. That avoided the immediate schema failure, but it created a product regression: real MCP clients only see and send fields advertised by `tools/list`, while the handlers still expected richer trip and item metadata.

## Root Cause

There were two contract failures in sequence.

First, the OpenAI function schema generated for `create_trip` was not valid for ChatGPT's tool schema validator. The reported failure showed a `required` value shaped like a boolean instead of the JSON Schema array OpenAI expects.

Second, the emergency fix treated the symptom by hiding fields. Zod/MCP parsing strips or ignores fields outside the advertised schema, so destination, dates, item titles, item types, day labels, prices, locations, and notes became unreachable through Inspector/ChatGPT even though direct TypeScript tests still passed.

The key lesson: an MCP tool schema is the product contract. Handler-only tests do not prove the ChatGPT path works.

## What Didn't Work

**Minimal schemas as a compatibility fix:** They were easier for OpenAI to accept, but they removed model-accessible metadata required by the MVP trip workspace.

**Direct exported function tests:** They bypassed `server.tool` registration, Zod parsing, generated JSON Schema, `tools/list`, widget metadata, and MCP transport behavior.

**Compile-only widget checks:** `mcp-use build` proves widgets package, but it does not prove tool descriptors expose the right widget templates or that widget-producing tools return the expected `structuredContent`.

## Solution

### 1. Restore Rich Schemas With OpenAI-Compatible Shapes

Expose the full input surface, but avoid optional or nullable schema forms that may convert poorly for OpenAI. The app uses required string fields for business-optional metadata, with descriptions telling the model to send an empty string when unknown.

```ts
const createTripSchema = z.object({
  title: z.string().describe("Short name for the saved trip workspace"),
  destination: z.string().describe("Primary destination for the trip. Use an empty string if unknown."),
  start_date: z.string().describe("Trip start date or date note. Use an empty string if unknown."),
  end_date: z.string().describe("Trip end date or date note. Use an empty string if unknown."),
});
```

Apply the same pattern to item metadata:

```ts
const addTripItemSchema = z.object({
  trip_id: z.string().describe("Saved trip workspace id"),
  raw_content: z.string().describe("Raw travel fragment, link text, decision note, or booking detail to save"),
  item_type: z.string().describe("One of flight, transport, hotel, restaurant, activity, document, note, question, or constraint. Use an empty string to infer it."),
  source_label: z.string().describe("Human-readable source name for the fragment. Use an empty string if unknown."),
  title: z.string().describe("Short display title for the item. Use an empty string if unknown."),
  day_label: z.string().describe("Itinerary day or timing label. Use an empty string if unscheduled."),
  date_note: z.string().describe("Date or time note for the item. Use an empty string if unknown."),
  price_note: z.string().describe("Price, fare, or cost note for the item. Use an empty string if unknown."),
  location_note: z.string().describe("Neighborhood, address, airport, or location note. Use an empty string if unknown."),
  notes: z.string().describe("Additional user notes or decision context. Use an empty string if none."),
});
```

This keeps `tools/list` complete and produces a simple JSON Schema shape for OpenAI.

### 2. Normalize At The Tool Boundary

The store still wants nullable optional metadata, so handlers normalize empty strings before persistence:

```ts
function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
```

`addTripItem` maps every advertised optional metadata field through that boundary:

```ts
const [item, deduped] = await tripStore.addItem({
  trip_id: input.trip_id,
  raw_content: input.raw_content,
  item_type: emptyToNull(input.item_type),
  source_label: emptyToNull(input.source_label),
  title: emptyToNull(input.title),
  day_label: emptyToNull(input.day_label),
  date_note: emptyToNull(input.date_note),
  price_note: emptyToNull(input.price_note),
  location_note: emptyToNull(input.location_note),
  notes: emptyToNull(input.notes),
});
```

`update_trip_item_status` uses the same convention: empty `day_label` and `notes` mean keep the existing values.

### 3. Make The MCP Server Testable

Extract server creation from process startup so tests can start an isolated real MCP server:

```ts
export function createTravelServer(settings: Settings = getSettings()): MCPServer {
  const server = new MCPServer({
    name: "travel-agent-server",
    title: "Travel MCP App",
    version: "0.1.0",
    description: "Persisted trip workspace tools and widgets for ChatGPT Apps.",
    baseUrl: settings.mcpUrl,
    websiteUrl: "https://github.com/EveryInc/travel-mcp-app",
  });

  registerTravelAgentTools(server);
  return server;
}
```

`index.ts` should only construct and listen:

```ts
export const server = createTravelServer();

server.listen().then(() => {
  console.log("Travel MCP app running");
});
```

### 4. Test Through MCP, Not Only Through Handlers

Add an MCP integration test that starts the server on a free port, connects with `MCPClient`, and inspects the same contract Inspector sees.

The regression guard should assert:

- `tools/list` exposes all intended rich fields.
- Every `required` value is an array, never a boolean.
- Widget-producing tools advertise `openai/outputTemplate`.
- `create_trip`, `add_trip_item`, `update_trip_item_status`, `render_trip_board`, `get_trip_itinerary`, and `get_trip_budget` work over MCP.
- Rich metadata persists through the protocol path.

Representative schema guard:

```ts
function expectNoBooleanRequired(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if ("required" in value) {
    expect(Array.isArray((value as { required?: unknown }).required)).toBe(true);
  }
  for (const child of Object.values(value)) {
    expectNoBooleanRequired(child);
  }
}
```

### 5. Keep Persistence Parity Visible

The TypeScript Postgres store owns schema creation, duplicate handling, reload behavior, and status updates. Add a `DATABASE_URL`-gated test so local runs stay lightweight while configured environments can exercise the real database path:

```ts
const postgresIt = process.env.DATABASE_URL?.trim() ? it : it.skip;
```

The test should create a trip, add an item, update status and metadata, reload through a second store instance, verify duplicate detection, and clean up the created row.

## Verification

Run the complete local check:

```bash
npm run check
```

Verified result:

```text
typecheck passed
Vitest: 25 passed, 1 skipped
mcp-use build passed
4 widgets built
```

The skipped test is expected when `DATABASE_URL` is absent.

Manual Inspector validation should use:

```text
http://localhost:3000/inspector?autoConnect=http%3A%2F%2Flocalhost%3A3000%2Fmcp
```

Exercise this flow:

1. Create a trip with destination and dates.
2. Save a titled item with type, day label, price note, location note, and notes.
3. Move it to shortlisted or booked.
4. Render board, itinerary, and budget.
5. Confirm no OpenAI schema error appears and metadata survives.

## Prevention

- Treat `tools/list` as the source of truth for ChatGPT behavior.
- Prefer simple OpenAI-compatible JSON Schema primitives for public tool inputs.
- Normalize compatibility sentinels, such as empty strings, at the tool boundary.
- Add MCP-client-path tests for every public tool that matters to the app workflow.
- Keep direct handler tests for business logic, but do not use them as protocol confidence.
- Assert widget templates and `structuredContent` payloads together.
- Add a regression test for every Inspector/OpenAI schema error before considering it fixed.
- Keep database parity tests gated but visible when persistence behavior changes.

## Related Documentation

- `docs/solutions/integration-issues/apps-sdk-trip-workspace-mvp-tool-render-alignment-20260505.md` documents the earlier tool/render contract alignment. This solution is the lower-level schema and MCP protocol continuation of that work.
- `docs/testing_chatgpt_apps.md` is the operational validation guide and should include schema/Inspector chat checks.
- `docs/migration/python-to-typescript.md` explains why validation moved from Python and Storybook toward TypeScript MCP protocol coverage.

## Refresh Candidates

This fix suggests a narrow refresh for:

```text
ce:compound-refresh docs/testing_chatgpt_apps.md
```

That guide should make the new local validation contract explicit: `npm run check`, MCP protocol regression tests, and Inspector chat schema validation are all required before relying on manual ChatGPT Developer Mode testing.
