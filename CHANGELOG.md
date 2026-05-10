# Changelog

All notable changes to this project are documented here.

## [0.2.0.0] - 2026-05-05

### Added

- Added Storybook infrastructure for widget development and visual review, enabling isolated testing of all MCP Apps UI widgets with simulated ChatGPT bridge events
- Added v3 widget implementations with improved visual design, proper Apps SDK bridge integration, and responsive iframe layouts for packing checklist, travel activity cards, trip board, trip budget, and trip itinerary
- Added comprehensive Storybook stories for all widgets including chat preview scenarios that demonstrate multi-widget conversation flows
- Added custom Vite plugin for serving widget HTML files in Storybook with proper static asset handling and build-time emission
- Added documentation for Storybook setup, widget resource versioning, and UI bug solutions in `docs/solutions/ui-bugs/`
- Added MCP Apps UI foundation plan document outlining framework decisions, Apps SDK alignment, and validation gates for future UI work

### Changed

- Updated MCP servers (packing, travel agent, travel tips) to serve v3 widget HTML files while maintaining backward-compatible resource URIs
- Replaced standalone preview HTML files with versioned v3 implementations that integrate with Apps SDK bridge events (`openai:set_globals`, `ui/notifications/tool-result`)
- Updated `.gitignore` to exclude Storybook build artifacts and Node.js dependencies

### Fixed

- Fixed Storybook "No Preview" issue caused by over-broad static directory configuration that shadowed Vite's module transformation
- Fixed widget hidden state handling by adding explicit `[hidden] { display: none !important; }` CSS guard to prevent component styles from overriding the HTML hidden attribute
- Fixed widget resource versioning drift where v3 prototype UI was disconnected from production widget files and MCP resource readers

## [0.1.0.0] - 2026-04-30

### Added

- Added a unified travel-agent MCP endpoint so ChatGPT can use weather, destination tips, activity recommendations, packing, Trip Inbox, and Trip Board tools from one app connection.
- Added persistent Trip and TripItem storage backed by Postgres through `DATABASE_URL`, with duplicate travel fragments detected by normalized raw content.
- Added Trip Inbox and Trip Board widgets so saved planning fragments can be reviewed, grouped, and turned into visible trip state.
- Added tests for trip storage behavior, MCP tool structured output, widget resources, and the unified `/mcp/travel-agent/` endpoint.

### Changed

- Documented the new `DATABASE_URL` deployment secret and regenerated the dependency lockfile with `psycopg` pool support.
- Switched from Supabase to Neon as the recommended Postgres provider for FastAPI Cloud deployments. Neon is serverless-native with built-in connection pooling; its compute can scale to zero after inactivity and wake on the next connection.
