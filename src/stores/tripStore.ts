import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import pg from "pg";
import {
  classifyTripItem,
  cleanOptional,
  databaseUrlSummary,
  normalizeDatabaseUrl,
  normalizeRawContent,
  Trip,
  TripConfigError,
  TripConnectionError,
  TripItem,
  TripNotFoundError,
  TripStoreError,
  TripValidationError,
  utcNow,
  validateItemType,
  validateStatus,
} from "@/domain/trips";

const { Pool } = pg;

export type AddTripItemInput = {
  trip_id: string;
  raw_content: string;
  item_type?: string | null;
  source_label?: string | null;
  title?: string | null;
  day_label?: string | null;
  date_note?: string | null;
  price_note?: string | null;
  location_note?: string | null;
  notes?: string | null;
};

export interface TripStore {
  createTrip(title: string, destination?: string | null, startDate?: string | null, endDate?: string | null): Promise<Trip>;
  getTrip(tripId: string): Promise<Trip>;
  addItem(input: AddTripItemInput): Promise<[TripItem, boolean]>;
  getItem(itemId: string): Promise<TripItem>;
  listItems(tripId: string, status?: string | null): Promise<TripItem[]>;
  updateItemStatus(itemId: string, status: string, dayLabel?: string | null, notes?: string | null): Promise<TripItem>;
  close?(): Promise<void>;
}

export class InMemoryTripStore implements TripStore {
  protected trips = new Map<string, Trip>();
  protected items = new Map<string, TripItem>();

  async createTrip(title: string, destination?: string | null, startDate?: string | null, endDate?: string | null): Promise<Trip> {
    const cleanedTitle = title.trim();
    if (!cleanedTitle) throw new TripValidationError("trip title is required.");
    const now = utcNow();
    const trip: Trip = {
      id: randomUUID(),
      title: cleanedTitle,
      destination: cleanOptional(destination),
      start_date: cleanOptional(startDate),
      end_date: cleanOptional(endDate),
      created_at: now,
      updated_at: now,
    };
    this.trips.set(trip.id, trip);
    return trip;
  }

  async getTrip(tripId: string): Promise<Trip> {
    return this.getTripFromMemory(tripId);
  }

  protected getTripFromMemory(tripId: string): Trip {
    const trip = this.trips.get(tripId);
    if (!trip) throw new TripNotFoundError(`trip not found: ${tripId}`);
    return trip;
  }

  async addItem(input: AddTripItemInput): Promise<[TripItem, boolean]> {
    this.getTripFromMemory(input.trip_id);
    const rawContent = input.raw_content.trim();
    if (!rawContent) throw new TripValidationError("raw_content is required.");
    const normalized = normalizeRawContent(rawContent);
    for (const item of this.items.values()) {
      if (item.trip_id === input.trip_id && item.normalized_raw_content === normalized) {
        return [item, true];
      }
    }

    const itemType = validateItemType(input.item_type ?? classifyTripItem(rawContent));
    const now = utcNow();
    const item: TripItem = {
      id: randomUUID(),
      trip_id: input.trip_id,
      raw_content: rawContent,
      normalized_raw_content: normalized,
      item_type: itemType,
      status: "inbox",
      source_label: cleanOptional(input.source_label),
      title: cleanOptional(input.title),
      day_label: cleanOptional(input.day_label),
      date_note: cleanOptional(input.date_note),
      price_note: cleanOptional(input.price_note),
      location_note: cleanOptional(input.location_note),
      notes: cleanOptional(input.notes),
      created_at: now,
      updated_at: now,
    };
    this.items.set(item.id, item);
    return [item, false];
  }

  async getItem(itemId: string): Promise<TripItem> {
    return this.getItemFromMemory(itemId);
  }

  protected getItemFromMemory(itemId: string): TripItem {
    const item = this.items.get(itemId);
    if (!item) throw new TripNotFoundError(`trip item not found: ${itemId}`);
    return item;
  }

  async listItems(tripId: string, status?: string | null): Promise<TripItem[]> {
    this.getTripFromMemory(tripId);
    const validatedStatus = status == null ? null : validateStatus(status);
    return [...this.items.values()].filter(
      (item) => item.trip_id === tripId && (validatedStatus == null || item.status === validatedStatus)
    );
  }

  async updateItemStatus(itemId: string, status: string, dayLabel?: string | null, notes?: string | null): Promise<TripItem> {
    const item = this.getItemFromMemory(itemId);
    const updated: TripItem = {
      ...item,
      status: validateStatus(status),
      day_label: cleanOptional(dayLabel) ?? item.day_label,
      notes: cleanOptional(notes) ?? item.notes,
      updated_at: utcNow(),
    };
    this.items.set(itemId, updated);
    return updated;
  }
}

type FilePayload = {
  trips?: Trip[];
  items?: TripItem[];
};

export class FileTripStore extends InMemoryTripStore {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {
    super();
    if (!filePath.trim()) {
      throw new TripConfigError("TRIP_STORE_FILE_PATH is required for file trip persistence.");
    }
  }

  override async createTrip(title: string, destination?: string | null, startDate?: string | null, endDate?: string | null): Promise<Trip> {
    return this.serial(async () => {
      await this.load();
      const trip = await super.createTrip(title, destination, startDate, endDate);
      await this.save();
      return trip;
    });
  }

  override async getTrip(tripId: string): Promise<Trip> {
    return this.serial(async () => {
      await this.load();
      return super.getTrip(tripId);
    });
  }

  override async getItem(itemId: string): Promise<TripItem> {
    return this.serial(async () => {
      await this.load();
      return super.getItem(itemId);
    });
  }

  override async listItems(tripId: string, status?: string | null): Promise<TripItem[]> {
    return this.serial(async () => {
      await this.load();
      return super.listItems(tripId, status);
    });
  }

  override async addItem(input: AddTripItemInput): Promise<[TripItem, boolean]> {
    return this.serial(async () => {
      await this.load();
      const result = await super.addItem(input);
      if (!result[1]) await this.save();
      return result;
    });
  }

  override async updateItemStatus(itemId: string, status: string, dayLabel?: string | null, notes?: string | null): Promise<TripItem> {
    return this.serial(async () => {
      await this.load();
      const item = await super.updateItemStatus(itemId, status, dayLabel, notes);
      await this.save();
      return item;
    });
  }

  private async serial<T>(operation: () => Promise<T>): Promise<T> {
    const run = this.queue.then(operation, operation);
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async load(): Promise<void> {
    try {
      const data = JSON.parse(await readFile(this.filePath, "utf8")) as FilePayload;
      this.trips = new Map((data.trips ?? []).filter((trip) => trip.id).map((trip) => [trip.id, trip]));
      this.items = new Map((data.items ?? []).filter((item) => item.id).map((item) => [item.id, item]));
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        this.trips = new Map();
        this.items = new Map();
        return;
      }
      throw new TripConfigError(`Could not load file trip store at ${this.filePath}: ${String(error)}`);
    }
  }

  private async save(): Promise<void> {
    const payload = {
      trips: [...this.trips.values()],
      items: [...this.items.values()],
    };
    const tempPath = `${this.filePath}.${randomUUID().replace(/-/g, "")}.tmp`;
    try {
      await mkdir(dirname(this.filePath), { recursive: true });
      await writeFile(tempPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      await rename(tempPath, this.filePath);
    } catch (error) {
      throw new TripStoreError(`Could not save file trip store at ${this.filePath}: ${String(error)}`);
    }
  }
}

export class PostgresTripStore implements TripStore {
  private readonly pool: pg.Pool;
  private schemaReady = false;
  private readonly databaseSummary: string;

  constructor(databaseUrl: string) {
    const normalizedUrl = normalizeDatabaseUrl(databaseUrl);
    if (!normalizedUrl) throw new TripConfigError("DATABASE_URL is required for trip persistence.");
    this.databaseSummary = databaseUrlSummary(normalizedUrl);
    this.pool = new Pool({ connectionString: normalizedUrl, max: 5, connectionTimeoutMillis: 8000 });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async ensureSchema(): Promise<void> {
    if (this.schemaReady) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS trips (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          destination TEXT,
          start_date TEXT,
          end_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS trip_items (
          id TEXT PRIMARY KEY,
          trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          raw_content TEXT NOT NULL,
          normalized_raw_content TEXT NOT NULL,
          item_type TEXT NOT NULL,
          status TEXT NOT NULL,
          source_label TEXT,
          title TEXT,
          day_label TEXT,
          date_note TEXT,
          price_note TEXT,
          location_note TEXT,
          notes TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE (trip_id, normalized_raw_content)
        )
      `);
      await this.pool.query("CREATE INDEX IF NOT EXISTS idx_trip_items_trip_status ON trip_items(trip_id, status)");
      this.schemaReady = true;
    } catch (error) {
      throw new TripConnectionError(`Could not connect to Postgres at ${this.databaseSummary}: ${String(error)}`);
    }
  }

  async createTrip(title: string, destination?: string | null, startDate?: string | null, endDate?: string | null): Promise<Trip> {
    const cleanedTitle = title.trim();
    if (!cleanedTitle) throw new TripValidationError("trip title is required.");
    const now = utcNow();
    const trip: Trip = {
      id: randomUUID(),
      title: cleanedTitle,
      destination: cleanOptional(destination),
      start_date: cleanOptional(startDate),
      end_date: cleanOptional(endDate),
      created_at: now,
      updated_at: now,
    };
    await this.ensureSchema();
    await this.pool.query(
      `INSERT INTO trips (id, title, destination, start_date, end_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [trip.id, trip.title, trip.destination, trip.start_date, trip.end_date, trip.created_at, trip.updated_at]
    );
    return trip;
  }

  async getTrip(tripId: string): Promise<Trip> {
    await this.ensureSchema();
    const result = await this.pool.query<Trip>("SELECT * FROM trips WHERE id = $1", [tripId]);
    const trip = result.rows[0];
    if (!trip) throw new TripNotFoundError(`trip not found: ${tripId}`);
    return trip;
  }

  async addItem(input: AddTripItemInput): Promise<[TripItem, boolean]> {
    await this.getTrip(input.trip_id);
    const rawContent = input.raw_content.trim();
    if (!rawContent) throw new TripValidationError("raw_content is required.");
    const normalized = normalizeRawContent(rawContent);
    const itemType = validateItemType(input.item_type ?? classifyTripItem(rawContent));
    const now = utcNow();
    const item: TripItem = {
      id: randomUUID(),
      trip_id: input.trip_id,
      raw_content: rawContent,
      normalized_raw_content: normalized,
      item_type: itemType,
      status: "inbox",
      source_label: cleanOptional(input.source_label),
      title: cleanOptional(input.title),
      day_label: cleanOptional(input.day_label),
      date_note: cleanOptional(input.date_note),
      price_note: cleanOptional(input.price_note),
      location_note: cleanOptional(input.location_note),
      notes: cleanOptional(input.notes),
      created_at: now,
      updated_at: now,
    };

    try {
      await this.pool.query(
        `INSERT INTO trip_items (
          id, trip_id, raw_content, normalized_raw_content, item_type, status,
          source_label, title, day_label, date_note, price_note, location_note,
          notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          item.id,
          item.trip_id,
          item.raw_content,
          item.normalized_raw_content,
          item.item_type,
          item.status,
          item.source_label,
          item.title,
          item.day_label,
          item.date_note,
          item.price_note,
          item.location_note,
          item.notes,
          item.created_at,
          item.updated_at,
        ]
      );
      return [item, false];
    } catch (error) {
      if (isPgUniqueViolation(error)) return [await this.getItemByNormalizedContent(input.trip_id, normalized), true];
      throw error;
    }
  }

  async getItem(itemId: string): Promise<TripItem> {
    await this.ensureSchema();
    const result = await this.pool.query<TripItem>("SELECT * FROM trip_items WHERE id = $1", [itemId]);
    const item = result.rows[0];
    if (!item) throw new TripNotFoundError(`trip item not found: ${itemId}`);
    return item;
  }

  async getItemByNormalizedContent(tripId: string, normalized: string): Promise<TripItem> {
    await this.ensureSchema();
    const result = await this.pool.query<TripItem>(
      "SELECT * FROM trip_items WHERE trip_id = $1 AND normalized_raw_content = $2",
      [tripId, normalized]
    );
    const item = result.rows[0];
    if (!item) throw new TripNotFoundError("deduped trip item could not be reloaded.");
    return item;
  }

  async listItems(tripId: string, status?: string | null): Promise<TripItem[]> {
    await this.getTrip(tripId);
    if (status == null) {
      const result = await this.pool.query<TripItem>(
        "SELECT * FROM trip_items WHERE trip_id = $1 ORDER BY created_at ASC, id ASC",
        [tripId]
      );
      return result.rows;
    }
    const validatedStatus = validateStatus(status);
    const result = await this.pool.query<TripItem>(
      "SELECT * FROM trip_items WHERE trip_id = $1 AND status = $2 ORDER BY created_at ASC, id ASC",
      [tripId, validatedStatus]
    );
    return result.rows;
  }

  async updateItemStatus(itemId: string, status: string, dayLabel?: string | null, notes?: string | null): Promise<TripItem> {
    await this.ensureSchema();
    const result = await this.pool.query<TripItem>(
      `UPDATE trip_items
       SET status = $1,
           day_label = COALESCE($2, day_label),
           notes = COALESCE($3, notes),
           updated_at = $4
       WHERE id = $5
       RETURNING *`,
      [validateStatus(status), cleanOptional(dayLabel), cleanOptional(notes), utcNow(), itemId]
    );
    const item = result.rows[0];
    if (!item) throw new TripNotFoundError(`trip item not found: ${itemId}`);
    return item;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function isPgUniqueViolation(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "23505";
}
