---
module: Travel MCP Widgets
date: 2026-05-05
problem_type: ui_bug
component: storybook_widget_preview
symptoms:
  - "Storybook discovered widget stories but the preview iframe stayed on No Preview"
  - "The iframe console reported __DEFINES__ is not defined from /node_modules/vite/dist/client/env.mjs"
  - "Static Storybook builds failed when Storybook tried to copy the widget project into storybook-static"
  - "Rendered widget stories used older v1/v2 UI while v3_prototype_showcase.html had the intended current design"
root_cause: configuration_error
resolution_type: code_fix
severity: medium
tags: [storybook, vite, apps-sdk, widgets, chatgpt-ui, static-html, resource-versioning]
---

# Troubleshooting: Storybook No Preview and V3 Widget UI Drift

## Problem

Storybook started cleanly, discovered all widget stories, and returned successful network responses, but each story showed `No Preview` instead of rendering. After the preview issue was fixed, Storybook still rendered a different UI from `mcp_servers/widgets/v3_prototype_showcase.html`, which was the updated design source the widgets were expected to use.

## Environment

- Module: Travel MCP Widgets
- Stage: pre-ChatGPT Apps review
- Affected components: Storybook HTML/Vite config, static HTML widget resources, MCP UI resource readers
- Storybook project: `mcp_servers/widgets`
- Date: 2026-05-05
- Runtime: local macOS workspace with Storybook browser verification

## Symptoms

- Storybook UI loaded and the sidebar listed stories, but the canvas stayed in the preparing/no-preview state.
- Browser console showed `__DEFINES__ is not defined` from `/node_modules/vite/dist/client/env.mjs`.
- `npm run build-storybook` failed because static asset copying attempted to copy the widget project root into its own `storybook-static` output.
- Generated Storybook example stories appeared in the sidebar even though they were not part of the widget review workflow.
- Once stories rendered, the widget visuals did not match `v3_prototype_showcase.html`; the standalone resource files and MCP readers still pointed at older widget HTML.
- During the v3 port, hidden loading/empty states remained visible because component-level `display` declarations overrode the HTML `hidden` attribute.

## Root Cause

The immediate `No Preview` bug came from an over-broad Storybook static asset configuration. `staticDirs: ["../"]` served the whole widget project at `/`, including `node_modules`, so Storybook/Vite internals were shadowed by raw static files. Vite's transformed `/node_modules/vite/dist/client/env.mjs` was replaced with the unprocessed source file, leaving `__DEFINES__` unresolved and preventing the preview iframe from booting.

The second issue was a source-of-truth drift. `v3_prototype_showcase.html` contained the newer hand-polished UI, but the actual standalone widget files used by Storybook and the MCP resources were still older implementations. Storybook was correctly rendering the files it had been given; those files were just not the v3 UI.

## What Didn't Work

**Treating successful network requests as proof of a working preview:** The iframe loaded assets with 200/304 responses, but one of those responses was the wrong artifact: a raw Vite module served from static files instead of Vite's transformed module.

**Serving the entire widgets directory as static assets:** This made widget HTML files easy to reach, but it also exposed implementation directories that Storybook/Vite need to own.

**Using the prototype only as a visual reference:** The v3 prototype was not connected to the Storybook stories or MCP resource readers, so it could improve independently while the real review surface stayed stale.

## Solution

Replace broad static serving with a whitelist Vite plugin that serves and emits only approved widget HTML files.

```js
const widgetHtmlFiles = [
  "packing_checklist_v3.html",
  "travel_activity_cards_v3.html",
  "travel_destination_guide_v1.html",
  "trip_board_v3.html",
  "trip_budget_v3.html",
  "trip_inbox_v1.html",
  "trip_itinerary_v3.html",
  "weather_dashboard_v4.html",
  "weather_forecast_chart_v1.html",
];

const widgetHtmlPlugin = {
  name: "travel-widget-html-files",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = new URL(req.url ?? "/", "http://storybook.local").pathname;
      const filename = decodeURIComponent(pathname).replace(/^\/+/, "");

      if (!widgetHtmlFileSet.has(filename)) return next();

      const html = await readFileAsync(resolve(widgetRoot, filename), "utf8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(html);
    });
  },
  generateBundle() {
    for (const filename of widgetHtmlFiles) {
      this.emitFile({
        type: "asset",
        fileName: filename,
        source: readFileSync(resolve(widgetRoot, filename), "utf8"),
      });
    }
  },
};
```

Limit Storybook discovery to the actual widget and chat-preview stories so generated examples are not part of the review surface.

```js
const config = {
  stories: [
    "../stories/PackingChecklist.stories.js",
    "../stories/TravelActivityCards.stories.js",
    "../stories/TravelDestinationGuide.stories.js",
    "../stories/TripBoard.stories.js",
    "../stories/TripBudget.stories.js",
    "../stories/TripInbox.stories.js",
    "../stories/TripItinerary.stories.js",
    "../stories/WeatherDashboard.stories.js",
    "../stories/WeatherForecastChart.stories.js",
    "../stories/chat/ChatPreview.stories.js",
  ],
  async viteFinal(viteConfig) {
    return {
      ...viteConfig,
      plugins: [...(viteConfig.plugins ?? []), widgetHtmlPlugin],
    };
  },
};
```

Use a small Apps SDK-style host harness in Storybook so each static widget iframe receives the same shape of data it expects in ChatGPT.

```js
targetWindow.dispatchEvent(
  new CustomEvent("openai:set_globals", {
    detail: { globals: hostState },
  })
);

targetWindow.postMessage(
  {
    jsonrpc: "2.0",
    method: "ui/notifications/tool-result",
    params: {
      structuredContent: hostState.toolOutput,
      toolOutput: hostState.toolOutput,
      _meta: hostState._meta,
    },
  },
  "*"
);
```

Promote the v3 prototype design into the real standalone widget files, then point both Storybook and MCP readers at those files. The v3-covered widgets were:

- `packing_checklist_v3.html`
- `travel_activity_cards_v3.html`
- `trip_board_v3.html`
- `trip_budget_v3.html`
- `trip_itinerary_v3.html`

The standalone v3 widgets keep the prototype's visual language but render dynamically from `window.openai.toolOutput`, `openai:set_globals`, and `ui/notifications/tool-result` instead of hardcoded showcase data.

Current implementation note: the visible v3 HTML files are served behind some older `ui://` resource URIs. This kept the existing tool metadata stable during Storybook review, but it is a deliberate versioning decision that must be revisited before treating the resources as a durable ChatGPT Apps contract.

| Tool/UI | Advertised resource URI | HTML file currently served |
| --- | --- | --- |
| Packing checklist | `ui://packing/checklist-v2.html` | `packing_checklist_v3.html` |
| Activity cards | `ui://travel/activity-cards-v2.html` | `travel_activity_cards_v3.html` |
| Trip board | `ui://trip/board-v2.html` | `trip_board_v3.html` |
| Trip itinerary | `ui://trip/itinerary-v1.html` | `trip_itinerary_v3.html` |
| Trip budget | `ui://trip/budget-v1.html` | `trip_budget_v3.html` |

There are two acceptable ways to resolve that before external review:

1. If the v3 UI is compatible with the existing ChatGPT Apps contract, document the compatibility decision and add tests that assert each legacy URI intentionally serves the v3 file.
2. If the v3 UI is a material widget contract change, bump the `ui://` URI and `_meta["openai/outputTemplate"]` version together in each standalone server and in `travel_agent_server.py`.

Also add an explicit hidden-state guard to each v3 widget:

```css
[hidden] {
  display: none !important;
}
```

This matters because custom classes such as `.empty { display: grid; }` can override the browser's default `[hidden]` behavior and leave loading/empty panels visible over real content.

## Verification

Run the static build:

```bash
npm run build-storybook
```

Run focused MCP/UI resource tests:

```bash
python -m pytest \
  tests/test_apps_ui_resources.py \
  tests/test_travel_agent_server.py::test_unified_server_registers_every_tool_output_template
```

Verify in the browser:

- Load every Storybook story and assert there are no `No Preview` canvases.
- Check the console for runtime errors.
- Check failed network requests.
- For v3 widgets, inspect the child iframe URL and confirm it contains the expected `_v3.html` file.
- Check that rendered content appears without visible loading/empty states.
- Include the full chat preview stories, especially the trip-planning conversation that combines board, itinerary, budget, and packing widgets.

The fixed implementation passed the Storybook build, the focused pytest suite, six key v3 browser checks, and a full sweep of 29 Storybook stories with no console errors or failed requests.

## Prevention

- Do not point Storybook `staticDirs` at a project root. Whitelist only the static files that stories need.
- Treat Storybook as the widget review source, not just a component catalog. Add individual stories for each widget and a full chat-preview story for multi-widget flows.
- Keep prototype/showcase HTML and production widget resources synchronized. If a prototype becomes the intended UI, promote it into standalone widget files before review.
- Keep resource URI versions, Storybook fixture URLs, and MCP resource readers in lockstep. A `_v3.html` filename behind a `ui://...-v1/v2.html` URI should be either a documented compatibility choice or a short-lived review bridge.
- For Apps SDK widgets, test the iframe with a host harness that simulates `window.openai`, `openai:set_globals`, widget state updates, and tool-result notifications.
- Browser-test both the Storybook frame and the nested widget iframe. A clean parent frame can still hide a broken child frame.
- Use `[hidden] { display: none !important; }` in standalone widgets when authored display classes are used.
- When a widget's visible contract changes materially, review whether the `ui://...` resource URI version should change instead of serving new markup from an old URI.

## Related Issues

- `docs/solutions/ui-bugs/chatgpt-native-widget-overflow-travel-mcp-widgets-20260504.md` documents the v3 prototype visual polish and mobile overflow fix that became the source for the standalone v3 widgets.
- `docs/testing_chatgpt_apps.md` lists the MCP tools, resource URIs, and manual ChatGPT Apps testing flow.
- `docs/chatgpt_apps_readiness_review.md` contains resource-versioning guidance that is now directly relevant because v3 files are served behind existing `ui://...-v1/v2.html` URIs.
- `docs/plans/2026-05-04-001-docs-align-mcp-ui-foundation-plan.md` also calls out versioned `ui://...-vN.html` URIs for incompatible widget changes.
