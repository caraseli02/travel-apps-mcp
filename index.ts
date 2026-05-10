import { createTravelServer } from "@/server";

export const server = createTravelServer();

server.listen().then(() => {
  console.log("Travel MCP app running");
});
