export interface WeatherSummary {
  city: string;
  weather_category: string;
  min_temp_c: number;
  max_temp_c: number;
  max_precipitation_prob: number;
  rain_expected: boolean;
}

export interface WeatherBasedItem {
  item: string;
  reason: string;
}

export interface PackingChecklist {
  destination: string;
  duration_days: number;
  weather_summary: WeatherSummary;
  categories: {
    clothing: string[];
    toiletries: string[];
    electronics: string[];
    documents: string[];
    accessories: string[];
  };
  weather_based_items: WeatherBasedItem[];
  notes: string[];
}

export interface Trip {
  id: string;
  title: string;
}

export interface TripInboxItem {
  item_type: string;
  source_label: string;
  title: string;
  raw_content: string;
  notes?: string;
}

export interface TripInbox {
  trip: Trip;
  items: TripInboxItem[];
}

export interface TripBoardItem {
  item_type: string;
  status: string;
  title: string;
  raw_content?: string;
  notes?: string;
  day_label?: string;
}

export interface TripBoard {
  trip: Trip;
  counts: { total: number };
  lanes: {
    open_decisions: TripBoardItem[];
    shortlisted: TripBoardItem[];
    booked: TripBoardItem[];
    itinerary_draft: TripBoardItem[];
    missing_pieces: string[];
  };
}

export interface CategoryTotal {
  category: string;
  amount: number;
}

export interface BudgetRow {
  title: string;
  item_type: string;
  status: string;
  amount: number;
}

export interface TripBudget {
  trip: Trip;
  currency: string;
  spent: number;
  target: number;
  remaining: number;
  percent_used: number;
  category_totals: CategoryTotal[];
  rows: BudgetRow[];
}

export interface ItineraryItem {
  title: string;
  schedule_label: string;
  location_note: string;
  notes?: string;
  price_note?: string;
}

export interface ItineraryDay {
  label: string;
  items: ItineraryItem[];
}

export interface TripItinerary {
  trip: Trip;
  counts: { scheduled: number };
  days: ItineraryDay[];
  gaps: string[];
}

export interface ErrorOutput {
  error: string;
}

export const packingChecklistAmsterdam: PackingChecklist = {
  destination: "Amsterdam",
  duration_days: 5,
  weather_summary: {
    city: "Amsterdam",
    weather_category: "mild",
    min_temp_c: 11,
    max_temp_c: 19,
    max_precipitation_prob: 68,
    rain_expected: true,
  },
  categories: {
    clothing: ["Light jacket", "Long pants", "Comfortable shoes"],
    toiletries: ["Toothbrush", "Toothpaste", "Deodorant", "Medication"],
    electronics: ["Phone charger", "Power adapter", "Headphones"],
    documents: ["Passport or ID", "Travel insurance", "Booking confirmations"],
    accessories: ["Day bag", "Reusable water bottle", "Umbrella", "Rain jacket", "Laundry bag"],
  },
  weather_based_items: [
    {
      item: "Umbrella",
      reason: "Precipitation probability reaches 68%",
    },
    {
      item: "Rain jacket",
      reason: "Precipitation probability reaches 68%",
    },
  ],
  notes: ["Pack 3 days of core clothing plus 1 extra clothing set(s)."],
};

export const longPackingChecklistAmsterdam: PackingChecklist = {
  ...packingChecklistAmsterdam,
  duration_days: 12,
  categories: {
    ...packingChecklistAmsterdam.categories,
    clothing: [
      "Light jacket",
      "Long pants",
      "Comfortable shoes",
      "Sweater",
      "Sleepwear",
      "Extra socks",
      "Laundry kit",
      "Smart casual outfit",
    ],
    accessories: [
      "Day bag",
      "Reusable water bottle",
      "Umbrella",
      "Rain jacket",
      "Laundry bag",
      "Sunglasses",
      "Compact tote",
      "Travel lock",
    ],
  },
};

export const amsterdamTrip: Trip = {
  id: "trip-amsterdam-2026",
  title: "Amsterdam spring trip",
};

export const tripInboxAmsterdam: TripInbox = {
  trip: amsterdamTrip,
  items: [
    {
      item_type: "hotel",
      source_label: "booking note",
      title: "Hotel V Nesplein",
      raw_content: "Central hotel near Dam Square, cancellable until May 1.",
      notes: "Shortlisted for location and transit access.",
    },
    {
      item_type: "activity",
      source_label: "saved idea",
      title: "Rijksmuseum morning slot",
      raw_content: "Reserve a 10:00 entry to avoid afternoon crowds.",
    },
  ],
};

export const tripBoardAmsterdam: TripBoard = {
  trip: amsterdamTrip,
  counts: { total: 6 },
  lanes: {
    open_decisions: [
      {
        item_type: "transport",
        status: "open",
        title: "Airport transfer",
        raw_content: "Compare train from Schiphol versus taxi after arrival.",
      },
    ],
    shortlisted: [
      {
        item_type: "hotel",
        status: "shortlisted",
        title: "Hotel V Nesplein",
        notes: "Strong central option, still needs final price check.",
      },
    ],
    booked: [
      {
        item_type: "activity",
        status: "booked",
        title: "Rijksmuseum",
        day_label: "Day 2",
        notes: "Morning ticket confirmed.",
      },
    ],
    itinerary_draft: [
      {
        item_type: "food",
        status: "draft",
        title: "Jordaan dinner walk",
        day_label: "Day 1",
        notes: "Keep flexible depending on arrival energy.",
      },
    ],
    missing_pieces: ["Dinner reservations", "Rain backup for canal day"],
  },
};

export const tripBudgetAmsterdam: TripBudget = {
  trip: amsterdamTrip,
  currency: "EUR",
  spent: 780,
  target: 1200,
  remaining: 420,
  percent_used: 65,
  category_totals: [
    { category: "lodging", amount: 520 },
    { category: "activities", amount: 110 },
    { category: "food", amount: 150 },
  ],
  rows: [
    { title: "Hotel deposit", item_type: "hotel", status: "shortlisted", amount: 520 },
    { title: "Rijksmuseum tickets", item_type: "activity", status: "booked", amount: 50 },
    { title: "Canal cruise hold", item_type: "activity", status: "draft", amount: 60 },
    { title: "Dinner estimate", item_type: "food", status: "draft", amount: 150 },
  ],
};

export const tripItineraryAmsterdam: TripItinerary = {
  trip: amsterdamTrip,
  counts: { scheduled: 4 },
  days: [
    {
      label: "Day 1",
      items: [
        {
          title: "Arrive and check in",
          schedule_label: "15:00",
          location_note: "Centrum",
          notes: "Keep the evening light after travel.",
        },
        {
          title: "Jordaan dinner walk",
          schedule_label: "19:30",
          location_note: "Jordaan",
          price_note: "EUR 45 estimate",
        },
      ],
    },
    {
      label: "Day 2",
      items: [
        {
          title: "Rijksmuseum",
          schedule_label: "10:00",
          location_note: "Museumplein",
          price_note: "Booked",
        },
        {
          title: "Canal cruise",
          schedule_label: "16:00",
          location_note: "Prinsengracht",
          notes: "Swap for indoor cafe time if rain is heavy.",
        },
      ],
    },
  ],
  gaps: ["Add dinner plans for Day 2.", "Confirm airport transfer."],
};

export const errorOutput: ErrorOutput = {
  error: "The travel service returned an error. Try again with a narrower request.",
};
