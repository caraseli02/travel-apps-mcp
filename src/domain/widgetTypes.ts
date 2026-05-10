import { z } from "zod";

const nullableString = z.string().nullable();

export const tripSchema = z.object({
  id: z.string(),
  title: z.string(),
  destination: nullableString,
  start_date: nullableString,
  end_date: nullableString,
  created_at: z.string(),
  updated_at: z.string(),
});

export const tripItemSchema = z.object({
  id: z.string(),
  trip_id: z.string(),
  raw_content: z.string(),
  normalized_raw_content: z.string(),
  item_type: z.string(),
  status: z.string(),
  source_label: nullableString,
  title: nullableString,
  day_label: nullableString,
  date_note: nullableString,
  price_note: nullableString,
  location_note: nullableString,
  notes: nullableString,
  created_at: z.string(),
  updated_at: z.string(),
});

export const countsSchema = z.object({
  total: z.number(),
  by_status: z.record(z.string(), z.number()),
  by_type: z.record(z.string(), z.number()),
});

export const tripInboxPropsSchema = z.object({
  trip: tripSchema,
  items: z.array(tripItemSchema),
});

export const tripBoardPropsSchema = z.object({
  trip: tripSchema,
  lanes: z.object({
    open_decisions: z.array(tripItemSchema),
    shortlisted: z.array(tripItemSchema),
    booked: z.array(tripItemSchema),
    itinerary_draft: z.array(tripItemSchema),
    missing_pieces: z.array(z.string()),
  }),
  counts: countsSchema,
});

export const tripItineraryPropsSchema = z.object({
  trip: tripSchema,
  days: z.array(
    z.object({
      label: z.string(),
      items: z.array(tripItemSchema.extend({ schedule_label: z.string() })),
    })
  ),
  unscheduled: z.array(tripItemSchema),
  gaps: z.array(z.string()),
  counts: z.object({
    scheduled: z.number(),
    unscheduled: z.number(),
  }),
});

export const tripBudgetPropsSchema = z.object({
  trip: tripSchema,
  target: z.number().nullable(),
  spent: z.number(),
  remaining: z.number().nullable(),
  percent_used: z.number(),
  currency: z.string(),
  rows: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      item_type: z.string(),
      status: z.string(),
      amount: z.number(),
      currency: z.string(),
      note: z.string(),
    })
  ),
  category_totals: z.array(z.object({ category: z.string(), amount: z.number() })),
  counts: z.object({
    priced_items: z.number(),
    tracked_categories: z.number(),
    party_size: z.number(),
    nights: z.number(),
  }),
});

export const tripClarificationOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const tripClarificationQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  reason: z.string().optional(),
  required: z.boolean(),
  answer_type: z.enum(["single_choice", "multi_choice", "free_text"]),
  options: z.array(tripClarificationOptionSchema),
  allow_free_text: z.boolean(),
  allow_skip: z.boolean(),
});

export const tripClarificationPropsSchema = z.object({
  session_id: z.string(),
  intent: z.enum(["plan_trip", "book_hotel", "book_flight"]),
  destination: nullableString,
  current_index: z.number(),
  total_questions: z.number(),
  known_fields: z.record(z.string(), z.unknown()),
  questions: z.array(tripClarificationQuestionSchema),
  answers: z.record(z.string(), z.unknown()),
});

export type TripInboxProps = z.infer<typeof tripInboxPropsSchema>;
export type TripBoardProps = z.infer<typeof tripBoardPropsSchema>;
export type TripItineraryProps = z.infer<typeof tripItineraryPropsSchema>;
export type TripBudgetProps = z.infer<typeof tripBudgetPropsSchema>;
export type TripClarificationProps = z.infer<typeof tripClarificationPropsSchema>;

export const explorePlaceSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  image_url: z.string().optional(),
  url: z.string().optional(),
});

export const explorePlacesPropsSchema = z.object({
  section_title: z.string().optional(),
  browse_url: z.string().optional(),
  places: z.array(explorePlaceSchema),
});

export const packingChecklistPropsSchema = z.object({
  destination: z.string(),
  duration_days: z.number(),
  weather_summary: z.object({
    city: z.string(),
    weather_category: z.string(),
    min_temp_c: z.number(),
    max_temp_c: z.number(),
    max_precipitation_prob: z.number(),
    rain_expected: z.boolean(),
  }),
  categories: z.object({
    clothing: z.array(z.string()),
    toiletries: z.array(z.string()),
    electronics: z.array(z.string()),
    documents: z.array(z.string()),
    accessories: z.array(z.string()),
  }),
  weather_based_items: z.array(z.object({ item: z.string(), reason: z.string() })),
  notes: z.array(z.string()),
});

export const travelActivityCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  duration_hours: z.number(),
  cost_usd: z.number(),
  weather_dependent: z.boolean(),
  best_weather: z.array(z.string()),
});

export const travelActivityCardsPropsSchema = z.object({
  city: z.string(),
  weather: z.string(),
  season: z.string(),
  activities: z.array(travelActivityCardSchema),
});

export const travelDestinationGuidePropsSchema = z.object({
  city: z.string(),
  country: z.string(),
  overview: z.string(),
  best_time: z.string(),
  coordinates: z.object({ lat: z.number(), lon: z.number() }),
  tips: z.array(z.object({ category: z.string(), icon: z.string(), text: z.string() })),
  activities: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      duration_hours: z.number(),
      cost_usd: z.number(),
      weather_dependent: z.boolean(),
    })
  ),
});

export type ExplorePlacesProps = z.infer<typeof explorePlacesPropsSchema>;
export type PackingChecklistProps = z.infer<typeof packingChecklistPropsSchema>;
export type TravelActivityCardsProps = z.infer<typeof travelActivityCardsPropsSchema>;
export type TravelDestinationGuideProps = z.infer<typeof travelDestinationGuidePropsSchema>;
