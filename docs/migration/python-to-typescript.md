# Python to TypeScript Migration

Date: 2026-05-06

## Baseline Captured

Before deleting the Python runtime, the previous implementation passed:

- `python -m pytest`: 52 passed, 1 skipped
- `cd mcp_servers/widgets && npm run check`: passed

The TypeScript port uses the old Python tests and tool behavior as the migration oracle for:

- raw content normalization
- item classification
- duplicate detection
- board lanes and missing pieces
- itinerary grouping and schedule labels
- budget target, price, party-size, and night parsing
- file-store stale instance refresh
- model-readable tool responses and structured content

## Ported

- Unified travel-agent MVP tool surface
- Trip domain models and pure builders
- In-memory, file, and Postgres trip stores
- React widgets for inbox, board, itinerary, and budget
- TypeScript parity tests for domain, stores, and tools
- Root Node/TypeScript development workflow through `mcp-use`

## Retired

- FastAPI app and routers
- Python MCP servers and clients
- Python packing, travel tips, weather, and OpenWeather modules
- Static HTML widget resources and Storybook validation path
- Python project configuration and tests

Weather, destination guide, generic packing, and generic travel-tip surfaces were intentionally retired from the ChatGPT MVP because they were not persisted-trip-aware. They should only return if redesigned around saved trip context.

## Remaining Hosted Validation

Local build and tests pass, but hosted ChatGPT Developer Mode validation still needs to be completed after choosing a Node deployment target and setting production metadata.
