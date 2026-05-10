import { describe, expect, it } from "vitest";
import {
  buildBoard,
  buildBudget,
  buildItinerary,
  classifyTripItem,
  databaseUrlSummary,
  normalizeDatabaseUrl,
  normalizeRawContent,
} from "@/domain/trips";
import { InMemoryTripStore } from "@/stores/tripStore";

describe("trip domain parity", () => {
  it("normalizes raw content for dedupe", () => {
    expect(normalizeRawContent(" HTTPS://Example.com/Hotel/  ")).toBe("example.com/hotel");
  });

  it("normalizes database urls for Postgres clients", () => {
    expect(normalizeDatabaseUrl("postgresql+psycopg://user:pass@example.com/app")).toBe(
      "postgresql://user:pass@example.com/app?sslmode=require&connect_timeout=8"
    );
    expect(normalizeDatabaseUrl("postgres://user:pass@example.com/app?sslmode=require")).toBe(
      "postgresql://user:pass@example.com/app?sslmode=require&connect_timeout=8"
    );
  });

  it("redacts database url summaries", () => {
    expect(databaseUrlSummary("postgresql://user:secret@example.com:6543/app?sslmode=require")).toBe(
      "postgresql://example.com:6543/app"
    );
  });

  it.each([
    ["Flight BCN to Tokyo on Iberia", "flight"],
    ["Booking.com hotel option near Shibuya", "hotel"],
    ["Dinner reservation at Narisawa", "restaurant"],
    ["Should we buy train tickets now?", "transport"],
    ["Need to keep budget under 2500", "constraint"],
    ["Visit the Mori Art Museum", "activity"],
  ])("classifies %s", (rawContent, expectedType) => {
    expect(classifyTripItem(rawContent)).toBe(expectedType);
  });

  it("builds board lanes from status and type", async () => {
    const store = new InMemoryTripStore();
    const trip = await store.createTrip("Lisbon");
    const [hotel] = await store.addItem({ trip_id: trip.id, raw_content: "Hotel option near Alfama" });
    const [activity] = await store.addItem({ trip_id: trip.id, raw_content: "Visit MAAT museum", day_label: "Day 2" });
    const [question] = await store.addItem({ trip_id: trip.id, raw_content: "Should we rent a car?" });

    const board = buildBoard(trip, [
      await store.updateItemStatus(hotel.id, "booked"),
      await store.updateItemStatus(activity.id, "shortlisted"),
      await store.updateItemStatus(question.id, "needs_review"),
    ]);

    expect(board.lanes.booked[0].id).toBe(hotel.id);
    expect(board.lanes.shortlisted[0].id).toBe(activity.id);
    expect(board.lanes.itinerary_draft[0].id).toBe(activity.id);
    expect(board.lanes.open_decisions[0].id).toBe(question.id);
    expect(board.lanes.missing_pieces).toContain("Transport is not booked yet.");
  });

  it("groups itinerary items by day and schedule part", async () => {
    const store = new InMemoryTripStore();
    const trip = await store.createTrip("Rome");
    const [activity] = await store.addItem({ trip_id: trip.id, raw_content: "Colosseum tour", day_label: "Day 1 morning", title: "Colosseum Tour" });
    const [dinner] = await store.addItem({ trip_id: trip.id, raw_content: "Dinner in Trastevere", day_label: "Day 1 evening", title: "Dinner" });
    await store.updateItemStatus(activity.id, "shortlisted");
    await store.updateItemStatus(dinner.id, "shortlisted");

    const itinerary = buildItinerary(trip, await store.listItems(trip.id));

    expect(itinerary.days[0].label).toBe("Day 1");
    expect(itinerary.days[0].items[0].id).toBe(activity.id);
    expect(itinerary.days[0].items[0].schedule_label).toBe("Morning");
    expect(itinerary.days[0].items[1].id).toBe(dinner.id);
    expect(itinerary.counts.scheduled).toBe(2);
  });

  it("tracks priced budget items and multipliers", async () => {
    const store = new InMemoryTripStore();
    const trip = await store.createTrip("Rome", "Rome", "2026-05-25", "2026-06-01");
    await store.addItem({ trip_id: trip.id, raw_content: "Plan for 2 adults and 1 kid" });
    const [flight] = await store.addItem({ trip_id: trip.id, raw_content: "Ryanair BCN-FCO EUR 47/person", title: "Ryanair BCN-FCO" });
    const [hotel] = await store.addItem({ trip_id: trip.id, raw_content: "Hotel Lancelot EUR 95/night", title: "Hotel Lancelot" });
    await store.addItem({ trip_id: trip.id, raw_content: "Budget target EUR 1500", item_type: "constraint" });
    await store.updateItemStatus(flight.id, "shortlisted");
    await store.updateItemStatus(hotel.id, "shortlisted");

    const budget = buildBudget(trip, await store.listItems(trip.id));

    expect(budget.target).toBe(1500);
    expect(budget.spent).toBe(806);
    expect(budget.remaining).toBe(694);
    expect(budget.counts.party_size).toBe(3);
    expect(budget.counts.nights).toBe(7);
  });
});
