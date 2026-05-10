# Sprint #4 — Travel Tip Planner with Remote MCP Deployment

**Product:** Travel Tip Planner — AI-powered travel recommendations using MCP servers
**Tech Stack:** FastAPI, MCP, OpenWeather API, deployed to FastAPI Cloud
**Goal:** Build a production-ready travel planning service with remote MCP architecture

---

## Product Vision

**Travel Tip Planner** helps users plan trips by combining:
- Real-time weather data
- Destination recommendations
- Packing suggestions
- Activity recommendations based on weather

**User flow:**
1. User provides: origin city, destination city, travel dates
2. System fetches: weather forecast, historical patterns
3. AI generates: packing list, activity suggestions, travel tips
4. User receives: comprehensive travel plan

---

## Architecture

```
┌─────────────────┐
│  Frontend/CLI   │
│   (Client)      │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   FastAPI App   │
│  (Orchestrator) │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────────────────────┐
│     MCP Servers (Remote)        │
├─────────────────────────────────┤
│ 1. Weather MCP Server           │
│    - Current weather            │
│    - Forecast (5-day)           │
│    - Historical data            │
│                                 │
│ 2. Travel Tips MCP Server       │
│    - Destination info           │
│    - Activity recommendations   │
│    - Local tips                 │
│                                 │
│ 3. Packing MCP Server           │
│    - Weather-based packing      │
│    - Trip duration logic        │
│    - Destination-specific items │
└─────────────────────────────────┘
```

---

## Project Structure

```
travel-planner/
├── README.md
├── .env
├── pyproject.toml
│
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app
│   ├── config.py            # Environment config
│   ├── models.py            # Pydantic models
│   └── routers/
│       ├── __init__.py
│       ├── travel.py        # Travel planning endpoints
│       └── health.py        # Health check
│
├── mcp_servers/
│   ├── __init__.py
│   ├── weather_server.py    # Weather MCP server
│   ├── travel_tips_server.py # Travel tips MCP server
│   └── packing_server.py    # Packing MCP server
│
├── mcp_clients/
│   ├── __init__.py
│   ├── base_client.py       # Base MCP client
│   ├── weather_client.py    # Weather MCP client
│   ├── travel_client.py     # Travel tips client
│   └── packing_client.py    # Packing client
│
└── tests/
    ├── __init__.py
    ├── test_api.py
    ├── test_mcp_servers.py
    └── test_integration.py
```

---

## Phase 1: Local Development Setup

### Step 1.1: Create project structure

```bash
mkdir -p travel-planner/{app/routers,mcp_servers,mcp_clients,tests}
cd travel-planner
touch README.md pyproject.toml .env
```

### Step 1.2: Install dependencies

Create or update `pyproject.toml`:
```toml
[project]
name = "travel-mcp-app"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi[standard]>=0.136.1",
    "pydantic-settings>=2.5.0",
    "python-dotenv>=1.0.0",
    "aiohttp>=3.10.0",
    "mcp>=1.1.0",
    "python-multipart>=0.0.9",
]

[tool.fastapi]
entrypoint = "app.main:app"
```

Install:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -e .
```

### Step 1.3: Create FastAPI app skeleton

`app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import travel, health
from app.config import settings

app = FastAPI(
    title="Travel Tip Planner API",
    description="AI-powered travel planning with MCP",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(travel.router, prefix="/api/v1/travel", tags=["travel"])

@app.get("/")
async def root():
    return {
        "message": "Travel Tip Planner API",
        "version": "1.0.0",
        "docs": "/docs"
    }
```

### Step 1.4: Create configuration

`app/config.py`:
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # API Keys
    openweather_api_key: str
    
    # MCP Server URLs (local for dev, remote for prod)
    weather_mcp_url: str = "http://localhost:8000/mcp"
    travel_tips_mcp_url: str = "http://localhost:8001/mcp"
    packing_mcp_url: str = "http://localhost:8002/mcp"
    
    # App settings
    environment: str = "development"
    debug: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Phase 2: Build MCP Servers

### Step 2.1: Weather MCP Server

`mcp_servers/weather_server.py`:
```python
#!/usr/bin/env python3
import os
import json
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from datetime import datetime, timedelta

load_dotenv()

server = FastMCP("travel-weather-server", host="127.0.0.1", port=8000)

# TODO: Add OpenWeather API client (reuse from Sprint #2)

@server.tool(
    name="get_current_weather",
    description="Get current weather for a city"
)
async def get_current_weather(city: str) -> str:
    """Get current weather conditions."""
    # Implementation here
    pass

@server.tool(
    name="get_forecast",
    description="Get 5-day weather forecast for a city"
)
async def get_forecast(city: str, days: int = 5) -> str:
    """Get weather forecast."""
    # Implementation here
    pass

@server.resource(
    "weather://forecast/{city}",
    name="city_forecast",
    description="5-day weather forecast for a city",
    mime_type="application/json"
)
def city_forecast(city: str) -> str:
    """Return forecast as resource."""
    # Implementation here
    pass

@server.prompt(
    name="weather_comparison",
    description="Compare weather between two cities for travel planning"
)
def weather_comparison(origin: str, destination: str, travel_date: str) -> list[dict]:
    return [{
        "role": "user",
        "content": (
            f"Compare weather conditions between {origin} and {destination} "
            f"for travel on {travel_date}. Include temperature differences, "
            f"precipitation chances, and clothing recommendations."
        )
    }]

if __name__ == "__main__":
    server.run("streamable-http")
```

### Step 2.2: Travel Tips MCP Server

`mcp_servers/travel_tips_server.py`:
```python
#!/usr/bin/env python3
from mcp.server.fastmcp import FastMCP

server = FastMCP("travel-tips-server", host="127.0.0.1", port=8001)

# Dummy data for now (replace with real API later)
DESTINATION_DATA = {
    "london": {
        "activities": ["British Museum", "Tower of London", "Thames River Cruise"],
        "tips": ["Bring umbrella", "Use Oyster card", "Book attractions ahead"],
        "best_time": "May-September"
    },
    "madrid": {
        "activities": ["Prado Museum", "Retiro Park", "Tapas tour"],
        "tips": ["Siesta time 2-5pm", "Dinner after 9pm", "Learn basic Spanish"],
        "best_time": "March-May, September-November"
    }
}

@server.tool(
    name="get_destination_tips",
    description="Get travel tips and recommendations for a destination"
)
def get_destination_tips(city: str) -> str:
    """Get destination-specific travel tips."""
    city_key = city.lower()
    if city_key in DESTINATION_DATA:
        data = DESTINATION_DATA[city_key]
        return json.dumps(data, indent=2)
    return json.dumps({"error": f"No data for {city}"})

@server.tool(
    name="recommend_activities",
    description="Recommend activities based on weather and season"
)
def recommend_activities(city: str, weather: str, season: str) -> str:
    """Recommend activities based on conditions."""
    # Implementation here
    pass

@server.prompt(
    name="destination_briefing",
    description="Generate comprehensive destination briefing"
)
def destination_briefing(city: str, duration_days: int) -> list[dict]:
    return [{
        "role": "user",
        "content": (
            f"Create a {duration_days}-day travel briefing for {city}. "
            f"Include must-see attractions, local customs, transportation tips, "
            f"and daily itinerary suggestions."
        )
    }]

if __name__ == "__main__":
    server.run("streamable-http")
```

### Step 2.3: Packing MCP Server

`mcp_servers/packing_server.py`:
```python
#!/usr/bin/env python3
from mcp.server.fastmcp import FastMCP
import json

server = FastMCP("packing-server", host="127.0.0.1", port=8002)

PACKING_TEMPLATES = {
    "cold": ["Heavy coat", "Sweaters", "Thermal underwear", "Gloves", "Scarf"],
    "mild": ["Light jacket", "Long pants", "Comfortable shoes", "Umbrella"],
    "warm": ["T-shirts", "Shorts", "Sunscreen", "Sunglasses", "Hat"],
    "hot": ["Light clothing", "Sandals", "Sunscreen SPF 50+", "Water bottle"]
}

@server.tool(
    name="generate_packing_list",
    description="Generate packing list based on weather and trip duration"
)
def generate_packing_list(
    destination: str,
    duration_days: int,
    weather_forecast: str
) -> str:
    """Generate comprehensive packing list."""
    # Parse weather and determine category
    # Return packing list
    pass

@server.prompt(
    name="packing_advisor",
    description="Get personalized packing advice"
)
def packing_advisor(
    origin: str,
    destination: str,
    duration: int,
    activities: str
) -> list[dict]:
    return [{
        "role": "user",
        "content": (
            f"Create a packing list for a {duration}-day trip from {origin} "
            f"to {destination}. Planned activities: {activities}. "
            f"Consider weather differences and provide specific recommendations."
        )
    }]

if __name__ == "__main__":
    server.run("streamable-http")
```

---

## Phase 3: Build FastAPI Endpoints

### Step 3.1: Travel planning endpoint

`app/routers/travel.py`:
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date

router = APIRouter()

class TravelPlanRequest(BaseModel):
    origin: str
    destination: str
    start_date: date
    end_date: date
    activities: Optional[list[str]] = None

class TravelPlanResponse(BaseModel):
    origin: str
    destination: str
    duration_days: int
    weather_summary: dict
    packing_list: list[str]
    destination_tips: dict
    activities: list[str]

@router.post("/plan", response_model=TravelPlanResponse)
async def create_travel_plan(request: TravelPlanRequest):
    """
    Create comprehensive travel plan by orchestrating MCP servers.
    """
    # TODO: Call MCP servers
    # 1. Get weather forecast for destination
    # 2. Get destination tips
    # 3. Generate packing list
    # 4. Combine into response
    
    return TravelPlanResponse(
        origin=request.origin,
        destination=request.destination,
        duration_days=(request.end_date - request.start_date).days,
        weather_summary={},
        packing_list=[],
        destination_tips={},
        activities=[]
    )

@router.get("/destinations")
async def list_destinations():
    """List available destinations."""
    return {
        "destinations": ["London", "Madrid", "New York", "San Francisco", "Tokyo"]
    }
```

### Step 3.2: Health check endpoint

`app/routers/health.py`:
```python
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "travel-planner-api"
    }

@router.get("/mcp")
async def mcp_health():
    """Check MCP server connectivity."""
    # TODO: Ping each MCP server
    return {
        "weather_server": "healthy",
        "travel_tips_server": "healthy",
        "packing_server": "healthy"
    }
```

---

## Phase 4: Cloud Deployment with FastAPI Cloud

FastAPI Cloud is the chosen deployment target for this learning project.
It can deploy the FastAPI orchestrator and any HTTP MCP endpoints that are exposed from the FastAPI application.

Validated FastAPI Cloud requirements from the current docs:

- A FastAPI app instance, usually named `app`
- `pyproject.toml` or `requirements.txt` in the project root
- `fastapi[standard]` installed so the `fastapi` CLI is available
- Python version specified in `requires-python`
- Standard app location such as `main.py` or `app/main.py`, or `[tool.fastapi] entrypoint = "app.main:app"`
- Environment variables configured through FastAPI Cloud dashboard or `fastapi cloud env`

### Step 4.1: Verify local startup

```bash
fastapi dev
```

If `fastapi dev` works locally without passing a file path, `fastapi deploy` should use the same configuration.

### Step 4.2: Configure secrets

```bash
fastapi login
fastapi deploy

fastapi cloud env set --secret OPENWEATHER_API_KEY "your_key_here"
fastapi deploy
```

Environment variable changes take effect on the next deployment.

### Step 4.3: Validate remote app

```bash
curl https://your-app.fastapicloud.dev/health
open https://your-app.fastapicloud.dev/docs
```

### FastAPI Cloud Fit for MCP Tasks

FastAPI Cloud is suitable for:

- Deploying the FastAPI orchestrator
- Serving `/health`, `/docs`, and travel planning API endpoints
- Reading `OPENWEATHER_API_KEY` securely from environment variables
- Hosting remote HTTP endpoints for MCP once you implement them inside or alongside the FastAPI app
- Viewing deployment logs from the dashboard or CLI

FastAPI Cloud does not remove the need to learn and implement:

- MCP tool/resource/prompt definitions
- Local stdio transport for Claude Desktop-style development
- Remote HTTP MCP protocol endpoints
- MCP Apps UI resources and postMessage behavior

For this learning project, keep MCP-specific work as your implementation area. Boilerplate around FastAPI app setup, config, deployment docs, tests, and health checks can be scaffolded separately.

---

## Phase 5: Testing

### Step 5.1: Local testing

```bash
# Terminal 1: Start weather MCP server
python mcp_servers/weather_server.py

# Terminal 2: Start travel tips MCP server
python mcp_servers/travel_tips_server.py

# Terminal 3: Start packing MCP server
python mcp_servers/packing_server.py

# Terminal 4: Start FastAPI app
fastapi dev

# Terminal 5: Test endpoints
curl http://localhost:8000/health
curl -X POST http://localhost:8000/api/v1/travel/plan \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "New York",
    "destination": "London",
    "start_date": "2026-05-01",
    "end_date": "2026-05-07"
  }'
```

### Step 5.2: Integration tests

`tests/test_integration.py`:
```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_create_travel_plan():
    response = client.post("/api/v1/travel/plan", json={
        "origin": "New York",
        "destination": "London",
        "start_date": "2026-05-01",
        "end_date": "2026-05-07"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["origin"] == "New York"
    assert data["destination"] == "London"
    assert data["duration_days"] == 6
```

---

## Success Criteria

✅ FastAPI app runs locally
✅ All 3 MCP servers run and respond
✅ Travel plan endpoint works end-to-end
✅ Health checks pass
✅ Deployed to FastAPI Cloud
✅ Remote MCP servers accessible
✅ Integration tests pass
✅ API documentation available at /docs

---

## Next Steps After Completion

1. **Add authentication** — API keys or OAuth
2. **Add rate limiting** — Prevent abuse
3. **Add caching** — Redis for MCP responses
4. **Add monitoring** — Sentry, DataDog
5. **Add more destinations** — Expand coverage
6. **Add user preferences** — Save favorite destinations
7. **Add real-time updates** — WebSocket for live weather

---

## Resources

- FastAPI docs: https://fastapi.tiangolo.com/
- FastAPI Cloud docs: https://fastapicloud.com/docs/getting-started/
- MCP spec: https://modelcontextprotocol.io/
- OpenWeather API: https://openweathermap.org/api
