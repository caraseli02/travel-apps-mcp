import type { Trip, TripItem } from "@/domain/trips";

export const CLARIFICATION_INTENTS = ["plan_trip", "book_hotel", "book_flight"] as const;

export type ClarificationIntent = (typeof CLARIFICATION_INTENTS)[number];

export type ClarificationOption = {
  id: string;
  label: string;
  value: string;
  metadata?: Record<string, unknown>;
};

export type ClarificationQuestion = {
  id: string;
  prompt: string;
  reason?: string;
  required: boolean;
  answer_type: "single_choice" | "multi_choice" | "free_text";
  options: ClarificationOption[];
  allow_free_text: boolean;
  allow_skip: boolean;
};

export type ClarificationSession = {
  session_id: string;
  intent: ClarificationIntent;
  destination: string | null;
  current_index: number;
  total_questions: number;
  known_fields: Record<string, unknown>;
  questions: ClarificationQuestion[];
  answers: Record<string, unknown>;
};

export type PrepareClarificationInput = {
  utterance: string;
  intent?: string | null;
  destination?: string | null;
  known_fields?: Record<string, unknown>;
  trip?: Trip | null;
  items?: TripItem[];
};

export type SubmittedClarification = {
  session: ClarificationSession;
  resolved_fields: Record<string, unknown>;
  remaining_fields: string[];
  recommended_next_action: "create_trip" | "save_constraints" | "save_hotel_request" | "save_flight_request" | "ask_followup_text";
  summary: string;
};

export function buildClarificationSession(input: PrepareClarificationInput): ClarificationSession {
  const intent = normalizeIntent(input.intent, input.utterance);
  const destination = clean(input.destination) ?? input.trip?.destination ?? inferDestination(input.utterance);
  const knownFields = compactRecord({
    ...(input.known_fields ?? {}),
    destination,
    start_date: input.trip?.start_date,
    end_date: input.trip?.end_date,
    has_hotel: input.items?.some((item) => item.item_type === "hotel") || undefined,
    has_transport: input.items?.some((item) => item.item_type === "flight" || item.item_type === "transport") || undefined,
  });
  const questions = questionsFor(intent, knownFields).slice(0, 5);

  return {
    session_id: `clarify-${intent}-${slug(destination ?? "trip")}`,
    intent,
    destination,
    current_index: 0,
    total_questions: questions.length,
    known_fields: knownFields,
    questions,
    answers: {},
  };
}

export function summarizeClarification(session: ClarificationSession, answers: Record<string, unknown>): SubmittedClarification {
  const resolvedFields: Record<string, unknown> = {};
  const remainingFields: string[] = [];

  for (const question of session.questions) {
    const answer = answers[question.id];
    if (answer == null || answer === "" || answer === "skipped" || (Array.isArray(answer) && answer.length === 0)) {
      if (question.required) remainingFields.push(question.id);
      continue;
    }
    resolvedFields[question.id] = answer;
  }

  const recommended_next_action = nextAction(session.intent, remainingFields);
  const summary = answerSummary(session, resolvedFields, remainingFields);

  return {
    session: { ...session, answers },
    resolved_fields: resolvedFields,
    remaining_fields: remainingFields,
    recommended_next_action,
    summary,
  };
}

function questionsFor(intent: ClarificationIntent, knownFields: Record<string, unknown>): ClarificationQuestion[] {
  if (intent === "book_hotel") return hotelQuestions(knownFields);
  if (intent === "book_flight") return flightQuestions(knownFields);
  return tripQuestions(knownFields);
}

function tripQuestions(knownFields: Record<string, unknown>): ClarificationQuestion[] {
  const questions: Array<ClarificationQuestion | null> = [
    hasAny(knownFields, ["duration", "start_date", "end_date"]) ? null : {
      id: "duration",
      prompt: `How long are you planning to stay${destinationSuffix(knownFields)}?`,
      reason: "This helps shape the itinerary pace and how much to fit in.",
      required: false,
      answer_type: "single_choice",
      options: options("duration", ["1-2 days", "3-4 days", "5-7 days", "1+ weeks"]),
      allow_free_text: true,
      allow_skip: true,
    },
    hasAny(knownFields, ["travel_style", "interests"]) ? null : {
      id: "travel_style",
      prompt: "What's your main travel style?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "travel-style-1", label: "Cultural & sightseeing", value: "culture" },
        { id: "travel-style-2", label: "Food & local experiences", value: "food" },
        { id: "travel-style-3", label: "Relaxation & photography", value: "relaxed" },
        { id: "travel-style-4", label: "Mixed experience", value: "mixed" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
    hasAny(knownFields, ["season", "start_date"]) ? null : {
      id: "timing",
      prompt: "When are you thinking of going?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "timing-1", label: "Summer (peak season)", value: "summer" },
        { id: "timing-2", label: "Spring/Fall (shoulder)", value: "shoulder" },
        { id: "timing-3", label: "Winter (quiet)", value: "winter" },
        { id: "timing-4", label: "No preference yet", value: "no preference" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
  ];
  return questions.filter(isQuestion);
}

function hotelQuestions(knownFields: Record<string, unknown>): ClarificationQuestion[] {
  const questions: Array<ClarificationQuestion | null> = [
    hasAny(knownFields, ["hotel_dates", "start_date", "end_date", "nights"]) ? null : {
      id: "hotel_dates",
      prompt: "When do you need the hotel?",
      reason: "Dates or nights determine availability and realistic pricing.",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "hotel-dates-1", label: "I know exact dates", value: "exact dates" },
        { id: "hotel-dates-2", label: "A weekend", value: "weekend" },
        { id: "hotel-dates-3", label: "3-4 nights", value: "3-4 nights" },
        { id: "hotel-dates-4", label: "Still flexible", value: "flexible" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
    hasAny(knownFields, ["hotel_area", "area", "neighborhood"]) ? null : {
      id: "hotel_area",
      prompt: "Which area would you prefer?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "hotel-area-1", label: "Central and walkable", value: "central" },
        { id: "hotel-area-2", label: "Quiet residential", value: "quiet" },
        { id: "hotel-area-3", label: "Near nightlife/restaurants", value: "nightlife" },
        { id: "hotel-area-4", label: "Best value area", value: "value" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
    hasAny(knownFields, ["hotel_budget", "budget"]) ? null : {
      id: "hotel_budget",
      prompt: "What's a comfortable nightly budget?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "hotel-budget-1", label: "Under EUR 120/night", value: "under 120" },
        { id: "hotel-budget-2", label: "EUR 120-220/night", value: "120-220" },
        { id: "hotel-budget-3", label: "EUR 220-350/night", value: "220-350" },
        { id: "hotel-budget-4", label: "Flexible for the right place", value: "flexible" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
  ];
  return questions.filter(isQuestion);
}

function flightQuestions(knownFields: Record<string, unknown>): ClarificationQuestion[] {
  const questions: Array<ClarificationQuestion | null> = [
    hasAny(knownFields, ["origin", "origin_airport"]) ? null : {
      id: "origin",
      prompt: "Where are you flying from?",
      reason: "Origin airport is the biggest missing piece for flight search.",
      required: false,
      answer_type: "single_choice",
      options: options("origin", ["Barcelona", "Madrid", "London", "Not sure yet"]),
      allow_free_text: true,
      allow_skip: true,
    },
    hasAny(knownFields, ["flight_dates", "start_date", "end_date"]) ? null : {
      id: "flight_dates",
      prompt: "How fixed are your travel dates?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "flight-dates-1", label: "Exact dates", value: "exact" },
        { id: "flight-dates-2", label: "Flexible by a few days", value: "few days flexible" },
        { id: "flight-dates-3", label: "Flexible by a month", value: "month flexible" },
        { id: "flight-dates-4", label: "No dates yet", value: "no dates" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
    hasAny(knownFields, ["flight_priority"]) ? null : {
      id: "flight_priority",
      prompt: "What should we optimize for?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "flight-priority-1", label: "Lowest price", value: "price" },
        { id: "flight-priority-2", label: "Shortest travel time", value: "duration" },
        { id: "flight-priority-3", label: "Fewer stops", value: "stops" },
        { id: "flight-priority-4", label: "Good arrival time", value: "arrival" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
  ];
  return questions.filter(isQuestion);
}

function normalizeIntent(intent: string | null | undefined, utterance: string): ClarificationIntent {
  const value = clean(intent)?.toLowerCase();
  if (value === "plan_trip" || value === "book_hotel" || value === "book_flight") return value;
  const text = utterance.toLowerCase();
  if (/\b(hotel|hostel|airbnb|stay|lodging|accommodation)\b/.test(text)) return "book_hotel";
  if (/\b(flight|fly|airport|airline)\b/.test(text)) return "book_flight";
  return "plan_trip";
}

function inferDestination(utterance: string): string | null {
  const match = /\b(?:to|in|for)\s+([A-Z][\p{L}.' -]{1,60})/u.exec(utterance);
  return clean(match?.[1]?.replace(/[.!?]+$/g, ""));
}

function options(prefix: string, labels: string[]): ClarificationOption[] {
  return labels.map((label, index) => ({ id: `${prefix}-${index + 1}`, label, value: label }));
}

function hasAny(record: Record<string, unknown>, keys: string[]): boolean {
  return keys.some((key) => {
    const value = record[key];
    return value != null && value !== "" && !(Array.isArray(value) && value.length === 0);
  });
}

function compactRecord(record: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value != null && value !== ""));
}

function destinationSuffix(knownFields: Record<string, unknown>): string {
  return typeof knownFields.destination === "string" && knownFields.destination ? ` in ${knownFields.destination}` : "";
}

function nextAction(intent: ClarificationIntent, remainingFields: string[]): SubmittedClarification["recommended_next_action"] {
  if (remainingFields.length > 0) return "ask_followup_text";
  if (intent === "book_hotel") return "save_hotel_request";
  if (intent === "book_flight") return "save_flight_request";
  return "create_trip";
}

function answerSummary(session: ClarificationSession, resolvedFields: Record<string, unknown>, remainingFields: string[]): string {
  const answered = Object.entries(resolvedFields).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`);
  const base = `${session.destination ?? "This trip"} clarification captured${answered.length ? ` (${answered.join("; ")})` : ""}.`;
  return remainingFields.length ? `${base} Still missing: ${remainingFields.join(", ")}.` : base;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "trip";
}

function isQuestion(value: ClarificationQuestion | null): value is ClarificationQuestion {
  return value != null;
}
