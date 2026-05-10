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
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

const intentLabels: Record<TripClarificationProps["intent"], string> = {
  plan_trip: "Trip planning",
  book_hotel: "Hotel search",
  book_flight: "Flight search",
};

type TripClarificationLayoutProps = {
  props: TripClarificationProps;
  onSubmit?: (answers: Record<string, unknown>) => Promise<void> | void;
  onRequestClose?: () => Promise<void> | void;
};

export const TripClarificationLayout: React.FC<TripClarificationLayoutProps> = ({ props, onSubmit, onRequestClose }) => {
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
    if (Array.isArray(answer)) return answer.filter((value): value is string => typeof value === "string");
    return typeof answer === "string" ? [answer] : [];
  }, [answers, question]);

  if (isClosed) {
    return (
      <McpUseProvider>
        <section className="clarify-panel clarify-panel-closed" aria-label="Trip clarification closed">
          <p className="clarify-muted">Questions dismissed.</p>
        </section>
      </McpUseProvider>
    );
  }

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

  function selectAnswer(value: string) {
    setSubmitError(null);
    if (submitState === "error") setSubmitState("idle");

    if (question.answer_type === "multi_choice") {
      setAnswers((current) => {
        const currentAnswer = current[question.id];
        const currentValues = Array.isArray(currentAnswer) ? currentAnswer.filter((item): item is string => typeof item === "string") : [];
        const nextValues = currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value];
        return { ...current, [question.id]: nextValues };
      });
      return;
    }

    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);
    if (activeIndex >= props.questions.length - 1) {
      void submitAnswers(nextAnswers);
      return;
    }
    if (activeIndex < props.questions.length - 1) {
      window.setTimeout(() => setActiveIndex((index) => Math.min(index + 1, props.questions.length - 1)), 140);
    }
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

  return (
    <McpUseProvider>
      <section className="clarify-panel" aria-label={intentLabels[props.intent]}>
        <header className="clarify-header">
          <div className="clarify-title-block">
            <p className="clarify-kicker">
              {intentLabels[props.intent]}
              {props.destination ? ` · ${props.destination}` : ""}
            </p>
            <h1>{question.prompt}</h1>
            {question.reason ? <p className="clarify-muted">{question.reason}</p> : null}
          </div>
          <div className="clarify-controls" aria-label="Question navigation">
            <button
              type="button"
              className="clarify-icon-button"
              aria-label="Previous question"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
            >
              ‹
            </button>
            <span className="clarify-count">{activeIndex + 1} of {total}</span>
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
                setActiveIndex((index) => Math.min(index + 1, props.questions.length - 1));
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
              <span className="clarify-arrow" aria-hidden="true">{question.answer_type === "multi_choice" ? "✓" : "→"}</span>
            </button>
          ))}
        </div>

        <footer className="clarify-footer">
          {question.allow_free_text ? (
            <label className="clarify-custom">
              <span className="clarify-pencil" aria-hidden="true">✎</span>
              <input
                type="text"
                value={freeText}
                placeholder="Something else"
                onChange={(event) => setFreeText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submitFreeText();
                }}
              />
            </label>
          ) : <span />}
          <div className="clarify-footer-actions">
            {submitError ? <p className="clarify-error" role="alert">{submitError}</p> : null}
            {question.allow_skip ? (
              <button
                type="button"
                className="clarify-skip"
                onClick={() => {
                  if (submitState === "error") {
                    void submitAnswers();
                    return;
                  }
                  const nextAnswers = { ...answers, [question.id]: "skipped" };
                  setAnswers(nextAnswers);
                  if (activeIndex >= props.questions.length - 1) {
                    void submitAnswers(nextAnswers);
                    return;
                  }
                  setActiveIndex((index) => Math.min(index + 1, props.questions.length - 1));
                }}
              >
                {submitState === "submitting" ? "Saving" : submitState === "submitted" ? "Saved" : submitState === "error" ? "Retry" : "Skip"}
              </button>
            ) : null}
          </div>
        </footer>
      </section>
    </McpUseProvider>
  );
};

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
