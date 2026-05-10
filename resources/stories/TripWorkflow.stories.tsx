import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ChatUI, type ChatTurn } from "./chat/ChatUI";
import { TripInboxLayout } from "../trip-inbox/widget";
import { TripBoardLayout } from "../trip-board/widget";
import { TripItineraryLayout } from "../trip-itinerary/widget";
import { TripBudgetLayout } from "../trip-budget/widget";
import { TripClarificationLayout } from "../trip-clarification/widget";
import { ExplorePlacesLayout } from "../explore-places/widget";
import { TravelDestinationGuideLayout } from "../travel-destination-guide/widget";
import { TravelActivityCardsLayout } from "../travel-activity-cards/widget";
import { PackingChecklistLayout } from "../packing-checklist/widget";
import * as fixtures from "./fixtures/travelFixtures";

const meta: Meta<typeof ChatUI> = {
  title: "Workflows/Trip Planning Scenarios",
  component: ChatUI,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ChatUI>;

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

export const Case1CreateTrip: Story = {
  name: "Case 1: Create Trip",
  args: {
    turns: [
      {
        role: "user",
        text: "I want to plan a trip to Barcelona",
      },
      {
        role: "assistant",
        text: "I've set up your Barcelona trip workspace! What would you like to save to it?",
      },
    ],
  },
};

export const Case1ClarifyTrip: Story = {
  name: "Case 1A: Clarify Trip Intent",
  args: {
    turns: [
      {
        role: "user",
        text: "I want to plan a trip to Venecia",
      },
      {
        role: "assistant",
        text: "I'll help you shape the trip before creating the workspace.",
        widget: (
          <TripClarificationLayout
            props={{
              session_id: "workflow-venice-clarify",
              intent: "plan_trip",
              destination: "Venice",
              current_index: 0,
              total_questions: 3,
              known_fields: { destination: "Venice" },
              answers: {},
              questions: [
                {
                  id: "duration",
                  prompt: "How long are you planning to stay in Venice?",
                  reason: "This sets the itinerary depth and pace.",
                  required: false,
                  answer_type: "single_choice",
                  options: [
                    { id: "duration-1", label: "1-2 days", value: "1-2 days" },
                    { id: "duration-2", label: "3-4 days", value: "3-4 days" },
                    { id: "duration-3", label: "5-7 days", value: "5-7 days" },
                    { id: "duration-4", label: "1+ weeks", value: "1+ weeks" },
                  ],
                  allow_free_text: true,
                  allow_skip: true,
                },
                {
                  id: "style",
                  prompt: "What's your main travel style?",
                  required: false,
                  answer_type: "single_choice",
                  options: [
                    { id: "style-1", label: "Cultural & sightseeing", value: "culture" },
                    { id: "style-2", label: "Food & local experiences", value: "food" },
                    { id: "style-3", label: "Relaxation & photography", value: "relaxed" },
                    { id: "style-4", label: "Mixed experience", value: "mixed" },
                  ],
                  allow_free_text: true,
                  allow_skip: true,
                },
                {
                  id: "season",
                  prompt: "When are you thinking of going?",
                  required: false,
                  answer_type: "single_choice",
                  options: [
                    { id: "season-1", label: "Summer (peak season)", value: "summer" },
                    { id: "season-2", label: "Spring/Fall (shoulder)", value: "shoulder" },
                    { id: "season-3", label: "Winter (quiet)", value: "winter" },
                    { id: "season-4", label: "No preference yet", value: "no preference" },
                  ],
                  allow_free_text: true,
                  allow_skip: true,
                },
              ],
            }}
          />
        ),
      },
    ],
  },
};

export const Case2SaveInboxItem: Story = {
  name: "Case 2: Save Inbox Item",
  args: {
    turns: [
      {
        role: "user",
        text: "Save this link for a hotel I have for Venice: https://booking.com/venice-hotel-123",
      },
      {
        role: "assistant",
        text: "Saved! I've added that hotel to your Venice trip inbox for review.",
        widget: (
          <TripInboxLayout
            props={{
              trip: {
                id: "venice-123",
                title: "Venice Trip",
                destination: "Venice",
                start_date: null,
                end_date: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              items: [
                {
                  id: "item-1",
                  trip_id: "venice-123",
                  raw_content: "https://booking.com/venice-hotel-123",
                  normalized_raw_content: "https://booking.com/venice-hotel-123",
                  item_type: "hotel",
                  status: "inbox",
                  title: "Venice Hotel Option",
                  source_label: "booking.com",
                  day_label: null,
                  date_note: null,
                  price_note: null,
                  location_note: null,
                  notes: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ],
            }}
          />
        ),
      },
    ],
  },
};

export const Case3TripBoard: Story = {
  name: "Case 3: Trip Board",
  args: {
    turns: [
      {
        role: "user",
        text: "Show me my trip board for Amsterdam.",
      },
      {
        role: "assistant",
        text: "Here is your current decision board for Amsterdam:",
        widget: (
          <TripBoardLayout
            props={{
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
            }}
          />
        ),
      },
    ],
  },
};

export const Case4TripItinerary: Story = {
  name: "Case 4: Trip Itinerary",
  args: {
    turns: [
      {
        role: "user",
        text: "What does my itinerary look like?",
      },
      {
        role: "assistant",
        text: "Here is your day-by-day plan for Amsterdam:",
        widget: (
          <TripItineraryLayout
            props={{
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
            }}
          />
        ),
      },
    ],
  },
};

export const Case5TripBudget: Story = {
  name: "Case 5: Trip Budget",
  args: {
    turns: [
      {
        role: "user",
        text: "How am I doing on budget?",
      },
      {
        role: "assistant",
        text: "You've spent about 65% of your budget. Here's the breakdown:",
        widget: (
          <TripBudgetLayout
            props={{
              trip: mapTrip(fixtures.amsterdamTrip),
              spent: fixtures.tripBudgetAmsterdam.spent,
              target: fixtures.tripBudgetAmsterdam.target,
              remaining: fixtures.tripBudgetAmsterdam.remaining,
              percent_used: fixtures.tripBudgetAmsterdam.percent_used,
              currency: fixtures.tripBudgetAmsterdam.currency,
              category_totals: fixtures.tripBudgetAmsterdam.category_totals,
              rows: fixtures.tripBudgetAmsterdam.rows.map((row) => ({
                id: Math.random().toString(36).substr(2, 9),
                title: row.title,
                item_type: row.item_type,
                status: row.status,
                amount: row.amount,
                currency: fixtures.tripBudgetAmsterdam.currency,
                note: "",
              })),
              counts: {
                priced_items: 4,
                tracked_categories: 3,
                party_size: 2,
                nights: 4,
              },
            }}
          />
        ),
      },
    ],
  },
};

export const Case6Explore: Story = {
  name: "Case 6: Explore Places",
  args: {
    turns: [
      {
        role: "user",
        text: "I'm thinking of Valencia. What's there to do?",
      },
      {
        role: "assistant",
        text: "Valencia is beautiful! Here are some top picks to explore:",
        widget: <ExplorePlacesLayout props={fixtures.explorePlacesValencia} />,
      },
    ],
  },
};

export const Case7Guide: Story = {
  name: "Case 7: Destination Guide",
  args: {
    turns: [
      {
        role: "user",
        text: "Tell me more about Madrid.",
      },
      {
        role: "assistant",
        text: "Madrid is a vibrant capital with rich culture. Here's a quick guide:",
        widget: <TravelDestinationGuideLayout props={fixtures.destinationGuideMadrid} />,
      },
    ],
  },
};

export const Case8Activities: Story = {
  name: "Case 8: Activity Cards",
  args: {
    turns: [
      {
        role: "user",
        text: "It's raining in London today. What can I do indoors?",
      },
      {
        role: "assistant",
        text: "London has plenty of indoor options. These are great for a rainy spring day:",
        widget: <TravelActivityCardsLayout props={fixtures.activityCardsLondon} />,
      },
    ],
  },
};

export const Case9Packing: Story = {
  name: "Case 9: Packing Checklist",
  args: {
    turns: [
      {
        role: "user",
        text: "Help me pack for my 5-day trip to Amsterdam.",
      },
      {
        role: "assistant",
        text: "I've generated a weather-aware packing list for Amsterdam. It might rain, so I've included an umbrella!",
        widget: <PackingChecklistLayout props={fixtures.packingChecklistAmsterdam} />,
      },
    ],
  },
};
