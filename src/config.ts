export type Settings = {
  environment: string;
  tripStoreBackend: "postgres" | "file";
  tripStoreFilePath: string;
  databaseUrl: string;
  mcpUrl: string;
};

export function getSettings(env: NodeJS.ProcessEnv = process.env): Settings {
  const databaseUrl = [env.DATABASE_URL, env.NEON_DATABASE_URL, env.SUPABASE_DATABASE_URL]
    .map((value) => value?.trim() ?? "")
    .find(Boolean) ?? "";

  const defaultBackend = databaseUrl ? "postgres" : "file";
  const backend = (env.TRIP_STORE_BACKEND ?? defaultBackend).trim().toLowerCase();

  return {
    environment: env.NODE_ENV ?? "development",
    tripStoreBackend: backend === "file" ? "file" : "postgres",
    tripStoreFilePath: env.TRIP_STORE_FILE_PATH ?? "/tmp/travel-mcp-trips.json",
    databaseUrl,
    mcpUrl: env.MCP_URL ?? "http://localhost:3000",
  };
}

