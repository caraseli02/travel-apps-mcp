import { MCPServer } from "mcp-use/server";
import { getSettings, type Settings } from "@/config";
import { registerTravelAgentTools } from "@/tools/travelAgent";

export function createTravelServer(settings: Settings = getSettings()): MCPServer {
  const server = new MCPServer({
    name: "travel-agent-server",
    title: "Travel MCP App",
    version: "0.1.0",
    description: "Persisted trip workspace tools and widgets for ChatGPT Apps.",
    baseUrl: settings.mcpUrl,
    websiteUrl: "https://github.com/EveryInc/travel-mcp-app",
  });

  registerTravelAgentTools(server);
  return server;
}
