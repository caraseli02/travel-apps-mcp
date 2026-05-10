import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { tripItineraryPropsSchema, type TripItineraryProps } from "@/domain/widgetTypes";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  title: "Trip Itinerary",
  description: "Shows scheduled trip items grouped into a day-by-day itinerary.",
  props: tripItineraryPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "Day-by-day itinerary built from saved trip items.",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

export const TripItineraryLayout: React.FC<{ props: TripItineraryProps }> = ({ props }) => {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <div>
            <h1 className="title">{props.trip.title}</h1>
            <div className="subtitle">Day-By-Day Plan</div>
          </div>
          <span className="pill">{props.counts.scheduled} scheduled</span>
        </div>
        <div className="grid">
          {props.days.length === 0 ? <p className="empty">{props.gaps[0] ?? "No itinerary items yet."}</p> : null}
          {props.days.map((day) => (
            <section className="card" key={day.label}>
              <h2 className="lane-title">{day.label}</h2>
              {day.items.map((item) => (
                <article className="item" key={item.id}>
                  <p className="item-title">{item.schedule_label}: {item.title || item.raw_content}</p>
                  <p className="item-text">{item.location_note || item.date_note || item.item_type}</p>
                </article>
              ))}
            </section>
          ))}
          {props.unscheduled.length > 0 ? (
            <section className="card">
              <h2 className="lane-title">Needs Day Assignment</h2>
              <p className="item-text">{props.unscheduled.length} saved item(s)</p>
            </section>
          ) : null}
        </div>
      </section>
    </McpUseProvider>
  );
};

const TripItineraryWidget: React.FC = () => {
  const { props, isPending } = useWidget<TripItineraryProps>();
  if (isPending) return <Loading />;

  return <TripItineraryLayout props={props} />;
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
