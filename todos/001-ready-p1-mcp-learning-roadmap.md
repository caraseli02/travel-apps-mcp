---
status: ready
priority: p1
issue_id: "001"
tags: [mcp, learning, fastapi-cloud, travel-planner]
dependencies: []
---

# MCP Learning Roadmap

## Problem Statement

The project has FastAPI boilerplate and FastAPI Cloud deployment setup, but the MCP learning work still needs a detailed path. The goal is to let you build the MCP parts yourself while keeping enough hints, examples, and checkpoints to avoid getting stuck.

## Guiding Rule

- You build first: MCP servers, tools, resources, prompts, UI resources, stdio/HTTP transport behavior.
- Assistant helps around it: FastAPI boilerplate, tests, config, docs, deployment setup, debugging, review, and explanations.
- When stuck, ask for a hint before asking for a full implementation.

## References

Local project references:

- Sprint MCP skeletons: `sprint_4_travel_planner_prompt.md`, lines 205-385.
- FastAPI orchestration target: `sprint_4_travel_planner_prompt.md`, lines 389-470.
- MCP acceptance criteria: `.kiro/specs/mcp-travel-planner-ui/requirements.md`, lines 26-60.
- MCP Apps UI requirements: `.kiro/specs/mcp-travel-planner-ui/requirements.md`, lines 62-145.
- Weather response/resource shapes: `.kiro/specs/mcp-travel-planner-ui/design.md`, lines 250-365.
- Travel tips response/resource shapes: `.kiro/specs/mcp-travel-planner-ui/design.md`, lines 367-478.
- Current FastAPI app pattern: `app/main.py`.
- Current router pattern: `app/routers/health.py` and `app/routers/travel.py`.
- Current settings pattern: `app/config.py`.

Installed MCP SDK references:

- FastMCP constructor and `run()` signature: `.venv/lib/python3.11/site-packages/mcp/server/fastmcp/server.py`.
- FastMCP decorator examples for `@server.tool()`, `@server.resource(...)`, and `@server.prompt()`: `.venv/lib/python3.11/site-packages/mcp/server/fastmcp/server.py`, around the decorator docstrings.

Useful commands:

```bash
source .venv/bin/activate
python -m pytest -q
fastapi dev
python mcp_servers/weather_server.py
python mcp_servers/travel_tips_server.py
python mcp_servers/packing_server.py
```

## Proposed Solutions

### Option A: Build All MCP Servers First

Pros:
- Strong MCP practice.
- Keeps domain separation clear.

Cons:
- More moving pieces before seeing an end-to-end result.
- Harder to debug if all servers are half-built.

### Option B: Build One Vertical Slice First

Pros:
- Fastest learning feedback loop.
- Easier to debug.
- Lets you connect weather MCP to FastAPI before repeating the pattern.

Cons:
- Travel tips and packing come later.

### Option C: Build UI Resources First

Pros:
- More visual and motivating.

Cons:
- UI contracts may change while the tool responses are unstable.
- Harder to validate without working tool data.

## Recommended Action

Use Option B. Build one vertical slice:

1. Weather MCP server.
2. Basic weather test/manual call.
3. FastAPI health/readiness sees weather server.
4. Travel endpoint calls weather client.
5. Repeat the pattern for packing.
6. Repeat the pattern for travel tips.
7. Add MCP Apps UI resources after response shapes are stable.

## Detailed Todo List

### Phase 0: Confirm Environment

- [ ] Activate the virtualenv.
- [ ] Run `python -m pytest -q`.
- [ ] Run `fastapi dev`.
- [ ] Confirm `/`, `/health`, `/health/mcp`, and `/api/v1/travel/plan` work.

Hints:
- The app already starts as `app.main:app`.
- If `fastapi` is missing, use `.venv/bin/fastapi dev`.

Acceptance criteria:
- Tests pass.
- FastAPI CLI reports `Using import string: app.main:app`.

### Phase 1: Create MCP Server Files - Complete

- [x] Create `mcp_servers/__init__.py`.
- [x] Create `mcp_servers/weather_server.py`.
- [x] Create `mcp_servers/travel_tips_server.py`.
- [x] Create `mcp_servers/packing_server.py`.

Hints:
- Start by copying the skeleton shape from `sprint_4_travel_planner_prompt.md`, lines 205-385.
- Use separate ports from the FastAPI app:
  - FastAPI orchestrator: `8000`
  - Weather MCP: `8101`
  - Travel Tips MCP: `8102`
  - Packing MCP: `8103`
- For local first pass, use `server.run("streamable-http")`.
- Keep each file runnable directly with `if __name__ == "__main__":`.

Acceptance criteria:
- [x] `python mcp_servers/weather_server.py` starts without import errors.
- [x] Same for travel tips and packing server, even if tools initially return placeholder data.

### Phase 2: Weather MCP Tool, Resource, Prompt - Complete

- [x] Add `get_current_weather(city: str)`.
- [x] Add `get_forecast(city: str, days: int = 5)`.
- [x] Add `city_forecast(city: str)` resource at `weather://forecast/{city}`.
- [x] Add `weather_comparison(origin_city, destination_city, travel_date)` prompt.
- [x] Return structured JSON-like data, not loose prose.

Hints:
- Follow requirements lines 32-35 in `.kiro/specs/mcp-travel-planner-ui/requirements.md`.
- Follow response shape in `.kiro/specs/mcp-travel-planner-ui/design.md`, lines 258-285.
- Follow resource/prompt shape in `.kiro/specs/mcp-travel-planner-ui/design.md`, lines 288-349.
- The MCP SDK decorator examples are in `.venv/lib/python3.11/site-packages/mcp/server/fastmcp/server.py`.
- First pass can use fake weather data. Add OpenWeather only after the MCP shape works.

Suggested fake response fields:

```json
{
  "city": "Paris",
  "temperature_celsius": 18,
  "temperature_fahrenheit": 64,
  "conditions": "Partly Cloudy",
  "humidity": 65,
  "wind_speed": 12,
  "precipitation_probability": 20,
  "icon": "02d",
  "timestamp": "2026-04-28T10:00:00Z"
}
```

Acceptance criteria:
- [x] Tools validate input types.
- [x] Forecast clamps or rejects `days` outside 1-5.
- [x] Invalid empty city returns a user-friendly error.
- [x] Tool output includes enough fields for the future UI.

### Phase 3: OpenWeather Integration - Complete

- [x] Read `OPENWEATHER_API_KEY` from environment.
- [x] Add an async HTTP client function for current weather.
- [x] Add an async HTTP client function for forecast.
- [x] Normalize OpenWeather fields into your internal response shape.
- [x] Add retry behavior for temporary API failures.
- [x] Add a 10-minute in-memory cache.

Hints:
- OpenWeather endpoints are listed in `.kiro/specs/mcp-travel-planner-ui/design.md`, lines 351-355.
- Cache/error expectations are lines 357-365.
- Use `aiohttp`, already declared in `pyproject.toml`.
- Keep API-normalization code separate from the MCP decorators so it is testable.

Acceptance criteria:
- [x] Missing API key fails clearly or returns a clear setup error.
- [x] Invalid city returns a city-not-found style error.
- [x] External API details do not leak into the UI shape.
- [x] `OPENWEATHER_API_KEY` never appears in returned data or UI HTML.

### Phase 4: Packing MCP Server - Complete

- [x] Add static packing templates.
- [x] Add `generate_packing_list(destination, duration_days, weather_forecast)`.
- [x] Add `packing_advisor(origin, destination, duration, activities)` prompt.
- [x] Group packing output by category: clothing, toiletries, electronics, documents, accessories.
- [x] Mark weather-based items with a reason.

Hints:
- Start from `sprint_4_travel_planner_prompt.md`, lines 333-385.
- Requirements for weather-to-packing rules are in `.kiro/specs/mcp-travel-planner-ui/requirements.md`, lines 218-224.
- UI checklist requirements are lines 96-111, but do not build the UI yet.

Acceptance criteria:
- [x] Cold weather includes heavy coat, gloves, scarf, thermal underwear.
- [x] Rain probability over 30 percent includes umbrella and rain jacket.
- [x] Duration affects clothing quantities.
- [x] Negative duration is rejected.

### Phase 5: Travel Tips MCP Server - Complete

- [x] Add curated destination data for 3-5 cities.
- [x] Add `get_destination_tips(city)`.
- [x] Add `recommend_activities(city, weather, season)`.
- [x] Add `destination_briefing(city, duration_days)` prompt.
- [x] Include coordinates, tips, activities, estimated cost/time, and weather dependency flags.

Hints:
- Start from `sprint_4_travel_planner_prompt.md`, lines 271-331.
- Response shape example is in `.kiro/specs/mcp-travel-planner-ui/design.md`, lines 394-431.
- Tool schema expectations are lines 373-454.
- Keep data in a separate constant or module so the server file does not become hard to read.

Acceptance criteria:
- [x] Known city returns structured destination guide data.
- [x] Unknown city returns a helpful error.
- [x] Activity recommendations respond to rainy, cold, hot, and mild weather.

### Phase 6: MCP Client Layer - Complete

- [x] Create `mcp_clients/__init__.py`.
- [x] Create `mcp_clients/base_client.py`.
- [x] Create `mcp_clients/weather_client.py`.
- [x] Create `mcp_clients/travel_client.py`.
- [x] Create `mcp_clients/packing_client.py`.
- [x] Wire the clients into `app/routers/travel.py`.

Hints:
- Current FastAPI travel orchestration lives in `app/routers/travel.py`.
- Settings are already available from `app/config.py`.
- Do not overbuild the client. Start with one method per server tool.
- Add timeouts and friendly errors before adding more features.

Acceptance criteria:
- [x] `/api/v1/travel/plan` calls weather, travel tips, and packing through client abstractions.
- [x] If one MCP server is down, API returns a clear partial/failure response.
- [x] `/health/mcp` reports pending, healthy, or unavailable per server.

### Phase 7: MCP Apps UI Resources

- [x] Add first weather dashboard resource: `ui://weather/dashboard-v4.html`.
- [x] Wire `get_current_weather` to the weather dashboard resource.
- [x] Return real top-level `structuredContent` from `get_current_weather`.
- [x] Add weather widget resource metadata for MIME type, CSP, and widget description.
- [x] Document why the current local preview cannot validate `window.openai`.
- [x] Validate weather dashboard in ChatGPT Developer Mode or a bridge-aware inspector.
- [x] Remove temporary visible bridge debug status after real runtime validation.
- [x] Add `ui://weather/forecast-chart-v1.html`.
- [x] Add `ui://packing/checklist-v1.html`.
- [x] Add `ui://travel/destination-guide-v1.html`.
- [x] Add `ui://travel/activity-cards-v1.html`.
- [x] Return complete HTML documents with embedded CSS and JavaScript.
- [x] Implement basic bridge update handlers for `window.openai`, `openai:set_globals`, and `ui/notifications/tool-result`.

Hints:
- UI resource requirements are `.kiro/specs/mcp-travel-planner-ui/requirements.md`, lines 62-77.
- Weather UI requirements are lines 79-94.
- Packing UI requirements are lines 96-111.
- Destination guide UI requirements are lines 113-128.
- PostMessage protocol requirements are lines 130-145.
- First version can use vanilla JavaScript. Avoid build tooling until the HTML contract works.
- Use `docs/testing_chatgpt_apps.md` for the difference between MCP protocol validation and real widget bridge validation.
- If a preview says `Bridge unavailable in this preview`, the HTML loaded but that preview did not inject `window.openai`.

Acceptance criteria:
- Each UI resource is readable through MCP resource access.
- Each resource has MIME type `text/html;profile=mcp-app`.
- Apps-aware tools return top-level `structuredContent`, not JSON text.
- Widget bridge behavior is validated in ChatGPT Developer Mode or a bridge-aware inspector before polishing UI.
- UI works in narrow iframe widths around 320px.
- No secrets appear in UI HTML.

Developer Mode ports:

- Weather MCP: `8101` -> `ui://weather/dashboard-v4.html`, `ui://weather/forecast-chart-v1.html`
- Travel tips MCP: `8102` -> `ui://travel/destination-guide-v1.html`, `ui://travel/activity-cards-v1.html`
- Packing MCP: `8103` -> `ui://packing/checklist-v1.html`

Mounted FastAPI MCP endpoints:

- Weather: `/mcp/weather/`
- Travel tips: `/mcp/travel/`
- Packing: `/mcp/packing/`
- Unified travel agent: `/mcp/travel-agent/`

### Phase 7.5: Office-Hours Product Pivot - Complete

- [x] Run `/office-hours` for the next product direction.
- [x] Preserve the gstack design doc in repo docs.
- [x] Add Trip Inbox and Trip Board widgets.
- [x] Add persistent trip state.
- [x] Expose trip tools through a unified travel-agent MCP endpoint.
- [x] Keep weather, travel tips, activities, and packing available through the same unified endpoint.

Original gstack artifact:

```text
/Users/vladislavcaraseli/.gstack/projects/caraseli02-travel-mcp-apps/vladislavcaraseli-main-design-20260430-150714.md
```

Repo copy:

```text
docs/office_hours_trip_inbox_board_2026-04-30.md
```

Plan changes:

- The original office-hours doc suggested SQLite first. Current code uses Postgres through `DATABASE_URL`, with `TRIP_STORE_BACKEND=file` for temporary smoke testing.
- The original office-hours doc suggested a future `/mcp/trips` endpoint. Current code uses `/mcp/travel-agent/` as the primary ChatGPT endpoint.
- The original three-server learning plan remains useful for local debugging, but ChatGPT Developer Mode should use the unified endpoint.

### Phase 8: FastAPI Cloud Deployment And Developer Mode Validation

- [x] Run local tests.
- [x] Mount MCP servers into the FastAPI app.
- [x] Configure mounted MCP endpoints for stateless HTTP on cloud hosting.
- [x] Run `fastapi dev`.
- [ ] Login with `fastapi login`.
- [ ] Deploy with `fastapi deploy`.
- [ ] Set `OPENWEATHER_API_KEY` as a secret.
- [ ] Set `DATABASE_URL` through the Neon integration, or set `TRIP_STORE_BACKEND=file` only for temporary smoke testing.
- [ ] Redeploy.
- [ ] Test remote `/health`.
- [ ] Test remote `/docs`.
- [ ] Test remote `/mcp/travel-agent/`.
- [ ] Connect `/mcp/travel-agent/` in ChatGPT Developer Mode.
- [ ] Validate Trip Inbox, Trip Board, weather, destination tips, activity recommendations, and packing from one ChatGPT MCP connection.

Hints:
- Deployment docs are now in `README.md`.
- `.fastapicloudignore` excludes local learning docs/tests from deployment upload.
- FastAPI Cloud deploys the FastAPI app; MCP HTTP endpoints need to be exposed by your implementation.

Acceptance criteria:
- Remote `/health` returns `healthy`.
- Remote docs page loads.
- Remote `/mcp/travel-agent/` is reachable over public HTTPS.
- ChatGPT Developer Mode renders Trip Inbox and Trip Board widgets with real tool output.
- Secrets are configured in FastAPI Cloud, not committed to files.

### Phase 9: Real Trip Dogfood

- [ ] Create one real trip workspace.
- [ ] Save at least 10 messy travel fragments into Trip Inbox.
- [ ] Move items through `shortlisted`, `booked`, `rejected`, and `needs_review`.
- [ ] Use Trip Board to identify missing pieces.
- [ ] Ask ChatGPT to compare at least two saved options.
- [ ] Generate a draft itinerary from saved board items.
- [ ] Use weather and packing from the same trip context.
- [ ] Log awkward moments and product gaps before adding new features.

Acceptance criteria:

- The product helps preserve real planning state, not just demo data.
- The board stays understandable after 10+ fragments.
- Next feature decisions come from dogfood friction.

## Work Log

### 2026-04-28 - Roadmap Created

**By:** Codex

**Actions:**
- Created a detailed MCP learning todo roadmap.
- Split tasks into student-owned MCP work and assistant-supported boilerplate work.
- Added references to local sprint specs, Kiro requirements, Kiro design examples, and installed MCP SDK decorator examples.

**Learnings:**
- The project already has deployable FastAPI boilerplate.
- The next highest-value step is the Weather MCP vertical slice.

### 2026-04-29 - Phase 1 Completed

**By:** Developer + Codex

**Actions:**
- Confirmed `mcp_servers/__init__.py`, `weather_server.py`, `travel_tips_server.py`, and `packing_server.py` exist.
- Confirmed all three servers use `FastMCP(...)`, separate local ports, and `server.run("streamable-http")`.
- Confirmed all three files are directly runnable via `if __name__ == "__main__":`.
- Ran syntax compilation and API tests.

**Learnings:**
- Local FastAPI uses port `8000`, so MCP servers use `8101`, `8102`, and `8103`.
- Phase 2 can now focus only on fake-data Weather MCP tool/resource/prompt behavior.

### 2026-04-29 - OpenWeather Helper Layer Added

**By:** Codex

**Actions:**
- Added non-MCP OpenWeather helper functions in `mcp_servers/weather_server.py`.
- Added environment lookup for `OPENWEATHER_API_KEY`.
- Added current weather and 5-day forecast fetch helpers.
- Added response normalization, 10-minute in-memory cache, timeout handling, and retry behavior.
- Added tests for weather payload normalization.

**Learnings:**
- MCP tool/resource bodies are still intentionally left for the developer to wire.
- The helper functions to call from MCP tools are `fetch_current_weather(...)` and `fetch_weather_forecast(...)`.

### 2026-04-29 - OpenWeather Layer Refactored

**By:** Developer + Codex

**Actions:**
- Moved OpenWeather HTTP, caching, retry, and normalization code out of `mcp_servers/weather_server.py`.
- Created `services/openweather.py` for non-MCP weather integration logic.
- Kept `mcp_servers/weather_server.py` focused on MCP server setup and tool/resource/prompt wiring.
- Verified the service module loads `.env` directly so it works from MCP tools and standalone checks.

**Learnings:**
- MCP server files should stay thin and protocol-focused.
- Non-MCP integrations belong in importable service modules.

### 2026-04-29 - Phase 2 and 3 Validated

**By:** Developer + Codex

**Actions:**
- Confirmed weather MCP tools are discoverable: `get_current_weather`, `get_forecast`.
- Confirmed `weather://forecast/{city}` resource template is discoverable and readable.
- Confirmed `weather_comparison` prompt is discoverable.
- Confirmed empty city input returns JSON error: `{"error": "city must not be empty"}`.
- Confirmed OpenWeather service integration remains covered by tests.

**Learnings:**
- Weather MCP data path is complete for the current non-UI phase.
- Next phase can move to Packing MCP behavior.

### 2026-04-29 - Phase 4 Completed

**By:** Codex

**Actions:**
- Implemented JSON forecast parsing for `generate_packing_list`.
- Added weather category derivation from forecast high/low temperatures.
- Added rain gear when precipitation probability exceeds 30 percent.
- Added grouped packing output for clothing, toiletries, electronics, documents, and accessories.
- Added focused tests for cold weather, rainy weather, and invalid forecast JSON.
- Validated `generate_packing_list` through MCP on `http://127.0.0.1:8103/mcp`.

**Learnings:**
- Packing server now expects the same forecast JSON shape produced by the weather server.
- MCP Inspector can test the server with `sample_weather_forecast_json(...)` output copied into the `weather_forecast` argument.

### 2026-04-29 - Packing Layer Refactored

**By:** Codex

**Actions:**
- Moved packing business logic out of `mcp_servers/packing_server.py`.
- Created `services/packing.py` for forecast parsing, summary derivation, and packing list construction.
- Updated tests to exercise the service layer directly and the MCP wrapper for JSON error output.
- Restarted and validated packing MCP on `http://127.0.0.1:8103/mcp`.

**Learnings:**
- Packing MCP server now mirrors the weather server structure: thin MCP wrapper plus testable service module.

### 2026-04-29 - Travel Tips Data Enriched

**By:** Codex

**Actions:**
- Created `services/travel_tips.py` for curated destination data and recommendation logic.
- Added 5 destinations: London, Madrid, Paris, Tokyo, and New York.
- Added coordinates, overview, best time, categorized tips, and activity metadata.
- Added activity duration, estimated cost, weather dependency flags, and best-weather matching.
- Updated `mcp_servers/travel_tips_server.py` to stay focused on MCP wiring.
- Validated travel tips and activity recommendations through MCP on `http://127.0.0.1:8102/mcp`.

**Learnings:**
- Travel Tips now follows the same structure as Weather and Packing: MCP wrapper plus service layer.
- Remaining Phase 5 work is mostly reviewing/refining tool behavior and output shape.

### 2026-04-29 - Phase 5 Completed

**By:** Developer + Codex

**Actions:**
- Confirmed `get_destination_tips`, `recommend_activities`, and `destination_briefing` are discoverable through MCP.
- Validated `get_destination_tips` with Paris.
- Validated `recommend_activities` with Madrid and sunny spring conditions.
- Validated `destination_briefing` prompt with Madrid and a 3-day trip.
- Confirmed test suite passes.

**Learnings:**
- MCP prompt arguments are passed as strings by the Python client, even when the prompt function converts them into text.
- Phase 6 can start with client wrappers for weather, packing, and travel tips MCP servers.

### 2026-04-29 - Phase 6 Completed

**By:** Codex

**Actions:**
- Implemented reusable Streamable HTTP MCP client wrapper.
- Added Weather, Travel Tips, and Packing domain clients.
- Wired `/api/v1/travel/plan` to call weather forecast, destination tips, and packing list MCP tools.
- Updated `/health/mcp` to check each MCP server and report healthy/unavailable status.
- Added FastAPI tests with monkeypatched MCP clients.
- Validated partial response when weather MCP was unavailable.
- Validated complete response when all three MCP servers were running.

**Learnings:**
- FastAPI orchestration is now connected end-to-end.
- Phase 7 can focus on MCP Apps UI resources.

### 2026-04-29 - Phase 7 Weather Apps Resource Started

**By:** Developer + Codex

**Actions:**
- Added a first Apps-aware weather dashboard resource at `ui://weather/dashboard-v4.html`.
- Updated `get_current_weather` to advertise the dashboard resource through tool metadata.
- Changed `get_current_weather` to return `CallToolResult` so MCP returns real top-level `structuredContent`.
- Updated the FastAPI MCP client to prefer `result.structuredContent` when present.
- Added resource `_meta` for widget CSP, border preference, and widget description.
- Added `docs/testing_chatgpt_apps.md` to separate MCP protocol testing from widget bridge testing.
- Confirmed the current local preview reports `Bridge unavailable in this preview`, meaning it does not inject `window.openai`.

**Learnings:**
- Returning a plain Python `dict` from FastMCP can be serialized as text content. Use `mcp.types.CallToolResult` when the tool must return top-level `structuredContent`.
- MCP Inspector-style tool calls can prove the server contract, but they do not always prove ChatGPT Apps widget bridge behavior.
- Phase 7 should pause broad widget work until one bridge-aware runtime path is confirmed.

### 2026-04-30 - Office Hours Product Direction

**By:** Developer + gstack `/office-hours`

**Actions:**
- Created the ChatGPT-native Trip Inbox + Trip Board design direction.
- Reframed the first product job from itinerary generation to preserving messy planning work.
- Selected Inbox + Board as the smallest useful wedge.
- Saved the original gstack artifact outside the repo under `~/.gstack/projects/caraseli02-travel-mcp-apps/`.
- Added a repo-tracked copy at `docs/office_hours_trip_inbox_board_2026-04-30.md`.

**Learnings:**
- Capture alone is too weak; board alone misses the messy input problem.
- The durable trip object is the product center.
- ChatGPT should connect to one unified MCP endpoint, not three separate domain-only endpoints.

### 2026-05-03 - Current State Reconciled

**By:** Codex

**Actions:**
- Compared the office-hours design doc, roadmap, README, readiness review, and current code.
- Confirmed the current implementation includes a unified `/mcp/travel-agent/` endpoint, Postgres-backed trip persistence, file-backed smoke testing, Trip Inbox, and Trip Board.
- Updated docs to reflect `48 passed, 1 skipped`.

**Learnings:**
- The next useful work is hosted ChatGPT Developer Mode validation, not another product brainstorm.
- Re-run `/office-hours` only when the product wedge changes materially.
