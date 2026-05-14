import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React, { useMemo, useState } from "react";
import { tripClarificationPropsSchema, type TripClarificationProps } from "@/domain/widgetTypes";
import "../styles.css";

type OpenAIWithClose = NonNullable<Window["openai"]> & {
  requestClose?: () => Promise<void> | void;
};

export const widgetMetadata: WidgetMetadata = {
  title: "Trip Clarification",
  description: "Asks concise follow-up questions for underspecified trip, hotel, and flight planning intents.",
  props: tripClarificationPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "Guided travel planning questions with selectable answers and skip support.",
    invoking: "Opening trip questions",
    invoked: "Opened trip questions",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

// ── Intent Picker ────────────────────────────────────────────────────────────

const INTENTS = [
  {
    id: "experience",
    icon: "🌄",
    title: "Experience-first",
    desc: "Mountains, culture, cuisine — shape the trip around the vibe",
  },
  {
    id: "budget",
    icon: "💶",
    title: "Budget-first",
    desc: "Value matters — optimize for cost without sacrificing quality",
  },
  {
    id: "dates",
    icon: "📅",
    title: "Date-constrained",
    desc: "Fixed dates, specific event or business anchor",
  },
  {
    id: "loyalty",
    icon: "🏆",
    title: "Loyalty-driven",
    desc: "Maximize points, tier status or reward redemption",
  },
] as const;

type IntentId = (typeof INTENTS)[number]["id"];

interface IntentPickerProps {
  onSelect: (intent: IntentId) => void;
}

const IntentPicker: React.FC<IntentPickerProps> = ({ onSelect }) => {
  const [selected, setSelected] = useState<IntentId | null>(null);

  const handleSelect = (id: IntentId) => {
    setSelected(id);
    window.setTimeout(() => onSelect(id), 200);
  };

  return (
    <div className="intent-picker">
      <p className="intent-picker-label">What matters most to you?</p>
      <div className="intent-picker-grid">
        {INTENTS.map((intent) => (
          <button
            key={intent.id}
            type="button"
            className={`intent-card ${selected === intent.id ? "is-selected" : ""}`}
            onClick={() => handleSelect(intent.id)}
          >
            <span className="intent-card-icon">{intent.icon}</span>
            <p className="intent-card-title">{intent.title}</p>
            <p className="intent-card-desc">{intent.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Hero Strip ───────────────────────────────────────────────────────────────

const intentLabels: Record<TripClarificationProps["intent"], string> = {
  plan_trip: "Trip planning",
  book_hotel: "Hotel search",
  book_flight: "Flight search",
};

interface HeroStripProps {
  destination: string | null | undefined;
  intent: TripClarificationProps["intent"];
}

const HeroStrip: React.FC<HeroStripProps> = ({ destination, intent }) => {
  if (!destination) return null;
  return (
    <div className="clarify-hero">
      <div className="clarify-hero-destination">
        <p className="clarify-hero-label">Planning for</p>
        <p className="clarify-hero-name">{destination}</p>
      </div>
      <span className="clarify-hero-intent">{intentLabels[intent]}</span>
    </div>
  );
};

// ── Context Bar (live answers summary) ──────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  destination: "📍",
  duration: "🗓",
  party_size: "👥",
  budget: "💶",
  origin: "✈️ From",
  interests: "✨",
  style: "🎭",
  season: "🌤",
  "hotel-dates": "🗓",
  "hotel-area": "📍 Area",
  "hotel-budget": "💶",
  "flight-dates": "📅",
  "flight-priority": "🎯",
};

function formatTag(id: string, value: unknown): string {
  const icon = FIELD_LABELS[id] ?? "";
  const label = Array.isArray(value) ? value.join(", ") : String(value);
  return `${icon} ${label}`.trim();
}

interface ContextBarProps {
  knownFields: Record<string, unknown>;
  answers: Record<string, unknown>;
}

const ContextBar: React.FC<ContextBarProps> = ({ knownFields, answers }) => {
  const tags = useMemo(() => {
    const all: Array<{ key: string; tag: string }> = [];
    for (const [k, v] of Object.entries(knownFields)) {
      if (v && k !== "destination") all.push({ key: `known-${k}`, tag: formatTag(k, v) });
    }
    for (const [k, v] of Object.entries(answers)) {
      if (v && v !== "skipped") all.push({ key: `ans-${k}`, tag: formatTag(k, v) });
    }
    return all;
  }, [knownFields, answers]);

  if (tags.length === 0) return null;

  return (
    <div className="clarify-context-bar">
      <span className="clarify-context-label">So far:</span>
      {tags.map(({ key, tag }) => (
        <span key={key} className="clarify-context-tag">
          {tag}
        </span>
      ))}
    </div>
  );
};

// ── Progress Dots ────────────────────────────────────────────────────────────

interface ProgressDotsProps {
  total: number;
  current: number;
  answers: Record<string, unknown>;
  questionIds: string[];
}

const ProgressDots: React.FC<ProgressDotsProps> = ({ total, current, answers, questionIds }) => {
  return (
    <div className="clarify-progress-dots" aria-label={`Question ${current + 1} of ${total}`}>
      {Array.from({ length: total }).map((_, idx) => {
        const qId = questionIds[idx];
        const isAnswered = qId ? answers[qId] !== undefined && answers[qId] !== "skipped" : false;
        const isActive = idx === current;
        return (
          <span
            key={idx}
            className={`clarify-dot ${isActive ? "is-active" : isAnswered ? "is-answered" : ""}`}
          />
        );
      })}
    </div>
  );
};

// ── Main Layout ──────────────────────────────────────────────────────────────

type TripClarificationLayoutProps = {
  props: TripClarificationProps;
  onSubmit?: (answers: Record<string, unknown>) => Promise<void> | void;
  onRequestClose?: () => Promise<void> | void;
  /** Force showing the intent picker first (for Storybook demos) */
  forceIntentPicker?: boolean;
};

export const TripClarificationLayout: React.FC<TripClarificationLayoutProps> = ({
  props,
  onSubmit,
  onRequestClose,
  forceIntentPicker = false,
}) => {
  // Show intent picker when: no intent context OR destination-less request OR forced via prop
  const needsIntentPicker =
    forceIntentPicker ||
    (!props.destination && props.intent === "plan_trip" && Object.keys(props.known_fields).length === 0);

  const [showIntentPicker, setShowIntentPicker] = useState(needsIntentPicker);
  const [pickedIntent, setPickedIntent] = useState<IntentId | null>(null);

  const firstQuestionIndex = clamp(props.current_index, 0, Math.max(props.questions.length - 1, 0));
  const [activeIndex, setActiveIndex] = useState(firstQuestionIndex);
  const [answers, setAnswers] = useState<Record<string, unknown>>(props.answers);
  const [freeText, setFreeText] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const question = props.questions[activeIndex];
  const total = props.total_questions || props.questions.length;

  const selectedValues = useMemo(() => {
    if (!question) return null;
    const answer = answers[question.id];
    if (Array.isArray(answer)) return answer.filter((v): v is string => typeof v === "string");
    return typeof answer === "string" ? [answer] : [];
  }, [answers, question]);

  // ── Intent Picker screen ──────────────────────────────────────────────────
  if (showIntentPicker) {
    return (
      <McpUseProvider>
        <section className="clarify-panel" aria-label="What matters most for your trip?">
          <header className="clarify-header">
            <div className="clarify-title-block">
              <p className="clarify-kicker">
                {props.destination ? `Planning · ${props.destination}` : "New trip"}
              </p>
              <h1>What kind of trip are you planning?</h1>
              <p className="clarify-muted">
                This helps me ask the right questions — skip if you already know what you need.
              </p>
            </div>
            <div className="clarify-controls">
              <button
                type="button"
                className="clarify-icon-button clarify-close"
                aria-label="Skip intent picker"
                onClick={() => setShowIntentPicker(false)}
              >
                ×
              </button>
            </div>
          </header>
          <IntentPicker
            onSelect={(intent) => {
              setPickedIntent(intent);
              setShowIntentPicker(false);
            }}
          />
        </section>
      </McpUseProvider>
    );
  }

  // ── Closed ────────────────────────────────────────────────────────────────
  if (isClosed) {
    return (
      <McpUseProvider>
        <section className="clarify-panel clarify-panel-closed" aria-label="Trip clarification closed">
          <p className="clarify-muted">Questions dismissed.</p>
        </section>
      </McpUseProvider>
    );
  }

  // ── No questions ──────────────────────────────────────────────────────────
  if (!question) {
    return (
      <McpUseProvider>
        <section className="clarify-panel" aria-label="Trip clarification">
          <div className="clarify-empty">
            <h1>No questions needed</h1>
            <p>Enough trip context is already available to continue.</p>
          </div>
        </section>
      </McpUseProvider>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function selectAnswer(value: string) {
    setSubmitError(null);
    if (submitState === "error") setSubmitState("idle");

    if (question.answer_type === "multi_choice") {
      setAnswers((current) => {
        const cur = current[question.id];
        const curVals = Array.isArray(cur) ? cur.filter((i): i is string => typeof i === "string") : [];
        const next = curVals.includes(value) ? curVals.filter((i) => i !== value) : [...curVals, value];
        return { ...current, [question.id]: next };
      });
      return;
    }

    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    if (activeIndex >= props.questions.length - 1) {
      void submitAnswers(nextAnswers);
      return;
    }
    window.setTimeout(() => setActiveIndex((i) => Math.min(i + 1, props.questions.length - 1)), 140);
  }

  function submitFreeText() {
    const trimmed = freeText.trim();
    if (!trimmed) return;
    selectAnswer(trimmed);
    setFreeText("");
  }

  async function submitAnswers(nextAnswers: Record<string, unknown> = answers) {
    if (!onSubmit || submitState === "submitting" || submitState === "submitted") return;
    setSubmitState("submitting");
    setSubmitError(null);
    try {
      await onSubmit(nextAnswers);
      setSubmitState("submitted");
      await onRequestClose?.();
      setIsClosed(true);
    } catch {
      setSubmitState("error");
      setSubmitError("Could not save answers. Try again.");
    }
  }

  // ── Question screen ───────────────────────────────────────────────────────
  return (
    <McpUseProvider>
      <section className="clarify-panel" aria-label={intentLabels[props.intent]}>
        {/* Hero strip — shown when destination is known */}
        <HeroStrip destination={props.destination} intent={props.intent} />

        <header className="clarify-header">
          <div className="clarify-title-block">
            {!props.destination && (
              <p className="clarify-kicker">
                {intentLabels[props.intent]}
                {pickedIntent ? ` · ${pickedIntent}` : ""}
              </p>
            )}
            <h1>{question.prompt}</h1>
            {question.reason ? <p className="clarify-muted">{question.reason}</p> : null}
          </div>
          <div className="clarify-controls" aria-label="Question navigation">
            <ProgressDots
              total={total}
              current={activeIndex}
              answers={answers}
              questionIds={props.questions.map((q) => q.id)}
            />
            <button
              type="button"
              className="clarify-icon-button"
              aria-label="Previous question"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((i) => Math.max(i - 1, 0))}
            >
              ‹
            </button>
            <button
              type="button"
              className="clarify-icon-button"
              aria-label="Next question"
              disabled={submitState === "submitting" || (activeIndex >= props.questions.length - 1 && !onSubmit)}
              onClick={() => {
                if (activeIndex >= props.questions.length - 1) {
                  void submitAnswers();
                  return;
                }
                setActiveIndex((i) => Math.min(i + 1, props.questions.length - 1));
              }}
            >
              ›
            </button>
            <button
              type="button"
              className="clarify-icon-button clarify-close"
              aria-label="Close questions"
              onClick={() => {
                void onRequestClose?.();
                setIsClosed(true);
              }}
            >
              ×
            </button>
          </div>
        </header>

        <div className="clarify-options">
          {question.options.map((option, index) => (
            <button
              type="button"
              className={`clarify-option ${selectedValues?.includes(option.value) ? "is-selected" : ""}`}
              key={option.id}
              aria-pressed={selectedValues?.includes(option.value) ?? false}
              onClick={() => selectAnswer(option.value)}
            >
              <span className="clarify-number">{index + 1}</span>
              <span className="clarify-option-label">{option.label}</span>
              <span className="clarify-arrow" aria-hidden="true">
                {question.answer_type === "multi_choice" ? "✓" : "→"}
              </span>
            </button>
          ))}
        </div>

        <footer className="clarify-footer">
          {question.allow_free_text ? (
            <label className="clarify-custom">
              <span className="clarify-pencil" aria-hidden="true">
                ✎
              </span>
              <input
                type="text"
                value={freeText}
                placeholder="Something else"
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitFreeText();
                }}
              />
            </label>
          ) : (
            <span />
          )}
          <div className="clarify-footer-actions">
            {submitError ? (
              <p className="clarify-error" role="alert">
                {submitError}
              </p>
            ) : null}
            {question.allow_skip ? (
              <button
                type="button"
                className="clarify-skip"
                onClick={() => {
                  if (submitState === "error") {
                    void submitAnswers();
                    return;
                  }
                  const next = { ...answers, [question.id]: "skipped" };
                  setAnswers(next);
                  if (activeIndex >= props.questions.length - 1) {
                    void submitAnswers(next);
                    return;
                  }
                  setActiveIndex((i) => Math.min(i + 1, props.questions.length - 1));
                }}
              >
                {submitState === "submitting"
                  ? "Saving"
                  : submitState === "submitted"
                    ? "Saved"
                    : submitState === "error"
                      ? "Retry"
                      : "Skip"}
              </button>
            ) : null}
          </div>
        </footer>

        {/* Live context bar — appears once user has answered at least one question */}
        <ContextBar knownFields={props.known_fields as Record<string, unknown>} answers={answers} />
      </section>
    </McpUseProvider>
  );
};

// ── Widget entry point ───────────────────────────────────────────────────────

const TripClarificationWidget: React.FC = () => {
  const { props, isPending, callTool, sendFollowUpMessage } = useWidget<TripClarificationProps>();
  if (isPending) return <Loading />;

  return (
    <TripClarificationLayout
      props={props}
      onRequestClose={requestHostClose}
      onSubmit={async (answers) => {
        const response = await callTool("submit_trip_clarification", {
          session_json: JSON.stringify(props),
          answers_json: JSON.stringify(answers),
        });
        const resultText = response.result || "I answered the trip clarification questions.";
        await sendFollowUpMessage(resultText);
      }}
    />
  );
};

async function requestHostClose(): Promise<void> {
  const openai = window.openai as OpenAIWithClose | undefined;
  await openai?.requestClose?.();
}

function Loading() {
  return (
    <McpUseProvider>
      <section className="clarify-panel">
        <div className="clarify-skeleton" />
      </section>
    </McpUseProvider>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default TripClarificationWidget;
