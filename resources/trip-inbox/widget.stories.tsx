import type { Meta, StoryObj } from "@storybook/react";
import { TripInboxLayout } from "./widget";
import type { TripInboxProps } from "@/domain/widgetTypes";

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

const baseItem = (overrides = {}) => ({
  id: `item-${Math.random().toString(36).slice(2)}`,
  trip_id: "trip-1",
  raw_content: "Placeholder raw fragment",
  normalized_raw_content: "placeholder raw fragment",
  item_type: "note",
  status: "inbox",
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

const defaultProps: TripInboxProps = {
  trip: mockTrip,
  items: [
    baseItem({ title: "Tsukiji outer market for breakfast", item_type: "food", source_label: "friend tip" }),
    baseItem({ title: "Airbnb near Arashiyama", item_type: "accommodation", price_note: "~$120/night", source_label: "airbnb.com" }),
    baseItem({ raw_content: "Maybe rent bikes in Kyoto? Someone recommended it", item_type: "activity" }),
    baseItem({ title: "Onsen ryokan experience", item_type: "accommodation", price_note: "~$200/night" }),
    baseItem({ raw_content: "Look into Mt Fuji day trip from Tokyo – 2h shinkansen", item_type: "activity", source_label: "reddit r/JapanTravel" }),
  ],
};

const meta: Meta<typeof TripInboxLayout> = {
  title: "Widgets/TripInbox",
  component: TripInboxLayout,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TripInboxLayout>;

export const Default: Story = {
  args: { props: defaultProps },
};

export const Amsterdam: Story = {
  args: {
    props: {
      trip: mapTrip(fixtures.amsterdamTrip),
      items: fixtures.tripInboxAmsterdam.items.map((i) =>
        mapItem(i, fixtures.amsterdamTrip.id)
      ),
    },
  },
};

export const Empty: Story = {
  args: {
    props: {
      ...defaultProps,
      items: [],
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
