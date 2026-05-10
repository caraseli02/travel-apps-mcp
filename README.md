# travel-apps-mcp

TypeScript MCP app for persisted travel planning workspaces in ChatGPT Apps.

The app uses `mcp-use` for the MCP server, React widget resources, local Inspector preview, and Node-friendly deployment. The production runtime is now TypeScript only.

## Quick Start

```bash
npm install
npm run dev
```

`npm run dev` starts the MCP app and Inspector on `http://localhost:3000`.

## Configuration

Trip state can be stored in Postgres or a local JSON file.

```bash
# Production or hosted validation
DATABASE_URL="postgresql://..."
TRIP_STORE_BACKEND=postgres

# Local smoke testing
TRIP_STORE_BACKEND=file
TRIP_STORE_FILE_PATH=/tmp/travel-mcp-trips.json
```

`DATABASE_URL`, `NEON_DATABASE_URL`, and `SUPABASE_DATABASE_URL` are checked in that order for Postgres.

## Commands

```bash
npm run dev        # Start mcp-use dev server and Inspector
npm run build      # Build server and React widget resources
npm run typecheck  # TypeScript validation
npm test           # Vitest parity and store tests
npm run check      # Typecheck, tests, and build
```

## MCP Tools

- `create_trip`
- `add_trip_item`
- `list_trip_inbox`
- `update_trip_item_status`
- `get_trip_board`
- `render_trip_board`
- `get_trip_itinerary`
- `get_trip_budget`
- `get_trip_summary`
- `prepare_trip_clarification`
- `ask_trip_clarification`
- `render_trip_clarification`
- `submit_trip_clarification`

## Project Structure

- `index.ts` - `mcp-use` server entry point
- `src/domain/` - trip models, pure builders, schemas
- `src/stores/` - in-memory, file, and Postgres trip stores
- `src/tools/` - MCP tool surface
- `resources/` - React widgets rendered by `mcp-use`
- `tests/` - TypeScript parity and persistence coverage
- `docs/migration/python-to-typescript.md` - migration notes and retired Python scope

## Validation

Run:

```bash
npm run check
```

Before claiming ChatGPT submission readiness, also validate the hosted HTTPS endpoint in ChatGPT Developer Mode with database-backed trip state.
