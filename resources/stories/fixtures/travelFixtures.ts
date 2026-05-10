export interface WeatherData {
  city: string;
  temperature_celsius: number;
  temperature_fahrenheit: number;
  conditions: string;
  humidity: number;
  wind_speed: number;
  precipitation_probability: number;
  timestamp: string;
}

export interface ForecastDay {
  date: string;
  temp_high_c: number;
  temp_low_c: number;
  conditions: string;
  precipitation_prob: number;
  humidity: number;
  wind_speed: number;
}

export interface ForecastData {
  city: string;
  forecasts: ForecastDay[];
}

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

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface DestinationTip {
  category: string;
  icon: string;
  text: string;
}

export interface Activity {
  name: string;
  description: string;
  duration_hours: number;
  cost_usd: number;
  weather_dependent: boolean;
}

export interface DestinationGuide {
  city: string;
  country: string;
  overview: string;
  best_time: string;
  coordinates: Coordinates;
  tips: DestinationTip[];
  activities: Activity[];
}

export interface ActivityCard {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_hours: number;
  cost_usd: number;
  weather_dependent: boolean;
  best_weather: string[];
}

export interface ActivityCards {
  city: string;
  weather: string;
  season: string;
  activities: ActivityCard[];
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

export const currentWeatherMadrid: WeatherData = {
  city: "Madrid",
  temperature_celsius: 24,
  temperature_fahrenheit: 75,
  conditions: "Clear Sky",
  humidity: 48,
  wind_speed: 3,
  precipitation_probability: 5,
  timestamp: "2026-05-05T12:00:00Z",
};

export const forecastMadrid: ForecastData = {
  city: "Madrid",
  forecasts: [
    {
      date: "2026-05-01",
      temp_high_c: 23,
      temp_low_c: 13,
      conditions: "Scattered Clouds",
      precipitation_prob: 10,
      humidity: 58,
      wind_speed: 4,
    },
    {
      date: "2026-05-02",
      temp_high_c: 25,
      temp_low_c: 14,
      conditions: "Clear Sky",
      precipitation_prob: 0,
      humidity: 48,
      wind_speed: 3,
    },
    {
      date: "2026-05-03",
      temp_high_c: 21,
      temp_low_c: 12,
      conditions: "Light Rain",
      precipitation_prob: 62,
      humidity: 78,
      wind_speed: 6,
    },
    {
      date: "2026-05-04",
      temp_high_c: 20,
      temp_low_c: 11,
      conditions: "Overcast Clouds",
      precipitation_prob: 35,
      humidity: 72,
      wind_speed: 5,
    },
    {
      date: "2026-05-05",
      temp_high_c: 24,
      temp_low_c: 13,
      conditions: "Clear Sky",
      precipitation_prob: 5,
      humidity: 50,
      wind_speed: 3,
    },
  ],
};

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

export const destinationGuideMadrid: DestinationGuide = {
  city: "Madrid",
  country: "Spain",
  overview: "A walkable capital with art museums, parks, late dining, plazas, and tapas culture.",
  best_time: "March-May, September-November",
  coordinates: { lat: 40.4168, lon: -3.7038 },
  tips: [
    {
      category: "culture",
      icon: "clock",
      text: "Dinner often starts after 9pm, especially on weekends.",
    },
    {
      category: "weather",
      icon: "sun",
      text: "In summer, plan outdoor walks early or late to avoid peak heat.",
    },
    {
      category: "transportation",
      icon: "metro",
      text: "The metro is efficient and usually easier than taxis for central trips.",
    },
  ],
  activities: [
    {
      name: "Prado Museum",
      description: "Major European art museum with works by Velazquez, Goya, and El Greco.",
      duration_hours: 3,
      cost_usd: 18,
      weather_dependent: false,
    },
    {
      name: "Retiro Park",
      description: "Large central park for walking, boating, and relaxed breaks.",
      duration_hours: 2,
      cost_usd: 0,
      weather_dependent: true,
    },
    {
      name: "Tapas Tour",
      description: "Evening route through tapas bars in La Latina or Huertas.",
      duration_hours: 3,
      cost_usd: 45,
      weather_dependent: false,
    },
  ],
};

export const activityCardsLondon: ActivityCards = {
  city: "London",
  weather: "rain",
  season: "spring",
  activities: [
    {
      id: "british-museum",
      name: "British Museum",
      category: "museum",
      description: "Large collection of global history and culture with free entry.",
      duration_hours: 3,
      cost_usd: 0,
      weather_dependent: false,
      best_weather: ["rain", "cold", "cloudy"],
    },
    {
      id: "broadway-show",
      name: "West End Theatre",
      category: "nightlife",
      description: "A comfortable evening plan when outdoor conditions are poor.",
      duration_hours: 3,
      cost_usd: 90,
      weather_dependent: false,
      best_weather: ["any"],
    },
  ],
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

export interface ExplorePlace {
  id: string;
  title: string;
  subtitle: string;
  image_url?: string;
  url?: string;
}

export interface ExplorePlaces {
  section_title?: string;
  browse_url?: string;
  places: ExplorePlace[];
}

export const explorePlacesValencia: ExplorePlaces = {
  section_title: "Explore",
  browse_url: "https://example.com/search?q=valencia",
  places: [
    {
      id: "valencia-attractions",
      title: "Best attractions in Valencia",
      subtitle: "Most often-seen on the web",
      image_url: "https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=600&q=80",
      url: "https://example.com/attractions/valencia",
    },
    {
      id: "valencia-restaurants",
      title: "Best restaurants in Valencia",
      subtitle: "Most often-seen on the web",
      image_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
      url: "https://example.com/restaurants/valencia",
    },
    {
      id: "valencia-hotels",
      title: "Search hotels with transparent pricing",
      subtitle: "Unlike most sites, we don't sort based on commissions",
      image_url: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
      url: "https://example.com/hotels/valencia",
    },
    {
      id: "valencia-things-to-do",
      title: "Things to do in Valencia",
      subtitle: "Curated experiences for every traveller",
      image_url: "https://images.unsplash.com/photo-1502920514313-52581002a659?w=600&q=80",
      url: "https://example.com/things-to-do/valencia",
    },
    {
      id: "valencia-day-trips",
      title: "Day trips from Valencia",
      subtitle: "Easy escapes under 2 hours away",
      image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
      url: "https://example.com/day-trips/valencia",
    },
  ],
};

export const explorePlacesMinimal: ExplorePlaces = {
  section_title: "Explore",
  places: [
    {
      id: "minimal-1",
      title: "Top sights in the city centre",
      subtitle: "Handpicked by local experts",
    },
    {
      id: "minimal-2",
      title: "Hidden gems worth visiting",
      subtitle: "Off the beaten path",
    },
    {
      id: "minimal-3",
      title: "Family-friendly activities",
      subtitle: "Great for all ages",
    },
  ],
};
