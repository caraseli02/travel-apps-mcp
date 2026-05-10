import type { Meta, StoryObj } from "@storybook/react";
import { TripItineraryLayout } from "./widget";
import type { TripItineraryProps } from "@/domain/widgetTypes";

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
  raw_content: "Placeholder",
  normalized_raw_content: "placeholder",
  item_type: "activity",
  status: "scheduled",
  source_label: null,
  title: null,
  day_label: null,
  date_note: null,
  price_note: null,
  location_note: null,
  notes: null,
  schedule_label: "09:00",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const defaultProps: TripItineraryProps = {
  trip: mockTrip,
  days: [
    {
      label: "Day 1 – Oct 10 (Thu)",
      items: [
        baseItem({ title: "Arrive at Narita Airport", item_type: "transport", schedule_label: "15:00", location_note: "Narita, Tokyo" }),
        baseItem({ title: "Check-in Shinjuku hotel", item_type: "accommodation", schedule_label: "18:00" }),
      ],
    },
    {
      label: "Day 2 – Oct 11 (Fri)",
      items: [
        baseItem({ title: "Tsukiji Outer Market breakfast", item_type: "food", schedule_label: "08:30" }),
        baseItem({ title: "teamLab Borderless", item_type: "activity", schedule_label: "11:00" }),
        baseItem({ title: "Shibuya crossing at dusk", item_type: "activity", schedule_label: "18:30" }),
      ],
    },
  ],
  unscheduled: [
    baseItem({ title: "Shinjuku Gyoen garden", item_type: "activity" }),
  ],
  gaps: [],
  counts: { scheduled: 5, unscheduled: 1 },
};

const meta: Meta<typeof TripItineraryLayout> = {
  title: "Widgets/TripItinerary",
  component: TripItineraryLayout,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TripItineraryLayout>;

export const Default: Story = {
  args: { props: defaultProps },
};

export const Amsterdam: Story = {
  args: {
    props: {
      trip: mapTrip(fixtures.amsterdamTrip),
      counts: { scheduled: 4, unscheduled: 0 },
      days: fixtures.tripItineraryAmsterdam.days.map((day) => ({
        label: day.label,
        items: day.items.map((i) => ({
          ...mapItem(i, fixtures.amsterdamTrip.id),
          schedule_label: i.schedule_label,
        })),
      })),
      unscheduled: [],
      gaps: fixtures.tripItineraryAmsterdam.gaps,
    },
  },
};

export const Empty: Story = {
  args: {
    props: {
      ...defaultProps,
      days: [],
      unscheduled: [],
      gaps: ["No scheduled items yet. Add dates to your saved items."],
      counts: { scheduled: 0, unscheduled: 0 },
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
