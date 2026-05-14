---
title: "MCP Apps metadata contract alignment for TypeScript mcp-use widgets"
module: "travel-apps-mcp"
date: "2026-05-14"
problem_type: "integration_issue"
component: "mcp_tool_descriptors"
symptoms:
  - "Widget-producing tools were validated mainly through ChatGPT/OpenAI metadata."
  - "MCP integration tests asserted openai/outputTemplate but not MCP Apps _meta.ui.resourceUri."
  - "Data-only and mutation tools needed explicit coverage to prevent accidental widget template advertisement."
  - "Local validation docs did not clearly distinguish MCP Apps protocol metadata from ChatGPT compatibility aliases."
root_cause: "The migrated TypeScript mcp-use app kept working ChatGPT-oriented descriptor assumptions, but MCP Apps metadata had not been made the primary tested contract after the Manufact MCP Apps alignment pass."
resolution_type: "metadata_contract_alignment"
severity: "medium"
tags: [mcp, mcp-use, chatgpt-apps, mcp-apps, metadata, widgets, typescript, integration-tests]
related_files:
  - src/server.ts
  - src/tools/travelAgent.ts
  - tests/mcpIntegration.test.ts
  - resources/trip-inbox/widget.tsx
  - resources/trip-board/widget.tsx
  - resources/trip-itinerary/widget.tsx
  - resources/trip-budget/widget.tsx
  - resources/trip-clarification/widget.tsx
  - docs/testing_chatgpt_apps.md
  - docs/chatgpt_apps_readiness_review.md
  - README.md
---

# MCP Apps Metadata Contract Alignment For TypeScript mcp-use Widgets

## Problem

The TypeScript `mcp-use` Travel MCP app had local validation for ChatGPT-style widget output templates, but not for the MCP Apps metadata contract. Widget-producing tools were asserted through `_meta["openai/outputTemplate"]`, so a regression could remove `_meta.ui.resourceUri` and still pass the main MCP integration test.

The app was architecturally close to the current MCP Apps guidance: it used `MCPServer` from `mcp-use/server`, React widget resources from `mcp-use/react`, widget tools returning `widget({ props, output })`, and a local Inspector workflow. The missing piece was making the generated descriptor contract explicit and tested for both protocol surfaces.

## Symptoms

- `tests/mcpIntegration.test.ts` checked ChatGPT compatibility metadata but not MCP Apps resource metadata.
- Widget resources used unified `WidgetMetadata.metadata`, but invocation status text was not guaranteed through the generated tool descriptors.
- Data and mutation tools such as `add_trip_item` and `get_trip_board` needed negative assertions so they could not accidentally advertise widget templates.
- `docs/testing_chatgpt_apps.md` described local validation but did not require checking both Inspector protocol modes.
- `docs/chatgpt_apps_readiness_review.md` did not clearly state that local readiness depends on dual MCP Apps and ChatGPT metadata for widget-producing tools.

## Root Cause

The runtime already used `mcp-use` widgets, and `mcp-use` can generate dual protocol metadata for widget-backed tools. The project tests and docs, however, were still centered on the older ChatGPT/OpenAI metadata names.

The contract that needed to be proven was:

- MCP Apps clients expect widget tools to advertise `_meta.ui.resourceUri`.
- Compatibility clients still expect `_meta["openai/outputTemplate"]`.
- Current `mcp-use` also exposes a legacy `_meta["ui/resourceUri"]` alias.
- Invocation status metadata should be generated from the unified widget/tool metadata path where possible.
- Data-only and mutation tools should return model-usable `structuredContent` without forcing widget render metadata.

## Investigation

The useful inspection point was not the source declaration alone. It was the actual `tools/list` descriptor after `mcp-use` registered tools and widgets.

Runtime descriptor inspection showed that widget tools could expose all expected surfaces:

```text
_meta.ui.resourceUri
_meta["ui/resourceUri"]
_meta["openai/outputTemplate"]
_meta["openai/toolInvocation/invoking"]
_meta["openai/toolInvocation/invoked"]
_meta["openai/widgetCSP"]
```

That meant the fix did not need a rewrite from the Quick Start scaffold. The right move was to keep the existing TypeScript app, align retained widgets with the unified metadata model, and test generated descriptors through the MCP client path.

## Solution

### 1. Keep the TypeScript app

The existing app already had the right foundation:

- `src/server.ts` creates the server through `MCPServer`.
- `src/tools/travelAgent.ts` registers travel tools and returns widgets from renderable tool paths.
- `resources/*/widget.tsx` files define React widget resources.
- `tests/mcpIntegration.test.ts` starts a real MCP server and calls tools through `MCPClient`.

Restarting from the Quick Start template would have thrown away working trip persistence, tool routing, widget resources, and test infrastructure.

### 2. Add unified widget invocation metadata

Each retained trip-workspace widget now includes `invoking` and `invoked` fields in its `WidgetMetadata.metadata`.

Example:

```ts
export const widgetMetadata: WidgetMetadata = {
  title: "Trip Board",
  description: "Shows trip decisions, shortlist, booked items, itinerary draft, and missing pieces.",
  props: tripBoardPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "Trip planning board grouped by decisions, shortlist, booked items, itinerary, and gaps.",
    invoking: "Rendering trip board",
    invoked: "Rendered trip board",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};
```

The same pattern was applied to:

- `resources/trip-inbox/widget.tsx`
- `resources/trip-board/widget.tsx`
- `resources/trip-itinerary/widget.tsx`
- `resources/trip-budget/widget.tsx`
- `resources/trip-clarification/widget.tsx`

The corresponding widget-producing tool registrations continue to name the widget and status text:

```ts
server.tool(
  {
    name: "render_trip_board",
    title: "Render trip board",
    description:
      "Use this after fetching or changing trip state when the user asks to see a visual trip board of decisions, shortlist, booked items, itinerary draft, and missing pieces.",
    schema: tripIdSchema,
    annotations: READ_ONLY,
    widget: {
      name: "trip-board",
      invoking: "Rendering trip board",
      invoked: "Rendered trip board",
    },
  },
  renderTripBoard
);
```

### 3. Assert both metadata contracts through MCP

The MCP integration test now treats the descriptor as the compatibility contract:

```ts
function expectWidgetMetadata(tool: Tool, widgetName: string, invoking: string, invoked: string): void {
  const template = `ui://widget/${widgetName}.html`;
  expect(tool._meta?.ui).toMatchObject({ resourceUri: template });
  expect(tool._meta?.["ui/resourceUri"]).toBe(template);
  expect(tool._meta?.["openai/outputTemplate"]).toBe(template);
  expect(tool._meta?.["openai/toolInvocation/invoking"]).toBe(invoking);
  expect(tool._meta?.["openai/toolInvocation/invoked"]).toBe(invoked);
  expect(tool._meta?.["openai/widgetCSP"]).toMatchObject({
    connect_domains: expect.any(Array),
    resource_domains: expect.any(Array),
  });
}
```

The retained widget tools are now covered:

```ts
expectWidgetMetadata(inboxTool, "trip-inbox", "Loading trip inbox", "Loaded trip inbox");
expectWidgetMetadata(renderBoardTool, "trip-board", "Rendering trip board", "Rendered trip board");
expectWidgetMetadata(itineraryTool, "trip-itinerary", "Loading trip itinerary", "Loaded trip itinerary");
expectWidgetMetadata(budgetTool, "trip-budget", "Loading trip budget", "Loaded trip budget");
expectWidgetMetadata(askClarificationTool, "trip-clarification", "Opening trip questions", "Opened trip questions");
expectWidgetMetadata(clarificationTool, "trip-clarification", "Opening trip questions", "Opened trip questions");
```

The test also guards the data/render split:

```ts
expect(getTripBoardTool._meta?.ui).toBeUndefined();
expect(getTripBoardTool._meta?.["openai/outputTemplate"]).toBeUndefined();
expect(addItemTool._meta?.ui).toBeUndefined();
expect(addItemTool._meta?.["openai/outputTemplate"]).toBeUndefined();
```

This preserves the pattern that data and mutation tools return reusable `structuredContent`, while render tools own widget display.

### 4. Update validation docs

`docs/testing_chatgpt_apps.md` now says local validation is `mcp-use` Inspector plus MCP integration tests. It explicitly separates protocol expectations:

- MCP Apps mode: widget tools must advertise `_meta.ui.resourceUri`.
- ChatGPT mode: the same widget tools must advertise `_meta["openai/outputTemplate"]`.

The doc also names the MVP widget tools and states that `add_trip_item`, `get_trip_board`, and `prepare_trip_clarification` should not advertise widget templates.

`docs/chatgpt_apps_readiness_review.md` now records:

- 13 travel-agent tools are registered.
- Widgets exist for inbox, board, itinerary, budget, and clarification.
- Widget-producing tools advertise both MCP Apps and ChatGPT metadata.
- Data-only tools do not advertise widget templates.
- Hosted ChatGPT Developer Mode validation remains required before submission-ready claims.

## Verification

The solved state was verified with:

```bash
npm run check
```

That passed:

- TypeScript typecheck
- Vitest tests
- MCP descriptor assertions
- `mcp-use build`

Whitespace validation also passed:

```bash
git diff --check
```

Manual Inspector protocol-toggle smoke testing was documented as a remaining pre-submission check rather than claimed as completed.

## What Did Not Change

The pass did not remove ChatGPT-specific lifecycle metadata such as `_meta["openai/closeWidget"]` from `submit_trip_clarification`. That field remains a verified host lifecycle contract until a unified MCP Apps equivalent is proven.

The pass also did not make non-MVP widgets submission-ready. Built resources such as destination guide, activity cards, packing checklist, and explore places remain experimental unless promoted through the same product, metadata, and Developer Mode gates.

## Related Documentation

- `docs/solutions/integration-issues/apps-sdk-trip-workspace-mvp-tool-render-alignment-20260505.md`
  - Establishes the saved-trip MVP surface and data/render split.
- `docs/solutions/integration-issues/schema-compatible-mcp-chatgpt-apps-inspector-20260506.md`
  - Explains why `tools/list` and MCP-client tests are the real compatibility boundary.
- `docs/solutions/integration-issues/chatgpt-apps-trip-clarification-widget-lifecycle-20260508.md`
  - Documents the clarification widget routing and iframe close lifecycle.
- `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md`
  - Related for widget resource drift and Storybook iframe validation.

## Prevention

Treat `tools/list` as an API contract. Descriptor changes should be reviewed like schema changes because they affect whether MCP Apps and ChatGPT clients can render widgets.

Keep these regression checks in place:

- Widget-producing tools expose `_meta.ui.resourceUri`.
- Widget-producing tools retain `_meta["openai/outputTemplate"]`.
- Widget-producing tools expose non-empty invocation status metadata.
- Data-only and mutation tools do not advertise `_meta.ui`, `_meta["ui/resourceUri"]`, or `_meta["openai/outputTemplate"]`.
- Tool calls return `structuredContent` plus model-visible text.
- Clarification submit keeps `_meta["openai/closeWidget"] === true`.
- Public schemas remain ChatGPT-compatible, including array-shaped `required` fields.

Automate descriptor checks in `npm run check`, and keep Inspector protocol-toggle validation as the manual smoke step before hosted submission readiness.

## Future Follow-Up

The related-docs scan found one narrow refresh candidate:

- `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md`

That doc still appears centered on older static HTML and Python-era Storybook examples. A targeted `ce:compound-refresh` pass for that file would be reasonable, but it is not required for this metadata-alignment learning.
