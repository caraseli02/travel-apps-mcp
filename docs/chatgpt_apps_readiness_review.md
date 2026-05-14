# ChatGPT Apps Readiness Review

## Current Status

The app has been rewritten to a TypeScript `mcp-use` runtime with React widgets and TypeScript parity tests. Local validation covers the MCP protocol path, but hosted ChatGPT Developer Mode validation is still required.

## Ready Locally

- 13 travel-agent tools are registered from the TypeScript server.
- Trip persistence works through in-memory, file, and Postgres store implementations.
- React widgets exist for inbox, board, itinerary, budget, and clarification.
- Widget-producing tools advertise both MCP Apps `_meta.ui.resourceUri` and ChatGPT `_meta["openai/outputTemplate"]`.
- Data-only tools such as `get_trip_board`, `add_trip_item`, and `prepare_trip_clarification` do not advertise widget templates.
- `npm run check` validates typecheck, tests, and build.

## Not Submission Ready Until Hosted

- Public HTTPS MCP URL selected and deployed.
- `DATABASE_URL` configured in the hosting environment.
- Production widget metadata reviewed, including MCP Apps resource metadata, ChatGPT compatibility metadata, CSP, and domain settings.
- ChatGPT Developer Mode completes the persisted trip workspace flow.
- Operational monitoring and rollback plan documented for the chosen host.

## Non-MVP Surfaces

Weather, destination guide, generic travel tips, generic activity cards, explore-place carousels, and generic packing widgets are out of scope unless redesigned around saved trip state. Some non-MVP resources may still build for local experimentation, but they are not part of the hosted submission-readiness claim unless promoted through the same metadata and Developer Mode validation gates.
