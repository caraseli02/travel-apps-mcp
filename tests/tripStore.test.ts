import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { afterEach, describe, expect, it } from "vitest";
import { normalizeDatabaseUrl, TripConfigError, TripNotFoundError, TripValidationError } from "@/domain/trips";
import { FileTripStore, InMemoryTripStore, PostgresTripStore } from "@/stores/tripStore";

const tempDirs: string[] = [];
const postgresIt = process.env.DATABASE_URL?.trim() ? it : it.skip;
const { Pool } = pg;

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("trip stores", () => {
  it("creates trips and dedupes by normalized raw content", async () => {
    const store = new InMemoryTripStore();
    const trip = await store.createTrip("Tokyo", "Tokyo");
    const [first, firstDeduped] = await store.addItem({
      trip_id: trip.id,
      raw_content: "https://booking.com/hotel/example/",
      source_label: "Booking",
      title: "Hotel example",
    });
    const [second, secondDeduped] = await store.addItem({ trip_id: trip.id, raw_content: "booking.com/hotel/example" });

    expect(firstDeduped).toBe(false);
    expect(secondDeduped).toBe(true);
    expect(second.id).toBe(first.id);
    expect(first.item_type).toBe("hotel");
    expect(await store.listItems(trip.id, "inbox")).toEqual([first]);
  });

  it("persists file store items across store instances", async () => {
    const dir = await mkdtemp(join(tmpdir(), "travel-mcp-"));
    tempDirs.push(dir);
    const path = join(dir, "trips.json");
    const store = new FileTripStore(path);
    const trip = await store.createTrip("Tokyo", "Tokyo");
    const [item, deduped] = await store.addItem({ trip_id: trip.id, raw_content: "https://booking.com/hotel/example/", title: "Hotel example" });
    await store.updateItemStatus(item.id, "shortlisted", "Day 1");

    const reloaded = new FileTripStore(path);
    const [duplicate, duplicateDeduped] = await reloaded.addItem({ trip_id: trip.id, raw_content: "booking.com/hotel/example" });

    expect(deduped).toBe(false);
    expect(duplicateDeduped).toBe(true);
    expect(duplicate.id).toBe(item.id);
    expect((await reloaded.getTrip(trip.id)).destination).toBe("Tokyo");
    expect((await reloaded.listItems(trip.id, "shortlisted"))[0].day_label).toBe("Day 1");
  });

  it("refreshes stale file store instances before operations", async () => {
    const dir = await mkdtemp(join(tmpdir(), "travel-mcp-"));
    tempDirs.push(dir);
    const path = join(dir, "trips.json");
    const firstWorker = new FileTripStore(path);
    const secondWorker = new FileTripStore(path);

    const trip = await firstWorker.createTrip("Tokyo", "Tokyo");
    const [item, deduped] = await secondWorker.addItem({ trip_id: trip.id, raw_content: "https://example.com/hotel" });
    const secondTrip = await secondWorker.createTrip("Osaka", "Osaka");

    expect(deduped).toBe(false);
    expect(item.trip_id).toBe(trip.id);
    expect((await firstWorker.getTrip(secondTrip.id)).destination).toBe("Osaka");
  });

  it("rejects empty trip titles and content", async () => {
    const store = new InMemoryTripStore();
    await expect(store.createTrip("  ")).rejects.toThrow(TripValidationError);
    const trip = await store.createTrip("Barcelona");
    await expect(store.addItem({ trip_id: trip.id, raw_content: " " })).rejects.toThrow(TripValidationError);
  });

  it("raises for unknown ids and invalid status", async () => {
    const store = new InMemoryTripStore();
    const trip = await store.createTrip("Paris");
    const [item] = await store.addItem({ trip_id: trip.id, raw_content: "Museum pass" });

    await expect(store.listItems("missing-trip")).rejects.toThrow(TripNotFoundError);
    await expect(store.updateItemStatus(item.id, "maybe")).rejects.toThrow(TripValidationError);
  });

  it("requires DATABASE_URL for Postgres", () => {
    expect(() => new PostgresTripStore("")).toThrow(TripConfigError);
  });

  postgresIt("persists Postgres store items across instances with dedupe and status parity", async () => {
    const databaseUrl = process.env.DATABASE_URL ?? "";
    const cleanupPool = new Pool({ connectionString: normalizeDatabaseUrl(databaseUrl), max: 1, connectionTimeoutMillis: 8000 });
    const store = new PostgresTripStore(databaseUrl);
    const reloaded = new PostgresTripStore(databaseUrl);
    let tripId: string | null = null;

    try {
      const trip = await store.createTrip(`Vitest Lisbon ${Date.now()}`, "Lisbon", "2026-06-10", "2026-06-14");
      tripId = trip.id;
      const [item, deduped] = await store.addItem({
        trip_id: trip.id,
        raw_content: "https://example.com/lisbon-hotel",
        item_type: "hotel",
        source_label: "Example",
        title: "Lisbon Hotel",
        price_note: "EUR 140/night",
      });
      await store.updateItemStatus(item.id, "shortlisted", "Day 1", "Check refundable rate");

      const [duplicate, duplicateDeduped] = await reloaded.addItem({
        trip_id: trip.id,
        raw_content: "example.com/lisbon-hotel",
      });
      const shortlisted = await reloaded.listItems(trip.id, "shortlisted");
      const reloadedTrip = await reloaded.getTrip(trip.id);

      expect(deduped).toBe(false);
      expect(duplicateDeduped).toBe(true);
      expect(duplicate.id).toBe(item.id);
      expect(reloadedTrip).toMatchObject({ destination: "Lisbon", start_date: "2026-06-10", end_date: "2026-06-14" });
      expect(shortlisted[0]).toMatchObject({
        id: item.id,
        item_type: "hotel",
        source_label: "Example",
        title: "Lisbon Hotel",
        day_label: "Day 1",
        price_note: "EUR 140/night",
        notes: "Check refundable rate",
      });
    } finally {
      if (tripId) await cleanupPool.query("DELETE FROM trips WHERE id = $1", [tripId]);
      await cleanupPool.end();
      await store.close();
      await reloaded.close();
    }
  });
});
