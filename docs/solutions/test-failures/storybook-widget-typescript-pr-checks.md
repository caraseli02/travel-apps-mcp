---
module: Travel MCP Widgets
date: 2026-05-05
problem_type: missing_static_validation
component: storybook_widget_checks
symptoms:
  - "Storybook files were migrated from JavaScript to TypeScript, but no dedicated TypeScript check was exposed in package scripts"
  - "Storybook-related pull requests had no PR workflow gate for tsc --noEmit or a static Storybook build"
  - "Several Empty story variants were dropped during the JS-to-TS story migration"
  - "The widgets package needed to remain TypeScript-only for Storybook source files where possible"
root_cause: validation_gap
resolution_type: ci_and_storybook_fix
severity: medium
tags: [storybook, typescript, ci, widgets, migration, static-checks]
---

# Troubleshooting: Storybook TypeScript Migration Static Checks

## Problem

The widgets Storybook package was migrated from JavaScript to TypeScript, but the validation surface did not move with it. `typescript` and `@types/node` were added, yet there was no stable `tsc --noEmit` command or PR workflow to enforce type checks and Storybook static builds for future widget changes.

During review, the migration also lost some `Empty` story exports that existed in the previous JavaScript stories. That reduced coverage for empty-state widget behavior even though the Storybook build still passed.

## Environment

- Module: Travel MCP Widgets
- Storybook project: `mcp_servers/widgets`
- Affected files: Storybook config, stories, fixtures, package scripts, GitHub Actions
- Date: 2026-05-05
- Runtime: local Storybook 10.3.6 with HTML/Vite framework

## Symptoms

- `npm run build-storybook` passed locally, but this only proved the current build could compile.
- `mcp_servers/widgets/package.json` still had no dedicated `typecheck` or combined static check command.
- Storybook PRs had no workflow scoped to `mcp_servers/widgets/**`.
- The old `test` script still exited with `Error: no test specified`.
- Comparing old JS stories to the new TS stories showed missing `Empty` variants in several widget stories.
- A source scan needed to confirm no `.js`, `.mjs`, or `.cjs` Storybook source files remained under `mcp_servers/widgets`.

## Root Cause

The migration focused on renaming and typing Storybook files, but it did not add a CI contract for the new TypeScript source. Without a package-level typecheck command and PR workflow, TypeScript regressions could be introduced later without being caught before merge.

The missing story variants came from manual migration drift: the main `Default` and `Error` stories were carried forward, while several edge-state exports were omitted.

## What Didn't Work

**Relying on `npm run build-storybook` alone:** The static build is necessary, but it is not a clear TypeScript gate for reviewers or CI. A dedicated `typecheck` command makes the intended validation explicit.

**Treating a successful migration as story parity:** Renaming `.stories.js` to `.stories.ts` can still lose exported variants. The Storybook manager may look healthy while important empty/loading/error cases quietly disappear from the sidebar.

**Leaving PR checks implicit:** Local verification does not protect future Storybook-related pull requests unless the same checks run in CI.

## Solution

Add package scripts that expose both the TypeScript check and the combined Storybook validation path.

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "typecheck": "tsc --noEmit",
    "check": "npm run typecheck && npm run build-storybook"
  }
}
```

Add a workflow scoped to widget and Storybook changes so PRs run the same static checks.

```yaml
name: Widgets Storybook

on:
  pull_request:
    paths:
      - "mcp_servers/widgets/**"
      - ".github/workflows/widgets-storybook.yml"

jobs:
  check:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mcp_servers/widgets
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: mcp_servers/widgets/package-lock.json
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build-storybook
```

Restore migrated `Empty` story exports so Storybook keeps edge-state coverage. For example:

```ts
export const Empty: Story = {
  args: { data: { city: 'London', weather: 'rain', season: 'spring', activities: [] } },
};
```

Apply the same parity check to other migrated stories that previously had empty-state exports, such as destination guide, trip budget, trip inbox, itinerary, weather dashboard, and forecast chart.

Finally, document the new validation commands in the migration summary so future Storybook work has a clear local checklist.

```bash
npm run typecheck
npm run build-storybook
npm run check
```

## Verification

Run the combined local check from the widgets package:

```bash
cd mcp_servers/widgets
npm run check
```

The verified run completed `tsc --noEmit` and `storybook build` successfully.

Confirm the source migration stays TypeScript-only:

```bash
rg --files -g '*.js' -g '*.mjs' -g '*.cjs' mcp_servers/widgets
```

This returned no source files after the migration. Generated Storybook build output may still contain JavaScript inside `storybook-static`, but that is build output rather than Storybook source.

Browser smoke checks covered representative Storybook behavior:

- `Chat Preview / Trip Planning Workspace` rendered nested widget iframes.
- `Packing Checklist / Long Content` rendered and checklist interaction updated visible state.
- `Travel Activity Cards / Empty` rendered the expected empty-state message.

## Prevention

- Keep Storybook widget source TypeScript-only: `.ts` for config, fixtures, helpers, and HTML Storybook stories.
- Add a dedicated `typecheck` command whenever TypeScript is introduced to a package.
- Add a combined `check` command for the expected local and CI validation path.
- Scope CI workflows to the paths they protect so Storybook checks run on relevant PRs without slowing unrelated changes.
- Before a JS-to-TS story migration, list old story exports and compare them after migration.
- Preserve `Empty`, `Loading`, `Error`, `Long Content`, and interactive variants because they catch edge-state regressions that builds often miss.
- Browser-smoke at least one nested chat preview, one long-content widget, one empty-state widget, and one interactive widget after Storybook migration work.
- Avoid committing generated Storybook output, transpiled JS, cache folders, or coverage output as source review artifacts.

## Related Documentation

- `docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md` documents the earlier Storybook preview and v3 widget drift fix that this TypeScript/CI guard builds on.
- `docs/solutions/ui-bugs/chatgpt-native-widget-overflow-travel-mcp-widgets-20260504.md` documents the v3 prototype UI work that later became part of the Storybook widget review surface.
- `docs/testing_chatgpt_apps.md` is related for broader Apps SDK and widget verification.
- `docs/chatgpt_apps_readiness_review.md` is related for pre-review quality gates.

## Refresh Candidate

`docs/solutions/ui-bugs/storybook-widget-preview-v3-ui-drift-20260505.md` is a high-confidence refresh candidate. It still shows `.stories.js` and JavaScript Storybook config examples as the main reference, while the current widget Storybook source is now TypeScript and should be checked with `npm run typecheck` or `npm run check`.
