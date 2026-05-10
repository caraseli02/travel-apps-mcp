import type { Meta, StoryObj } from "@storybook/react";
import { TripBoardLayout } from "./widget";
import type { TripBoardProps } from "@/domain/widgetTypes";

import * as fixtures from "../stories/fixtures/travelFixtures";

const mockTrip = {
  id: "trip-1",
  title: "Tokyo & Kyoto Adventure",
  destination: "Japan",
  start_date: "2025-10-10",
  end_date: "2025-10-24",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Helper to map fixture Trip to domain Trip
const mapTrip = (t: any) => ({
  id: t.id,
  title: t.title,
  destination: "Amsterdam",
  start_date: "2026-05-01",
  end_date: "2026-05-05",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Helper to map fixture Item to domain Item
const mapItem = (item: any, tripId: string) => ({
  id: Math.random().toString(36).substr(2, 9),
  trip_id: tripId,
  raw_content: item.raw_content || item.title,
  normalized_raw_content: item.raw_content || item.title,
  item_type: item.item_type,
  status: item.status || "inbox",
  title: item.title,
  source_label: item.source_label || null,
  day_label: item.day_label || null,
  date_note: null,
  price_note: item.price_note || null,
  location_note: item.location_note || null,
  notes: item.notes || null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

const mockItemData = (overrides: Partial<TripBoardProps["lanes"]["booked"][number]> = {}) => ({
  id: `item-${Math.random().toString(36).slice(2)}`,
  trip_id: "trip-1",
  raw_content: "Placeholder content",
  normalized_raw_content: "placeholder content",
  item_type: "accommodation",
  status: "shortlisted",
  source_label: null,
  title: null,
  day_label: null,
  date_note: null,
  price_note: null,
  location_note: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const defaultProps: TripBoardProps = {
  trip: mockTrip,
  lanes: {
    open_decisions: [
      mockItemData({ title: "Which ryokan to book in Kyoto?", item_type: "accommodation", status: "open_decision" }),
      mockItemData({ title: "Bullet train or overnight bus?", item_type: "transport", status: "open_decision" }),
    ],
    shortlisted: [
      mockItemData({ title: "Shibuya Sky observation deck", item_type: "activity", status: "shortlisted" }),
      mockItemData({ title: "Arashiyama Bamboo Grove", item_type: "activity", status: "shortlisted" }),
    ],
    booked: [
      mockItemData({ title: "ANA Flight TYO → NRT", item_type: "flight", status: "booked" }),
      mockItemData({ title: "Shinjuku Washington Hotel", item_type: "accommodation", status: "booked" }),
    ],
    itinerary_draft: [
      mockItemData({ title: "Day 1: Arrive & settle in", item_type: "note", status: "draft", day_label: "Day 1" }),
    ],
    missing_pieces: ["Airport transfer plan", "Travel insurance"],
  },
  counts: { total: 9, by_status: { booked: 2, shortlisted: 2 }, by_type: { flight: 1 } },
};

const meta: Meta<typeof TripBoardLayout> = {
  title: "Widgets/TripBoard",
  component: TripBoardLayout,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TripBoardLayout>;

export const Default: Story = {
  args: { props: defaultProps },
};

export const Amsterdam: Story = {
  args: {
    props: {
      trip: mapTrip(fixtures.amsterdamTrip),
      counts: {
        total: 6,
        by_status: { booked: 1, shortlisted: 1, open: 1, draft: 1 },
        by_type: { hotel: 1, activity: 1, transport: 1, food: 1 },
      },
      lanes: {
        open_decisions: fixtures.tripBoardAmsterdam.lanes.open_decisions.map((i) =>
          mapItem(i, fixtures.amsterdamTrip.id)
        ),
        shortlisted: fixtures.tripBoardAmsterdam.lanes.shortlisted.map((i) =>
          mapItem(i, fixtures.amsterdamTrip.id)
        ),
        booked: fixtures.tripBoardAmsterdam.lanes.booked.map((i) =>
          mapItem(i, fixtures.amsterdamTrip.id)
        ),
        itinerary_draft: fixtures.tripBoardAmsterdam.lanes.itinerary_draft.map((i) =>
          mapItem(i, fixtures.amsterdamTrip.id)
        ),
        missing_pieces: fixtures.tripBoardAmsterdam.lanes.missing_pieces,
      },
    },
  },
};

export const Empty: Story = {
  args: {
    props: {
      ...defaultProps,
      lanes: {
        open_decisions: [],
        shortlisted: [],
        booked: [],
        itinerary_draft: [],
        missing_pieces: [],
      },
      counts: { total: 0, by_status: {}, by_type: {} },
    },
  },
};

export const ErrorState: Story = {
  args: {
    props: {
      ...defaultProps,
      error: fixtures.errorOutput.error,
    } as any,
  },
};
