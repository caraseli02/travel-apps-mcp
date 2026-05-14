import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { tripItineraryPropsSchema, type TripItineraryProps } from "@/domain/widgetTypes";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  title: "Trip Itinerary",
  description: "Shows scheduled trip items grouped into a day-by-day itinerary with agentic insights.",
  props: tripItineraryPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "Day-by-day itinerary with transit analysis and feasibility scoring.",
    invoking: "Loading trip itinerary",
    invoked: "Loaded trip itinerary",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

// Extended types for the agentic demo
interface AgenticTripItem {
  id: string;
  title: string;
  schedule_label: string;
  location_note?: string;
  date_note?: string;
  item_type: string;
  raw_content?: string;
  transit_to_next?: string;
  grounding?: { status: string; checked_at: string };
  rationale?: string;
}

interface AgenticItineraryProps extends TripItineraryProps {
  validation_report?: {
    score: number;
    status: "optimal" | "warning";
    message: string;
  };
}

const ValidationBanner: React.FC<{ report: AgenticItineraryProps["validation_report"] }> = ({ report }) => {
  if (!report) return null;
  return (
    <div className={`validation-banner ${report.status}`}>
      <div className="validation-score">
        <span className="validation-label">Feasibility Score</span>
        <span className="validation-value">{report.score}%</span>
      </div>
      <div style={{ flex: 1, marginLeft: 16 }}>
        <p className="item-title" style={{ margin: 0, fontSize: 13 }}>{report.message}</p>
      </div>
      <div className="btn-group-agentic">
        <button className="btn-primary-agentic">Approve Plan</button>
      </div>
    </div>
  );
};

const TransitLine: React.FC<{ duration: string }> = ({ duration }) => (
  <div className="transit-line">
    <div className="transit-icon">🚗</div>
    <span>{duration} transit time • physical friction: low</span>
  </div>
);

export const TripItineraryLayout: React.FC<{ props: AgenticItineraryProps }> = ({ props }) => {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <div>
            <h1 className="title">{props.trip.title}</h1>
            <div className="subtitle">Agentic Planning Workspace</div>
          </div>
          <span className="pill">{props.counts.scheduled} scheduled</span>
        </div>

        <ValidationBanner report={props.validation_report} />

        <div className="grid">
          {props.days.length === 0 ? <p className="empty">{props.gaps[0] ?? "No itinerary items yet."}</p> : null}
          {props.days.map((day) => (
            <section className="card" key={day.label} style={{ marginBottom: 12 }}>
              <h2 className="lane-title">{day.label}</h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {day.items.map((item: any, idx) => {
                  const agenticItem = item as AgenticTripItem;
                  return (
                    <React.Fragment key={item.id}>
                      <article className="item">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <p className="item-title">{agenticItem.schedule_label}: {agenticItem.title || agenticItem.raw_content}</p>
                          {agenticItem.grounding && (
                            <div className="grounding-indicator">
                              <div className="grounding-dot" />
                              <span>Live Status: {agenticItem.grounding.status}</span>
                            </div>
                          )}
                        </div>
                        <p className="item-text">{agenticItem.location_note || agenticItem.date_note || agenticItem.item_type}</p>
                        {agenticItem.rationale && (
                          <div className="agent-rationale">
                            ✨ {agenticItem.rationale}
                          </div>
                        )}
                      </article>
                      {agenticItem.transit_to_next && <TransitLine duration={agenticItem.transit_to_next} />}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="btn-group-agentic" style={{ marginTop: 8 }}>
            <button className="btn-secondary-agentic">Optimize Gaps</button>
            <button className="btn-secondary-agentic">Add Activity</button>
          </div>
        </div>
      </section>
    </McpUseProvider>
  );
};

const TripItineraryWidget: React.FC = () => {
  const { props, isPending } = useWidget<TripItineraryProps>();
  if (isPending) return <Loading />;

  return <TripItineraryLayout props={props as AgenticItineraryProps} />;
};

function Loading() {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header"><h1 className="title">Trip Itinerary</h1></div>
        <div className="skeleton" />
      </section>
    </McpUseProvider>
  );
}

export default TripItineraryWidget;
