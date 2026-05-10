import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { type MCPServer, object, text, widget } from "mcp-use/server";
import { z } from "zod";
import { getSettings } from "@/config";
import {
  buildClarificationSession,
  summarizeClarification,
  type ClarificationSession,
} from "@/domain/clarification";
import {
  buildBoard,
  buildBudget,
  buildItinerary,
  summarizeItems,
  TripConfigError,
  TripNotFoundError,
  TripStoreError,
  TripValidationError,
} from "@/domain/trips";
import { FileTripStore, PostgresTripStore, type TripStore } from "@/stores/tripStore";

let store: TripStore | null = null;

export function resetTripStoreForTests(nextStore: TripStore | null): void {
  store = nextStore;
}

export function getTripStore(): TripStore {
  if (store) return store;
  const settings = getSettings();
  if (settings.tripStoreBackend === "file") {
    store = new FileTripStore(settings.tripStoreFilePath);
  } else {
    store = new PostgresTripStore(settings.databaseUrl);
  }
  return store;
}

const READ_ONLY: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const MUTATION: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
};

const createTripSchema = z.object({
  title: z.string().describe("Short name for the saved trip workspace"),
  destination: z.string().describe("Primary destination for the trip. Use an empty string if unknown."),
  start_date: z.string().describe("Trip start date or date note. Use an empty string if unknown."),
  end_date: z.string().describe("Trip end date or date note. Use an empty string if unknown."),
});

const addTripItemSchema = z.object({
  trip_id: z.string().describe("Saved trip workspace id"),
  raw_content: z.string().describe("Raw travel fragment, link text, decision note, or booking detail to save"),
  item_type: z
    .string()
    .describe("One of flight, transport, hotel, restaurant, activity, document, note, question, or constraint. Use an empty string to infer it."),
  source_label: z.string().describe("Human-readable source name for the fragment. Use an empty string if unknown."),
  title: z.string().describe("Short display title for the item. Use an empty string if unknown."),
  day_label: z.string().describe("Itinerary day or timing label. Use an empty string if unscheduled."),
  date_note: z.string().describe("Date or time note for the item. Use an empty string if unknown."),
  price_note: z.string().describe("Price, fare, or cost note for the item. Use an empty string if unknown."),
  location_note: z.string().describe("Neighborhood, address, airport, or location note. Use an empty string if unknown."),
  notes: z.string().describe("Additional user notes or decision context. Use an empty string if none."),
});

const tripIdSchema = z.object({
  trip_id: z.string().describe("Saved trip workspace id"),
});

const updateStatusSchema = z.object({
  item_id: z.string().describe("Saved trip item id"),
  status: z.string().describe("New item status: inbox, shortlisted, booked, rejected, or needs_review"),
  day_label: z.string().describe("Updated itinerary day or timing label. Use an empty string to keep the existing value."),
  notes: z.string().describe("Updated notes or decision context. Use an empty string to keep the existing value."),
});

const prepareClarificationSchema = z.object({
  utterance: z.string().describe("The user's original travel planning or booking request"),
  intent: z.string().describe("One of plan_trip, book_hotel, or book_flight. Use an empty string to infer from utterance."),
  destination: z.string().describe("Primary destination from the user's request. Use an empty string if unknown."),
  trip_id: z.string().describe("Existing saved trip workspace id. Use an empty string if there is no existing trip."),
  known_fields_json: z
    .string()
    .describe("JSON object of model-known facts from conversation or memory, such as duration, dates, party_size, budget, origin, interests. Use {} if none."),
});

const renderClarificationSchema = prepareClarificationSchema;

const submitClarificationSchema = z.object({
  session_json: z.string().describe("JSON object returned by prepare_trip_clarification or rendered in the trip clarification widget"),
  answers_json: z.string().describe("JSON object mapping question ids to selected answers, arrays of selected answers, free text, or skipped"),
});

type CreateTripInput = Omit<z.infer<typeof createTripSchema>, "destination" | "start_date" | "end_date"> & {
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

type AddTripItemToolInput = Omit<
  z.infer<typeof addTripItemSchema>,
  "item_type" | "source_label" | "title" | "day_label" | "date_note" | "price_note" | "location_note" | "notes"
> & {
  item_type?: string | null;
  source_label?: string | null;
  title?: string | null;
  day_label?: string | null;
  date_note?: string | null;
  price_note?: string | null;
  location_note?: string | null;
  notes?: string | null;
};

type UpdateStatusInput = Omit<z.infer<typeof updateStatusSchema>, "day_label" | "notes"> & {
  day_label?: string | null;
  notes?: string | null;
};

type PrepareClarificationToolInput = Omit<z.infer<typeof prepareClarificationSchema>, "intent" | "destination" | "trip_id" | "known_fields_json"> & {
  intent?: string | null;
  destination?: string | null;
  trip_id?: string | null;
  known_fields_json?: string | null;
};

type SubmitClarificationToolInput = z.infer<typeof submitClarificationSchema>;

export function registerTravelAgentTools(server: MCPServer): void {
  server.tool(
    {
      name: "create_trip",
      title: "Create trip workspace",
      description:
        "Use this only after the user has confirmed they want a saved trip workspace or after clarification answers are collected. Do not use this as the first action for vague requests like 'I want to plan a trip to X', 'I want to book hotel in X', or 'I want to book fly to X'; use ask_trip_clarification for those first.",
      schema: createTripSchema,
      annotations: MUTATION,
      _meta: statusMeta("Creating trip workspace", "Created trip workspace"),
    },
    createTrip
  );

  server.tool(
    {
      name: "add_trip_item",
      title: "Save trip item",
      description:
        "Use this when the user wants to save a found hotel, flight, restaurant, activity, note, constraint, or booking fragment to a trip workspace inbox. Duplicate fragments are detected by normalized content.",
      schema: addTripItemSchema,
      annotations: { ...MUTATION, idempotentHint: true },
      _meta: statusMeta("Saving trip item", "Saved trip item"),
    },
    addTripItem
  );

  server.tool(
    {
      name: "list_trip_inbox",
      title: "Show trip inbox",
      description: "Use this when the user wants to review saved trip fragments that still need triage or a next decision.",
      schema: tripIdSchema,
      annotations: READ_ONLY,
      widget: { name: "trip-inbox", invoking: "Loading trip inbox", invoked: "Loaded trip inbox" },
    },
    listTripInbox
  );

  server.tool(
    {
      name: "update_trip_item_status",
      title: "Update trip item status",
      description:
        "Use this when the user decides what to do with a saved trip item: keep it in the inbox, shortlist it, mark it booked, reject it, or flag it for review.",
      schema: updateStatusSchema,
      annotations: MUTATION,
      _meta: statusMeta("Updating trip item", "Updated trip item"),
    },
    updateTripItemStatus
  );

  server.tool(
    {
      name: "get_trip_board",
      title: "Get trip board data",
      description:
        "Use this to fetch the current trip decision state grouped into inbox, shortlist, booked items, itinerary draft, and missing planning pieces.",
      schema: tripIdSchema,
      annotations: READ_ONLY,
      _meta: statusMeta("Fetching trip board", "Fetched trip board"),
    },
    getTripBoard
  );

  server.tool(
    {
      name: "render_trip_board",
      title: "Render trip board",
      description:
        "Use this after fetching or changing trip state when the user asks to see a visual trip board of decisions, shortlist, booked items, itinerary draft, and missing pieces.",
      schema: tripIdSchema,
      annotations: READ_ONLY,
      widget: { name: "trip-board", invoking: "Rendering trip board", invoked: "Rendered trip board" },
    },
    renderTripBoard
  );

  server.tool(
    {
      name: "get_trip_itinerary",
      title: "Show trip itinerary",
      description: "Use this when the user wants to see scheduled or day-labeled trip items as a day-by-day itinerary.",
      schema: tripIdSchema,
      annotations: READ_ONLY,
      widget: { name: "trip-itinerary", invoking: "Loading trip itinerary", invoked: "Loaded trip itinerary" },
    },
    getTripItinerary
  );

  server.tool(
    {
      name: "get_trip_budget",
      title: "Show trip budget",
      description:
        "Use this when the user wants tracked trip spending, extracted prices, party or night multipliers, and any saved budget target.",
      schema: tripIdSchema,
      annotations: READ_ONLY,
      widget: { name: "trip-budget", invoking: "Loading trip budget", invoked: "Loaded trip budget" },
    },
    getTripBudget
  );

  server.tool(
    {
      name: "get_trip_summary",
      title: "Summarize trip state",
      description: "Use this when the user wants a concise natural-language summary of saved trip state, item counts, and missing planning pieces.",
      schema: tripIdSchema,
      annotations: READ_ONLY,
      _meta: statusMeta("Summarizing trip", "Summarized trip"),
    },
    getTripSummary
  );

  server.tool(
    {
      name: "prepare_trip_clarification",
      title: "Prepare trip clarification questions",
      description:
        "Use this when the user gives an underspecified travel request such as planning a trip, booking a hotel, or booking a flight and a few structured follow-up questions would help. Returns reusable structured question data without rendering UI.",
      schema: prepareClarificationSchema,
      annotations: READ_ONLY,
      _meta: statusMeta("Preparing trip questions", "Prepared trip questions"),
    },
    prepareTripClarification
  );

  server.tool(
    {
      name: "ask_trip_clarification",
      title: "Ask trip clarification questions",
      description:
        "Use this as the first action for simple underspecified travel requests: 'I want to plan a trip to X', 'I want to book hotel in X', or 'I want to book fly to X'. This renders the interactive question widget instead of creating a trip immediately.",
      schema: renderClarificationSchema,
      annotations: READ_ONLY,
      widget: { name: "trip-clarification", invoking: "Opening trip questions", invoked: "Opened trip questions" },
    },
    renderTripClarification
  );

  server.tool(
    {
      name: "render_trip_clarification",
      title: "Render trip clarification widget",
      description:
        "Use this to render the compact interactive clarification widget when question data should be shown visually. For first-turn simple travel requests, prefer ask_trip_clarification.",
      schema: renderClarificationSchema,
      annotations: READ_ONLY,
      widget: { name: "trip-clarification", invoking: "Opening trip questions", invoked: "Opened trip questions" },
    },
    renderTripClarification
  );

  server.tool(
    {
      name: "submit_trip_clarification",
      title: "Submit trip clarification answers",
      description:
        "Use this after the user answers trip clarification questions. It summarizes selected answers and recommends whether to create a trip, save hotel constraints, save flight constraints, or ask a text follow-up.",
      schema: submitClarificationSchema,
      annotations: MUTATION,
      _meta: statusMeta("Saving trip answers", "Saved trip answers"),
    },
    submitTripClarification
  );
}

export async function createTrip(input: CreateTripInput): Promise<CallToolResult> {
  return runTripTool(async () => {
    const trip = await getTripStore().createTrip(input.title, emptyToNull(input.destination), emptyToNull(input.start_date), emptyToNull(input.end_date));
    return withText(object({ trip }), `Created trip workspace: ${trip.title}.`);
  });
}

export async function addTripItem(input: AddTripItemToolInput): Promise<CallToolResult> {
  return runTripTool(async () => {
    const tripStore = getTripStore();
    const [item, deduped] = await tripStore.addItem({
      trip_id: input.trip_id,
      raw_content: input.raw_content,
      item_type: emptyToNull(input.item_type),
      source_label: emptyToNull(input.source_label),
      title: emptyToNull(input.title),
      day_label: emptyToNull(input.day_label),
      date_note: emptyToNull(input.date_note),
      price_note: emptyToNull(input.price_note),
      location_note: emptyToNull(input.location_note),
      notes: emptyToNull(input.notes),
    });
    const inbox = await tripStore.listItems(input.trip_id, "inbox");
    const trip = await tripStore.getTrip(input.trip_id);
    return withText(
      object({ trip, item, items: inbox, deduped }),
      deduped ? "That fragment was already in the trip inbox." : "Saved the fragment to the trip inbox."
    );
  });
}

export async function listTripInbox(input: z.infer<typeof tripIdSchema>): Promise<CallToolResult> {
  return runTripTool(async () => {
    const tripStore = getTripStore();
    const trip = await tripStore.getTrip(input.trip_id);
    const items = await tripStore.listItems(input.trip_id, "inbox");
    return widget({
      props: { trip, items },
      output: text(`Showing ${items.length} inbox item(s) for ${trip.title}.`),
    });
  });
}

export async function updateTripItemStatus(input: UpdateStatusInput): Promise<CallToolResult> {
  return runTripTool(async () => {
    const item = await getTripStore().updateItemStatus(input.item_id, input.status, emptyToNull(input.day_label), emptyToNull(input.notes));
    return withText(object({ item }), `Moved item to ${item.status}.`);
  });
}

export async function getTripBoard(input: z.infer<typeof tripIdSchema>): Promise<CallToolResult> {
  return runTripTool(async () => {
    const tripStore = getTripStore();
    const trip = await tripStore.getTrip(input.trip_id);
    const board = buildBoard(trip, await tripStore.listItems(input.trip_id));
    return withText(object(board), `Showing trip board for ${trip.title}.`);
  });
}

export async function renderTripBoard(input: z.infer<typeof tripIdSchema>): Promise<CallToolResult> {
  return runTripTool(async () => {
    const tripStore = getTripStore();
    const trip = await tripStore.getTrip(input.trip_id);
    const board = buildBoard(trip, await tripStore.listItems(input.trip_id));
    return widget({
      props: board,
      output: text(`Rendered trip board for ${trip.title}.`),
    });
  });
}

export async function getTripItinerary(input: z.infer<typeof tripIdSchema>): Promise<CallToolResult> {
  return runTripTool(async () => {
    const tripStore = getTripStore();
    const trip = await tripStore.getTrip(input.trip_id);
    const itinerary = buildItinerary(trip, await tripStore.listItems(input.trip_id));
    return widget({
      props: itinerary,
      output: text(`Showing day-by-day itinerary for ${trip.title}.`),
    });
  });
}

export async function getTripBudget(input: z.infer<typeof tripIdSchema>): Promise<CallToolResult> {
  return runTripTool(async () => {
    const tripStore = getTripStore();
    const trip = await tripStore.getTrip(input.trip_id);
    const budget = buildBudget(trip, await tripStore.listItems(input.trip_id));
    return widget({
      props: budget,
      output: text(`Showing spending tracker for ${trip.title}.`),
    });
  });
}

export async function getTripSummary(input: z.infer<typeof tripIdSchema>): Promise<CallToolResult> {
  return runTripTool(async () => {
    const tripStore = getTripStore();
    const trip = await tripStore.getTrip(input.trip_id);
    const items = await tripStore.listItems(input.trip_id);
    const board = buildBoard(trip, items);
    const counts = summarizeItems(items);
    const missing_pieces = board.lanes.missing_pieces;
    return withText(
      object({ trip, counts, missing_pieces }),
      `${trip.title} has ${counts.total} saved item(s). Missing pieces: ${missing_pieces.length}.`
    );
  });
}

export async function prepareTripClarification(input: PrepareClarificationToolInput): Promise<CallToolResult> {
  return runTripTool(async () => {
    const session = await buildSessionFromToolInput(input);
    return withText(object(session), `Prepared ${session.total_questions} clarification question(s).`);
  });
}

export async function renderTripClarification(input: PrepareClarificationToolInput): Promise<CallToolResult> {
  return runTripTool(async () => {
    const session = await buildSessionFromToolInput(input);
    return widget({
      props: session,
      output: text(`Opened ${session.total_questions} clarification question(s) for ${session.destination ?? "the trip"}.`),
    });
  });
}

export async function submitTripClarification(input: SubmitClarificationToolInput): Promise<CallToolResult> {
  return runTripTool(async () => {
    const session = parseJsonObject<ClarificationSession>(input.session_json, "session_json");
    const answers = parseJsonObject<Record<string, unknown>>(input.answers_json, "answers_json");
    const result = summarizeClarification(session, answers);
    return closeWidget(withText(object(result), result.summary));
  });
}

function statusMeta(invoking: string, invoked: string): Record<string, string> {
  return {
    "openai/toolInvocation/invoking": invoking,
    "openai/toolInvocation/invoked": invoked,
  };
}

async function runTripTool(action: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await action();
  } catch (error) {
    if (
      error instanceof TripConfigError ||
      error instanceof TripValidationError ||
      error instanceof TripNotFoundError ||
      error instanceof TripStoreError
    ) {
      return toolError(error.message);
    }
    return toolError(`Trip persistence failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function buildSessionFromToolInput(input: PrepareClarificationToolInput): Promise<ClarificationSession> {
  const tripId = emptyToNull(input.trip_id);
  const known_fields = parseJsonObject<Record<string, unknown>>(input.known_fields_json || "{}", "known_fields_json");
  if (!tripId) {
    return buildClarificationSession({
      utterance: input.utterance,
      intent: emptyToNull(input.intent),
      destination: emptyToNull(input.destination),
      known_fields,
    });
  }

  const tripStore = getTripStore();
  const trip = await tripStore.getTrip(tripId);
  const items = await tripStore.listItems(tripId);
  return buildClarificationSession({
    utterance: input.utterance,
    intent: emptyToNull(input.intent),
    destination: emptyToNull(input.destination),
    known_fields,
    trip,
    items,
  });
}

function parseJsonObject<T extends Record<string, unknown>>(value: string, fieldName: string): T {
  try {
    const parsed = JSON.parse(value || "{}") as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TripValidationError(`${fieldName} must be a JSON object.`);
    }
    return parsed as T;
  } catch (error) {
    if (error instanceof TripValidationError) throw error;
    throw new TripValidationError(`${fieldName} must be valid JSON.`);
  }
}

function toolError(message: string): CallToolResult {
  return {
    structuredContent: { error: message },
    content: [{ type: "text", text: message }],
    _meta: {},
    isError: true,
  };
}

function withText(result: CallToolResult, message: string): CallToolResult {
  return {
    ...result,
    content: [{ type: "text", text: message }],
  };
}

function closeWidget(result: CallToolResult): CallToolResult {
  return {
    ...result,
    _meta: {
      ...result._meta,
      "openai/closeWidget": true,
    },
  };
}

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
