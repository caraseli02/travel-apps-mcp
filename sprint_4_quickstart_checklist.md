# Sprint #4 Quick Start Checklist

**Goal:** Build and deploy Travel Tip Planner to FastAPI Cloud

---

## Pre-flight Checklist

- [ ] Read `docs/sprint_4_travel_planner_prompt.md` (full guide)
- [ ] Have OpenWeather API key ready (from Sprint #2)
- [ ] Create or confirm FastAPI Cloud account
- [ ] Confirm `fastapi` CLI is available from `fastapi[standard]`

---

## Phase 1: Setup (15 min)

- [ ] Create new folder: `mkdir travel-planner && cd travel-planner`
- [ ] Create project structure (see prompt)
- [ ] Use `pyproject.toml` for dependencies (`fastapi[standard]` is required by FastAPI Cloud)
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate venv: `source venv/bin/activate`
- [ ] Install project: `pip install -e .`
- [ ] Create `.env` file with API keys

---

## Phase 2: Build MCP Servers (30 min)

- [ ] Create `mcp_servers/weather_server.py`
  - [ ] Copy weather API client from Sprint #2
  - [ ] Add `get_current_weather` tool
  - [ ] Add `get_forecast` tool
  - [ ] Add `city_forecast` resource
  - [ ] Add `weather_comparison` prompt
  - [ ] Test: `python mcp_servers/weather_server.py`

- [ ] Create `mcp_servers/travel_tips_server.py`
  - [ ] Add destination data
  - [ ] Add `get_destination_tips` tool
  - [ ] Add `recommend_activities` tool
  - [ ] Add `destination_briefing` prompt
  - [ ] Test: `python mcp_servers/travel_tips_server.py`

- [ ] Create `mcp_servers/packing_server.py`
  - [ ] Add packing templates
  - [ ] Add `generate_packing_list` tool
  - [ ] Add `packing_advisor` prompt
  - [ ] Test: `python mcp_servers/packing_server.py`

---

## Phase 3: Build FastAPI App (30 min)

- [ ] Create `app/config.py` (settings)
- [ ] Create `app/models.py` (Pydantic models)
- [ ] Create `app/routers/health.py` (health checks)
- [ ] Create `app/routers/travel.py` (travel endpoints)
- [ ] Create `app/main.py` (FastAPI app)
- [ ] Add `[tool.fastapi] entrypoint = "app.main:app"` to `pyproject.toml`
- [ ] Test locally: `fastapi dev`
- [ ] Visit: http://localhost:8000/docs
- [ ] Test health endpoint: `curl http://localhost:8000/health`

---

## Phase 4: Connect MCP Clients (30 min)

- [ ] Create `mcp_clients/base_client.py`
- [ ] Create `mcp_clients/weather_client.py`
- [ ] Create `mcp_clients/travel_client.py`
- [ ] Create `mcp_clients/packing_client.py`
- [ ] Wire clients into FastAPI endpoints
- [ ] Test end-to-end travel plan creation

---

## Phase 5: Deploy to FastAPI Cloud (30 min)

- [ ] Verify local startup works: `fastapi dev`
- [ ] Login: `fastapi login`
- [ ] First deploy or link app: `fastapi deploy`
- [ ] Set OpenWeather key as a secret: `fastapi cloud env set --secret OPENWEATHER_API_KEY "..."`
- [ ] Redeploy so env vars are available: `fastapi deploy`
- [ ] View logs in dashboard or CLI
- [ ] Test remote health endpoint: `curl https://your-app.fastapicloud.dev/health`
- [ ] Visit remote API docs: `https://your-app.fastapicloud.dev/docs`
- [ ] Confirm remote MCP HTTP endpoints are reachable after you implement them

---

## Phase 6: Testing (15 min)

- [ ] Create `tests/test_api.py`
- [ ] Create `tests/test_mcp_servers.py`
- [ ] Create `tests/test_integration.py`
- [ ] Run tests: `pytest tests/`
- [ ] All tests pass ✅

---

## Phase 7: Documentation (15 min)

- [ ] Update `README.md` with:
  - [ ] Project description
  - [ ] Setup instructions
  - [ ] API endpoints
  - [ ] Deployment instructions
  - [ ] Example requests/responses
- [ ] Add API examples to `/docs` endpoint
- [ ] Create `ARCHITECTURE.md` (optional)

---

## Success Criteria

✅ All 3 MCP servers running
✅ FastAPI app running locally
✅ Travel plan endpoint works
✅ Deployed to FastAPI Cloud
✅ Remote endpoints accessible
✅ Tests passing
✅ Documentation complete

---

## Troubleshooting

**MCP server won't start**
- Check port not already in use: `lsof -i :8000`
- Check environment variables loaded
- Check imports are correct

**FastAPI app can't connect to MCP servers**
- Verify MCP server URLs in config
- Check MCP servers are running
- Test with curl: `curl http://localhost:8000/mcp`

**Deployment fails**
- Verify `fastapi dev` runs locally
- Verify dependencies are listed in `pyproject.toml`
- Verify `[tool.fastapi] entrypoint = "app.main:app"` if using `app/main.py`
- Check `OPENWEATHER_API_KEY` is set in FastAPI Cloud as a secret
- Review FastAPI Cloud deployment logs

**SSL certificate errors**
- Use SSL bypass from Sprint #2 (development only)
- For production, configure proper certificates

---

## Time Estimate

- **Total:** ~3 hours
- **Setup:** 15 min
- **MCP Servers:** 30 min
- **FastAPI App:** 30 min
- **MCP Clients:** 30 min
- **Deployment:** 30 min
- **Testing:** 15 min
- **Documentation:** 15 min
- **Buffer:** 15 min

---

## What You'll Learn

✅ Building production FastAPI apps
✅ Orchestrating multiple MCP servers
✅ Cloud deployment with FastAPI Cloud
✅ Remote MCP architecture
✅ API design and documentation
✅ Integration testing
✅ Environment configuration
✅ FastAPI Cloud environment configuration and logs

---

## Next: Start Building!

1. Create the folder: `mkdir travel-planner && cd travel-planner`
2. Follow Phase 1 checklist
3. Work through each phase sequentially
4. Test after each phase
5. Deploy to FastAPI Cloud when local testing passes

Good luck! 🚀
