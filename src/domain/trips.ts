export const ITEM_TYPES = [
  "flight",
  "transport",
  "hotel",
  "restaurant",
  "activity",
  "document",
  "note",
  "question",
  "constraint",
] as const;

export const ITEM_STATUSES = [
  "booked",
  "inbox",
  "needs_review",
  "rejected",
  "shortlisted",
] as const;

export type TripItemType = (typeof ITEM_TYPES)[number];
export type TripItemStatus = (typeof ITEM_STATUSES)[number];

export type Trip = {
  id: string;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TripItem = {
  id: string;
  trip_id: string;
  raw_content: string;
  normalized_raw_content: string;
  item_type: TripItemType;
  status: TripItemStatus;
  source_label: string | null;
  title: string | null;
  day_label: string | null;
  date_note: string | null;
  price_note: string | null;
  location_note: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type TripBoard = ReturnType<typeof buildBoard>;
export type TripItinerary = ReturnType<typeof buildItinerary>;
export type TripBudget = ReturnType<typeof buildBudget>;

export class TripStoreError extends Error {}
export class TripConfigError extends TripStoreError {}
export class TripConnectionError extends TripStoreError {}
export class TripValidationError extends TripStoreError {}
export class TripNotFoundError extends TripStoreError {}

export function utcNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function cleanOptional(value: string | null | undefined): string | null {
  if (value == null) return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function normalizeRawContent(rawContent: string): string {
  return rawContent
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/^www\./, "")
    .replace(/\s+/g, " ")
    .replace(/[/#?& ]+$/g, "");
}

export function validateStatus(status: string): TripItemStatus {
  const value = status.trim().toLowerCase();
  if (!isTripItemStatus(value)) {
    throw new TripValidationError(
      `status must be one of: ${[...ITEM_STATUSES].sort().join(", ")}`
    );
  }
  return value;
}

export function validateItemType(itemType: string): TripItemType {
  const value = itemType.trim().toLowerCase();
  if (!isTripItemType(value)) {
    throw new TripValidationError(
      `item_type must be one of: ${[...ITEM_TYPES].sort().join(", ")}`
    );
  }
  return value;
}

export function classifyTripItem(rawContent: string): TripItemType {
  const text = rawContent.toLowerCase();
  const rules: Array<[TripItemType, string[]]> = [
    ["flight", ["flight", "airline", "airport", "boarding", "gate", "skyscanner"]],
    ["transport", ["train", "bus", "ferry", "metro", "uber", "taxi", "rail"]],
    ["hotel", ["hotel", "hostel", "airbnb", "booking.com", "check-in", "stay"]],
    ["restaurant", ["restaurant", "reservation", "dinner", "lunch", "cafe", "menu"]],
    ["document", ["ticket", "passport", "visa", "receipt", "confirmation", "pdf"]],
    ["question", ["?", "should we", "can we", "what about", "is it worth"]],
    ["constraint", ["budget", "must", "can't", "cannot", "need to", "constraint"]],
    ["activity", ["museum", "tour", "beach", "hike", "activity", "visit", "show"]],
  ];

  for (const [itemType, needles] of rules) {
    if (needles.some((needle) => text.includes(needle))) return itemType;
  }
  return "note";
}

export function buildBoard(trip: Trip, items: TripItem[]) {
  const lanes: {
    open_decisions: TripItem[];
    shortlisted: TripItem[];
    booked: TripItem[];
    itinerary_draft: TripItem[];
    missing_pieces: string[];
  } = {
    open_decisions: [],
    shortlisted: [],
    booked: [],
    itinerary_draft: [],
    missing_pieces: [],
  };

  for (const item of items) {
    if (item.status === "needs_review" || ["question", "constraint"].includes(item.item_type)) {
      lanes.open_decisions.push(item);
    }
    if (item.status === "shortlisted") lanes.shortlisted.push(item);
    if (item.status === "booked") lanes.booked.push(item);
    if (item.day_label && !["inbox", "rejected"].includes(item.status)) {
      lanes.itinerary_draft.push(item);
    }
  }

  const bookedTypes = new Set(items.filter((item) => item.status === "booked").map((item) => item.item_type));
  if (!bookedTypes.has("flight") && !bookedTypes.has("transport")) {
    lanes.missing_pieces.push("Transport is not booked yet.");
  }
  if (!bookedTypes.has("hotel")) lanes.missing_pieces.push("Stay is not booked yet.");
  if (!items.some((item) => item.item_type === "activity")) {
    lanes.missing_pieces.push("No activities saved yet.");
  }

  return {
    trip,
    lanes,
    counts: summarizeItems(items),
  };
}

export function buildItinerary(trip: Trip, items: TripItem[]) {
  const scheduled = items.filter((item) => item.day_label && !["inbox", "rejected"].includes(item.status));
  const grouped = new Map<string, Array<TripItem & { schedule_label: string }>>();

  for (const item of scheduled) {
    const label = item.day_label ?? "Unscheduled";
    const day = dayLabel(label);
    const schedule_label = schedulePart(label) ?? item.date_note ?? "Plan";
    grouped.set(day, [...(grouped.get(day) ?? []), { ...item, schedule_label }]);
  }

  const days = [...grouped.keys()]
    .sort(daySortKey)
    .map((label) => ({
      label,
      items: [...(grouped.get(label) ?? [])].sort(itemSortKey),
    }));

  const unscheduled = items.filter(
    (item) => !item.day_label && ["shortlisted", "booked", "needs_review"].includes(item.status)
  );

  const gaps: string[] = [];
  if (days.length === 0) gaps.push("No day-by-day itinerary items have been assigned yet.");
  if (unscheduled.length > 0) gaps.push(`${unscheduled.length} saved item(s) still need a day assignment.`);

  return {
    trip,
    days,
    unscheduled,
    gaps,
    counts: {
      scheduled: scheduled.length,
      unscheduled: unscheduled.length,
    },
  };
}

function dayLabel(label: string): string {
  const match = /\bday\s*(\d+)\b/i.exec(label);
  if (match) return `Day ${match[1]}`;
  return label.trim() || "Unscheduled";
}

function schedulePart(label: string): string | null {
  const value = label.replace(/\bday\s*\d+\b/gi, "").replace(/^[\s:,-]+|[\s:,-]+$/g, "").trim();
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function daySortKey(a: string, b: string): number {
  const aMatch = /\d+/.exec(a);
  const bMatch = /\d+/.exec(b);
  const aNumber = aMatch ? Number(aMatch[0]) : 999;
  const bNumber = bMatch ? Number(bMatch[0]) : 999;
  return aNumber - bNumber || a.localeCompare(b);
}

function itemSortKey(a: { schedule_label?: string | null; date_note?: string | null }, b: { schedule_label?: string | null; date_note?: string | null }): number {
  const rank = (item: { schedule_label?: string | null; date_note?: string | null }) => {
    const label = String(item.schedule_label ?? item.date_note ?? "");
    const order: Record<string, number> = { morning: 1, midday: 2, afternoon: 3, evening: 4, night: 5 };
    for (const [key, value] of Object.entries(order)) {
      if (label.toLowerCase().includes(key)) return [value, label] as const;
    }
    return [50, label] as const;
  };
  const [aRank, aLabel] = rank(a);
  const [bRank, bLabel] = rank(b);
  return aRank - bRank || aLabel.localeCompare(bLabel);
}

export function buildBudget(trip: Trip, items: TripItem[]) {
  const target = budgetTarget(items);
  const partySize = partySizeFromItems(items);
  const nights = tripNights(trip);
  const rows = [];

  for (const item of items) {
    if (item.status === "rejected" || item.item_type === "constraint") continue;
    const amount = itemAmount(item, partySize, nights);
    if (amount == null) continue;
    rows.push({
      id: item.id,
      title: item.title || item.raw_content || "Saved item",
      item_type: item.item_type,
      status: item.status,
      amount,
      currency: "EUR",
      note: item.price_note || item.raw_content,
    });
  }

  const categoryTotals = new Map<string, number>();
  for (const row of rows) {
    categoryTotals.set(row.item_type, (categoryTotals.get(row.item_type) ?? 0) + row.amount);
  }

  const spent = round2(rows.reduce((total, row) => total + row.amount, 0));
  const remaining = target == null ? null : round2(target - spent);
  const percent_used = target ? Math.min(100, Math.round((spent / target) * 100)) : 0;

  return {
    trip,
    target,
    spent,
    remaining,
    percent_used,
    currency: "EUR",
    rows,
    category_totals: [...categoryTotals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, amount]) => ({ category, amount: round2(amount) })),
    counts: {
      priced_items: rows.length,
      tracked_categories: categoryTotals.size,
      party_size: partySize,
      nights,
    },
  };
}

function budgetTarget(items: TripItem[]): number | null {
  for (const item of items) {
    const text = [item.price_note, item.raw_content, item.notes].filter(Boolean).join(" ");
    if (item.item_type === "constraint" || text.toLowerCase().includes("budget")) {
      const amount = firstMoneyAmount(text);
      if (amount != null) return amount;
    }
  }
  return null;
}

function itemAmount(item: TripItem, partySize: number, nights: number): number | null {
  const text = [item.price_note, item.raw_content, item.notes].filter(Boolean).join(" ");
  let amount = firstMoneyAmount(text);
  if (amount == null) return null;
  const lowered = text.toLowerCase();
  if (/\/\s*person|per\s+person|\bpp\b/.test(lowered)) amount *= Math.max(1, partySize);
  if (/\/\s*night|per\s+night/.test(lowered)) amount *= Math.max(1, nights);
  return round2(amount);
}

function partySizeFromItems(items: TripItem[]): number {
  const text = items.flatMap((item) => [item.raw_content, item.notes]).filter(Boolean).join(" ").toLowerCase();
  return Math.max(1, countPeople(text, /(\d+)\s*adults?/i) + countPeople(text, /(\d+)\s*(?:kids?|children)/i));
}

function countPeople(text: string, pattern: RegExp): number {
  const match = pattern.exec(text);
  return match ? Number(match[1]) : 0;
}

function tripNights(trip: Trip): number {
  if (!trip.start_date || !trip.end_date) return 1;
  const start = Date.parse(`${trip.start_date}T00:00:00Z`);
  const end = Date.parse(`${trip.end_date}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000));
}

function firstMoneyAmount(text: string): number | null {
  const match = /(?:€|EUR|\$)\s*([0-9](?:[0-9.,]*[0-9])?)|([0-9](?:[0-9.,]*[0-9])?)\s*(?:€|EUR|\$)/i.exec(text);
  if (!match) return null;
  const amount = Number((match[1] ?? match[2] ?? "").replace(/,/g, ""));
  return Number.isFinite(amount) ? round2(amount) : null;
}

export function summarizeItems(items: TripItem[]) {
  const by_status = Object.fromEntries([...ITEM_STATUSES].sort().map((status) => [status, 0])) as Record<TripItemStatus, number>;
  const by_type = Object.fromEntries([...ITEM_TYPES].sort().map((itemType) => [itemType, 0])) as Record<TripItemType, number>;
  for (const item of items) {
    by_status[item.status] = (by_status[item.status] ?? 0) + 1;
    by_type[item.item_type] = (by_type[item.item_type] ?? 0) + 1;
  }
  return {
    total: items.length,
    by_status,
    by_type,
  };
}

export function normalizeDatabaseUrl(databaseUrl: string): string {
  let value = databaseUrl.trim();
  if (!value) return "";
  value = value.replace(/^postgresql\+psycopg:\/\//, "postgresql://");
  value = value.replace(/^postgres\+psycopg:\/\//, "postgresql://");
  value = value.replace(/^postgres:\/\//, "postgresql://");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  if (!["postgresql:", "postgres:"].includes(url.protocol)) return value;
  if (!url.searchParams.has("sslmode")) url.searchParams.set("sslmode", "require");
  if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "8");
  return url.toString();
}

export function databaseUrlSummary(databaseUrl: string): string {
  const url = new URL(databaseUrl);
  const port = url.port ? `:${url.port}` : "";
  const database = url.pathname.replace(/^\//, "") || "unknown-db";
  return `${url.protocol}//${url.hostname || "unknown-host"}${port}/${database}`;
}

function isTripItemStatus(value: string): value is TripItemStatus {
  return (ITEM_STATUSES as readonly string[]).includes(value);
}

function isTripItemType(value: string): value is TripItemType {
  return (ITEM_TYPES as readonly string[]).includes(value);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
