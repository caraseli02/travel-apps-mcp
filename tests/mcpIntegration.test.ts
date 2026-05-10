import { createServer } from "node:net";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";
import { MCPClient } from "mcp-use/client";
import type { MCPServer } from "mcp-use/server";
import { afterEach, describe, expect, it } from "vitest";
import { getSettings } from "@/config";
import { createTravelServer } from "@/server";
import { InMemoryTripStore } from "@/stores/tripStore";
import { resetTripStoreForTests } from "@/tools/travelAgent";

let client: MCPClient | null = null;
let server: MCPServer | null = null;

afterEach(async () => {
  await client?.closeAllSessions();
  await server?.forceClose();
  client = null;
  server = null;
  resetTripStoreForTests(null);
});

describe("MCP integration", () => {
  it("advertises OpenAI-compatible schemas and persists metadata through MCP calls", async () => {
    const port = await getFreePort();
    resetTripStoreForTests(new InMemoryTripStore());
    server = createTravelServer({ ...getSettings(), mcpUrl: `http://localhost:${port}` });
    await server.listen(port);

    client = new MCPClient({
      mcpServers: {
        travel: {
          url: `http://localhost:${port}/mcp`,
        },
      },
    });
    const session = await client.createSession("travel");
    const tools = await session.listTools();
    const createTripTool = requireTool(tools, "create_trip");
    const addItemTool = requireTool(tools, "add_trip_item");
    const inboxTool = requireTool(tools, "list_trip_inbox");
    const renderBoardTool = requireTool(tools, "render_trip_board");
    const itineraryTool = requireTool(tools, "get_trip_itinerary");
    const budgetTool = requireTool(tools, "get_trip_budget");
    const askClarificationTool = requireTool(tools, "ask_trip_clarification");
    const clarificationTool = requireTool(tools, "render_trip_clarification");

    expectRequiredFields(createTripTool, ["title", "destination", "start_date", "end_date"]);
    expectRequiredFields(addItemTool, [
      "trip_id",
      "raw_content",
      "item_type",
      "source_label",
      "title",
      "day_label",
      "date_note",
      "price_note",
      "location_note",
      "notes",
    ]);
    expectNoBooleanRequired(createTripTool.inputSchema);
    expectNoBooleanRequired(addItemTool.inputSchema);
    expect(inboxTool._meta?.["openai/outputTemplate"]).toEqual(expect.stringContaining("trip-inbox"));
    expect(renderBoardTool._meta?.["openai/outputTemplate"]).toEqual(expect.stringContaining("trip-board"));
    expect(itineraryTool._meta?.["openai/outputTemplate"]).toEqual(expect.stringContaining("trip-itinerary"));
    expect(budgetTool._meta?.["openai/outputTemplate"]).toEqual(expect.stringContaining("trip-budget"));
    expect(askClarificationTool._meta?.["openai/outputTemplate"]).toEqual(expect.stringContaining("trip-clarification"));
    expect(clarificationTool._meta?.["openai/outputTemplate"]).toEqual(expect.stringContaining("trip-clarification"));

    const created = await session.callTool("create_trip", {
      title: "Lisbon",
      destination: "Lisbon",
      start_date: "2026-06-10",
      end_date: "2026-06-14",
    });
    const trip = expectStructured(created).trip as { id: string; destination: string; start_date: string };
    expect(trip.destination).toBe("Lisbon");
    expect(trip.start_date).toBe("2026-06-10");

    const added = await session.callTool("add_trip_item", {
      trip_id: trip.id,
      raw_content: "Pastéis de Belém tasting, EUR 12/person",
      item_type: "activity",
      source_label: "User note",
      title: "Pastéis de Belém",
      day_label: "Day 2 afternoon",
      date_note: "June 11",
      price_note: "EUR 12/person",
      location_note: "Belém",
      notes: "Book after monastery visit",
    });
    const item = expectStructured(added).item as {
      id: string;
      item_type: string;
      title: string;
      day_label: string;
      price_note: string;
      notes: string;
    };
    expect(item).toMatchObject({
      item_type: "activity",
      title: "Pastéis de Belém",
      day_label: "Day 2 afternoon",
      price_note: "EUR 12/person",
      notes: "Book after monastery visit",
    });

    const updated = await session.callTool("update_trip_item_status", {
      item_id: item.id,
      status: "shortlisted",
      day_label: "Day 2 late afternoon",
      notes: "Check opening hours",
    });
    expect((expectStructured(updated).item as { status: string; day_label: string; notes: string })).toMatchObject({
      status: "shortlisted",
      day_label: "Day 2 late afternoon",
      notes: "Check opening hours",
    });

    const board = await session.callTool("render_trip_board", { trip_id: trip.id });
    const structuredBoard = expectStructured(board) as { trip: { title: string }; lanes: { shortlisted: unknown[] } };
    expect(structuredBoard.trip.title).toBe("Lisbon");
    expect(structuredBoard.lanes.shortlisted).toHaveLength(1);
    expect(board.content[0]).toMatchObject({ type: "text", text: "Rendered trip board for Lisbon." });

    const itinerary = await session.callTool("get_trip_itinerary", { trip_id: trip.id });
    const structuredItinerary = expectStructured(itinerary) as { days: Array<{ label: string; items: Array<{ id: string }> }> };
    expect(structuredItinerary.days[0]).toMatchObject({ label: "Day 2", items: [{ id: item.id }] });
    expect(itinerary.content[0]).toMatchObject({ type: "text", text: "Showing day-by-day itinerary for Lisbon." });

    const budget = await session.callTool("get_trip_budget", { trip_id: trip.id });
    const structuredBudget = expectStructured(budget) as { spent: number; rows: Array<{ id: string; amount: number }> };
    expect(structuredBudget).toMatchObject({ spent: 12, rows: [{ id: item.id, amount: 12 }] });
    expect(budget.content[0]).toMatchObject({ type: "text", text: "Showing spending tracker for Lisbon." });

    const clarification = await session.callTool("render_trip_clarification", {
      utterance: "I want to book hotel in Lisbon",
      intent: "",
      destination: "",
      trip_id: trip.id,
      known_fields_json: "{}",
    });
    const structuredClarification = expectStructured(clarification) as {
      intent: string;
      destination: string;
      questions: Array<{ id: string }>;
    };
    expect(structuredClarification.intent).toBe("book_hotel");
    expect(structuredClarification.destination).toBe("Lisbon");
    expect(structuredClarification.questions.map((question) => question.id)).toEqual(["hotel_area", "hotel_budget"]);
  }, 30_000);
});

function requireTool(tools: Tool[], name: string): Tool {
  const tool = tools.find((candidate) => candidate.name === name);
  if (!tool) throw new Error(`Missing MCP tool: ${name}`);
  return tool;
}

function expectRequiredFields(tool: Tool, fields: string[]): void {
  expect(tool.inputSchema.required).toEqual(expect.arrayContaining(fields));
}

function expectNoBooleanRequired(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if ("required" in value) {
    expect(Array.isArray((value as { required?: unknown }).required)).toBe(true);
  }
  for (const child of Object.values(value)) {
    expectNoBooleanRequired(child);
  }
}

function expectStructured(result: CallToolResult): Record<string, unknown> {
  expect(result.isError).not.toBe(true);
  expect(result.structuredContent).toBeTypeOf("object");
  return result.structuredContent as Record<string, unknown>;
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const listener = createServer();
    listener.once("error", reject);
    listener.listen(0, () => {
      const address = listener.address();
      if (typeof address !== "object" || address == null) {
        listener.close(() => reject(new Error("Could not allocate free TCP port.")));
        return;
      }
      listener.close(() => resolve(address.port));
    });
  });
}
