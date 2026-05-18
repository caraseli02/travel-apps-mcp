import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ChatUI, type ChatTurn } from "./chat/ChatUI";
import { TripInboxLayout } from "../trip-inbox/widget";
import { TripBoardLayout } from "../trip-board/widget";
import { TripItineraryLayout } from "../trip-itinerary/widget";
import { TripBudgetLayout } from "../trip-budget/widget";
import { TripClarificationLayout } from "../trip-clarification/widget";
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

function FirstFiveMinutesWorkspacePreview() {
  const [selectedNextStep, setSelectedNextStep] = React.useState<"dates" | "stay" | "transport" | null>(null);
  const datesChosen = selectedNextStep === "dates";
  const stayChosen = selectedNextStep === "stay";
  const transportChosen = selectedNextStep === "transport";

  return (
    <section className="widget first-five-workspace" aria-label="First five minutes trip workspace preview">
      <div className="workspace-brief">
        <div>
          <p className="workspace-kicker">Workspace created</p>
          <h1 className="workspace-title">Venice Trip</h1>
        </div>
        <span className="workspace-status">3-4 days</span>
      </div>

      <div className="workspace-action-strip" aria-label="Workspace actions">
        <button
          className={`workspace-action ${datesChosen ? "is-selected" : ""}`}
          type="button"
          aria-pressed={datesChosen}
          onClick={() => setSelectedNextStep("dates")}
        >
          Add travel dates
        </button>
        <button
          className={`workspace-action ${stayChosen ? "is-selected" : ""}`}
          type="button"
          aria-pressed={stayChosen}
          onClick={() => setSelectedNextStep("stay")}
        >
          Choose stay area
        </button>
        <button
          className={`workspace-action ${transportChosen ? "is-selected" : ""}`}
          type="button"
          aria-pressed={transportChosen}
          onClick={() => setSelectedNextStep("transport")}
        >
          Plan transport
        </button>
      </div>

      <div className="readiness-ledger" aria-label="Trip readiness">
        <div className="readiness-row">
          <span className="readiness-state is-known">Known</span>
          <span className="readiness-value">Destination: Venice</span>
        </div>
        <div className="readiness-row">
          <span className="readiness-state is-known">Known</span>
          <span className="readiness-value">Length: 3-4 days</span>
        </div>
        <div className="readiness-row">
          <span className="readiness-state is-estimated">Estimated</span>
          <span className="readiness-value">Pace: culture and food first</span>
        </div>
        <div className="readiness-row">
          <span className={`readiness-state ${datesChosen ? "is-known" : "is-needs-check"}`}>
            {datesChosen ? "Known" : "Needs check"}
          </span>
          <span className="readiness-value">
            {datesChosen ? "Dates: early October, flexible by 2 days" : "Exact dates and transport"}
          </span>
        </div>
      </div>

      <div className="workspace-next-step">
        <span className="workspace-next-label">Next</span>
        <p>
          {datesChosen
            ? "Dates are staged. Next, choose where to stay."
            : stayChosen
              ? "Stay area is staged. Next, confirm dates before searching hotels."
              : transportChosen
                ? "Transport is staged. Next, confirm dates before checking routes."
                : "Pick travel dates before hotel or flight search."}
        </p>
      </div>

      <div className="workspace-phases" aria-label="Planning phases">
        <section className="workspace-phase is-researching">
          <div className="workspace-phase-header">
            <p>Researching</p>
            <span>3</span>
          </div>
          <ul className="workspace-phase-list">
            {!datesChosen ? <li>Travel dates</li> : null}
            {!stayChosen ? <li>Stay area</li> : null}
            {!transportChosen ? <li>Transport options</li> : null}
            {datesChosen && stayChosen && transportChosen ? <li>No open first-step blockers</li> : null}
          </ul>
        </section>

        <section className="workspace-phase is-chosen">
          <div className="workspace-phase-header">
            <p>Chosen</p>
            <span>2</span>
          </div>
          <ul className="workspace-phase-list">
            <li>3-4 day trip length</li>
            <li>Culture + food focus</li>
            {datesChosen ? <li>Early October, flexible</li> : null}
            {stayChosen ? <li>Central, walkable stay area</li> : null}
            {transportChosen ? <li>Compare rail and flights</li> : null}
          </ul>
        </section>

        <section className="workspace-phase is-confirmed">
          <div className="workspace-phase-header">
            <p>Confirmed</p>
            <span>0</span>
          </div>
          <ul className="workspace-phase-list">
            <li>No bookings yet</li>
          </ul>
        </section>
      </div>

      {selectedNextStep ? (
        <p className="workspace-feedback" role="status">
          Staged: {selectedNextStep === "dates" ? "travel dates" : selectedNextStep === "stay" ? "stay area" : "transport plan"}.
          In the production widget this action would call the matching trip tool and update ChatGPT's context.
        </p>
      ) : null}
    </section>
  );
}

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

export const Case1BFirstFiveMinutesWorkspace: Story = {
  name: "Case 1B: First 5 Minutes Workspace",
  args: {
    turns: [
      {
        role: "user",
        text: "I want to plan a trip to Venice",
      },
      {
        role: "assistant",
        text: "I'll shape the workspace first so we only ask for the few details that change the plan.",
        widget: (
          <TripClarificationLayout
            props={{
              session_id: "workflow-venice-first-five",
              intent: "plan_trip",
              destination: "Venice",
              current_index: 0,
              total_questions: 4,
              known_fields: { destination: "Venice" },
              answers: {},
              questions: [
                {
                  id: "planning_priority",
                  prompt: "What kind of trip are you planning?",
                  reason: "This helps me ask the right questions first.",
                  required: false,
                  answer_type: "single_choice",
                  options: [
                    { id: "priority-1", label: "Experience-first", value: "experience_first" },
                    { id: "priority-2", label: "Budget-first", value: "budget_first" },
                    { id: "priority-3", label: "Date-constrained", value: "date_constrained" },
                    { id: "priority-4", label: "Loyalty-driven", value: "loyalty_driven" },
                  ],
                  allow_free_text: true,
                  allow_skip: true,
                },
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
                  id: "travel_style",
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
              ],
            }}
          />
        ),
      },
      {
        role: "user",
        text: "Experience-first, probably 3-4 days, mostly culture and food.",
      },
      {
        role: "assistant",
        text: "I created the workspace because the destination and planning intent are clear. Here's what we know and what still needs work.",
        widget: <FirstFiveMinutesWorkspacePreview />,
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

export const Case6Packing: Story = {
  name: "Case 6: Packing Checklist",
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
