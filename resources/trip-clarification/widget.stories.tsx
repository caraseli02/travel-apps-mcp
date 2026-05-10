import type { Meta, StoryObj } from "@storybook/react";
import { TripClarificationLayout } from "./widget";
import type { TripClarificationProps } from "@/domain/widgetTypes";

const baseProps: TripClarificationProps = {
  session_id: "clarify-venice-plan",
  intent: "plan_trip",
  destination: "Venice",
  current_index: 0,
  total_questions: 3,
  known_fields: {
    destination: "Venice",
  },
  questions: [
    {
      id: "duration",
      prompt: "How long are you planning to stay in Venice?",
      reason: "This helps shape the itinerary pace and how much to fit in.",
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
  answers: {},
};

const hotelProps: TripClarificationProps = {
  session_id: "clarify-paris-hotel",
  intent: "book_hotel",
  destination: "Paris",
  current_index: 0,
  total_questions: 3,
  known_fields: {
    destination: "Paris",
    party_size: 2,
  },
  questions: [
    {
      id: "hotel-dates",
      prompt: "When do you need the hotel?",
      reason: "Dates or nights determine availability and realistic pricing.",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "hotel-dates-1", label: "I know exact dates", value: "exact dates" },
        { id: "hotel-dates-2", label: "A weekend", value: "weekend" },
        { id: "hotel-dates-3", label: "3-4 nights", value: "3-4 nights" },
        { id: "hotel-dates-4", label: "Still flexible", value: "flexible" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
    {
      id: "hotel-area",
      prompt: "Which area would you prefer?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "hotel-area-1", label: "Central and walkable", value: "central" },
        { id: "hotel-area-2", label: "Quiet residential", value: "quiet" },
        { id: "hotel-area-3", label: "Near nightlife/restaurants", value: "nightlife" },
        { id: "hotel-area-4", label: "Best value area", value: "value" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
    {
      id: "hotel-budget",
      prompt: "What's a comfortable nightly budget?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "hotel-budget-1", label: "Under EUR 120/night", value: "under 120" },
        { id: "hotel-budget-2", label: "EUR 120-220/night", value: "120-220" },
        { id: "hotel-budget-3", label: "EUR 220-350/night", value: "220-350" },
        { id: "hotel-budget-4", label: "Flexible for the right place", value: "flexible" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
  ],
  answers: {},
};

const flightProps: TripClarificationProps = {
  session_id: "clarify-tokyo-flight",
  intent: "book_flight",
  destination: "Tokyo",
  current_index: 0,
  total_questions: 3,
  known_fields: {
    destination: "Tokyo",
  },
  questions: [
    {
      id: "origin",
      prompt: "Where are you flying from?",
      reason: "Origin airport is the biggest missing piece for flight search.",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "origin-1", label: "Barcelona", value: "Barcelona" },
        { id: "origin-2", label: "Madrid", value: "Madrid" },
        { id: "origin-3", label: "London", value: "London" },
        { id: "origin-4", label: "Not sure yet", value: "unknown" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
    {
      id: "flight-dates",
      prompt: "How fixed are your travel dates?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "flight-dates-1", label: "Exact dates", value: "exact" },
        { id: "flight-dates-2", label: "Flexible by a few days", value: "few days flexible" },
        { id: "flight-dates-3", label: "Flexible by a month", value: "month flexible" },
        { id: "flight-dates-4", label: "No dates yet", value: "no dates" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
    {
      id: "flight-priority",
      prompt: "What should we optimize for?",
      required: false,
      answer_type: "single_choice",
      options: [
        { id: "flight-priority-1", label: "Lowest price", value: "price" },
        { id: "flight-priority-2", label: "Shortest travel time", value: "duration" },
        { id: "flight-priority-3", label: "Fewer stops", value: "stops" },
        { id: "flight-priority-4", label: "Good arrival time", value: "arrival" },
      ],
      allow_free_text: true,
      allow_skip: true,
    },
  ],
  answers: {},
};

const meta: Meta<typeof TripClarificationLayout> = {
  title: "Widgets/TripClarification",
  component: TripClarificationLayout,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof TripClarificationLayout>;

export const PlanTripVenice: Story = {
  args: { props: baseProps },
};

export const HotelSearchParis: Story = {
  args: { props: hotelProps },
};

export const FlightSearchTokyo: Story = {
  args: { props: flightProps },
};

export const KnownMemorySkipsDuration: Story = {
  args: {
    props: {
      ...baseProps,
      session_id: "clarify-venice-known-memory",
      current_index: 0,
      total_questions: 2,
      known_fields: {
        destination: "Venice",
        duration: "3-4 days",
        party_size: 2,
      },
      questions: baseProps.questions.slice(1),
    },
  },
};

export const SecondQuestionSelected: Story = {
  args: {
    props: {
      ...baseProps,
      current_index: 1,
      answers: {
        duration: "3-4 days",
        style: "food",
      },
    },
  },
};

export const MultiSelectInterests: Story = {
  args: {
    props: {
      ...baseProps,
      session_id: "clarify-venice-multi-select",
      current_index: 0,
      total_questions: 2,
      questions: [
        {
          id: "interests",
          prompt: "What should the trip include?",
          reason: "Choose all that matter so the plan can balance the itinerary.",
          required: false,
          answer_type: "multi_choice",
          options: [
            { id: "interests-1", label: "Museums & historic sights", value: "museums" },
            { id: "interests-2", label: "Food markets & local restaurants", value: "food" },
            { id: "interests-3", label: "Photography walks", value: "photography" },
            { id: "interests-4", label: "Day trips nearby", value: "day trips" },
          ],
          allow_free_text: true,
          allow_skip: true,
        },
        baseProps.questions[2],
      ],
      answers: {
        interests: ["museums", "food"],
      },
    },
  },
};

export const FreeTextAnswer: Story = {
  args: {
    props: {
      ...hotelProps,
      answers: {
        "hotel-area": "Near the Marais, but quiet enough to sleep",
      },
    },
  },
};

export const SkippedQuestion: Story = {
  args: {
    props: {
      ...flightProps,
      current_index: 1,
      answers: {
        origin: "skipped",
      },
    },
  },
};

export const Empty: Story = {
  args: {
    props: {
      ...baseProps,
      session_id: "clarify-empty",
      total_questions: 0,
      questions: [],
      answers: {},
    },
  },
};
