import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryTripStore } from "@/stores/tripStore";
import {
  addTripItem,
  createTrip,
  getTripBoard,
  getTripBudget,
  getTripItinerary,
  getTripSummary,
  prepareTripClarification,
  renderTripClarification,
  renderTripBoard,
  resetTripStoreForTests,
  submitTripClarification,
  updateTripItemStatus,
} from "@/tools/travelAgent";

describe("travel agent tools", () => {
  let store: InMemoryTripStore;

  beforeEach(() => {
    store = new InMemoryTripStore();
    resetTripStoreForTests(store);
  });

  it("creates a trip and returns stable trip id", async () => {
    const result = await createTrip({ title: "Tokyo", destination: "Tokyo", start_date: null, end_date: null });
    expect(result.isError).not.toBe(true);
    const trip = result.structuredContent?.trip as { id: string; title: string };
    expect(trip.id).toBeTruthy();
    expect(trip.title).toBe("Tokyo");
    expect((await store.getTrip(trip.id)).destination).toBe("Tokyo");
  });

  it("adds trip items with inbox shape and duplicate flag", async () => {
    const trip = await store.createTrip("Barcelona");
    const first = await addTripItem({ trip_id: trip.id, raw_content: "Booking.com hotel near Gracia", source_label: "Booking", title: "Gracia hotel" });
    const second = await addTripItem({ trip_id: trip.id, raw_content: "booking.com hotel near gracia" });

    expect(first.isError).not.toBe(true);
    expect(first.structuredContent?.deduped).toBe(false);
    expect((first.structuredContent?.item as { item_type: string }).item_type).toBe("hotel");
    expect((first.structuredContent?.items as Array<{ status: string }>)[0].status).toBe("inbox");
    expect(second.structuredContent?.deduped).toBe(true);
  });

  it("keeps render board payload equivalent to data board", async () => {
    const trip = await store.createTrip("London");
    const added = await addTripItem({ trip_id: trip.id, raw_content: "Hotel near Soho" });
    const item = added.structuredContent?.item as { id: string };
    await updateTripItemStatus({ item_id: item.id, status: "booked", day_label: null, notes: null });

    const dataResult = await getTripBoard({ trip_id: trip.id });
    const renderResult = await renderTripBoard({ trip_id: trip.id });

    expect(dataResult.isError).not.toBe(true);
    expect(renderResult.isError).not.toBe(true);
    expect(renderResult.structuredContent).toEqual(dataResult.structuredContent);
    expect(renderResult.content[0]).toMatchObject({ type: "text", text: "Rendered trip board for London." });
  });

  it("groups itinerary items by day", async () => {
    const trip = await store.createTrip("Rome");
    const activity = (await addTripItem({ trip_id: trip.id, raw_content: "Colosseum tour", day_label: "Day 1 morning", title: "Colosseum Tour" })).structuredContent?.item as { id: string };
    const dinner = (await addTripItem({ trip_id: trip.id, raw_content: "Dinner in Trastevere", day_label: "Day 1 evening", title: "Dinner" })).structuredContent?.item as { id: string };
    await updateTripItemStatus({ item_id: activity.id, status: "shortlisted", day_label: null, notes: null });
    await updateTripItemStatus({ item_id: dinner.id, status: "shortlisted", day_label: null, notes: null });

    const result = await getTripItinerary({ trip_id: trip.id });
    const days = (result.structuredContent?.days ?? []) as Array<{ label: string; items: Array<{ id: string; schedule_label: string }> }>;

    expect(result.isError).not.toBe(true);
    expect(days[0].label).toBe("Day 1");
    expect(days[0].items[0].id).toBe(activity.id);
    expect(days[0].items[0].schedule_label).toBe("Morning");
    expect(days[0].items[1].id).toBe(dinner.id);
  });

  it("tracks budget items and summary missing pieces", async () => {
    const trip = await store.createTrip("Rome");
    const flight = (await addTripItem({ trip_id: trip.id, raw_content: "Ryanair BCN-FCO May 25, EUR 47/person" })).structuredContent?.item as { id: string };
    const hotel = (await addTripItem({ trip_id: trip.id, raw_content: "Hotel Lancelot near Termini, EUR 95/night" })).structuredContent?.item as { id: string };
    await addTripItem({ trip_id: trip.id, raw_content: "Budget target EUR 1500", item_type: "constraint" });
    await updateTripItemStatus({ item_id: flight.id, status: "shortlisted", day_label: null, notes: null });
    await updateTripItemStatus({ item_id: hotel.id, status: "shortlisted", day_label: null, notes: null });

    const budget = await getTripBudget({ trip_id: trip.id });
    const summary = await getTripSummary({ trip_id: trip.id });

    expect(budget.structuredContent?.target).toBe(1500);
    expect(budget.structuredContent?.spent).toBe(142);
    expect(summary.structuredContent?.missing_pieces).toContain("Transport is not booked yet.");
  });

  it("returns clear errors", async () => {
    const result = await createTrip({ title: "  ", destination: null, start_date: null, end_date: null });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toEqual({ error: "trip title is required." });
  });

  it("prepares intent-specific trip clarification questions", async () => {
    const trip = await prepareTripClarification({
      utterance: "I want to plan a trip to Venice",
      intent: "",
      destination: "",
      trip_id: "",
      known_fields_json: "{}",
    });
    const hotel = await prepareTripClarification({
      utterance: "I want to book hotel in Paris",
      intent: "",
      destination: "",
      trip_id: "",
      known_fields_json: "{}",
    });
    const flight = await prepareTripClarification({
      utterance: "I want to book fly to Tokyo",
      intent: "",
      destination: "",
      trip_id: "",
      known_fields_json: "{}",
    });

    expect(trip.structuredContent).toMatchObject({ intent: "plan_trip", destination: "Venice" });
    expect((trip.structuredContent?.questions as Array<{ id: string }>).map((question) => question.id)).toEqual([
      "duration",
      "travel_style",
      "timing",
    ]);
    expect(hotel.structuredContent).toMatchObject({ intent: "book_hotel", destination: "Paris" });
    expect((hotel.structuredContent?.questions as Array<{ id: string }>)[0].id).toBe("hotel_dates");
    expect(flight.structuredContent).toMatchObject({ intent: "book_flight", destination: "Tokyo" });
    expect((flight.structuredContent?.questions as Array<{ id: string }>)[0].id).toBe("origin");
  });

  it("omits clarification questions from known model fields and existing trip state", async () => {
    const trip = await store.createTrip("Venice Trip", "Venice", "2026-06-01", "2026-06-04");
    await addTripItem({ trip_id: trip.id, raw_content: "Hotel Ala confirmed", item_type: "hotel", title: "Hotel Ala" });

    const result = await prepareTripClarification({
      utterance: "I want to plan a trip to Venice",
      intent: "plan_trip",
      destination: "",
      trip_id: trip.id,
      known_fields_json: JSON.stringify({ travel_style: "food" }),
    });
    const questionIds = (result.structuredContent?.questions as Array<{ id: string }>).map((question) => question.id);

    expect(result.structuredContent).toMatchObject({
      destination: "Venice",
      known_fields: expect.objectContaining({ has_hotel: true, travel_style: "food" }),
    });
    expect(questionIds).not.toContain("duration");
    expect(questionIds).not.toContain("travel_style");
  });

  it("renders and summarizes trip clarification answers", async () => {
    const rendered = await renderTripClarification({
      utterance: "I want to book hotel in Paris",
      intent: "",
      destination: "",
      trip_id: "",
      known_fields_json: "{}",
    });
    const session = rendered.structuredContent;

    expect(rendered.isError).not.toBe(true);
    expect(rendered.content[0]).toMatchObject({ type: "text", text: "Opened 3 clarification question(s) for Paris." });

    const submitted = await submitTripClarification({
      session_json: JSON.stringify(session),
      answers_json: JSON.stringify({
        hotel_dates: "3-4 nights",
        hotel_area: "central",
        hotel_budget: "120-220",
      }),
    });

    expect(submitted.structuredContent).toMatchObject({
      recommended_next_action: "save_hotel_request",
      resolved_fields: {
        hotel_dates: "3-4 nights",
        hotel_area: "central",
        hotel_budget: "120-220",
      },
      remaining_fields: [],
    });
    expect(submitted._meta).toMatchObject({ "openai/closeWidget": true });
  });
});
