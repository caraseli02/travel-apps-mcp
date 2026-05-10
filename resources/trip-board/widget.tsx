import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { tripBoardPropsSchema, type TripBoardProps } from "@/domain/widgetTypes";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  title: "Trip Board",
  description: "Shows trip decisions, shortlist, booked items, itinerary draft, and missing pieces.",
  props: tripBoardPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "Trip planning board grouped by decisions, shortlist, booked items, itinerary, and gaps.",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

const laneLabels: Array<[keyof TripBoardProps["lanes"], string]> = [
  ["open_decisions", "Open Decisions"],
  ["shortlisted", "Shortlisted"],
  ["booked", "Booked"],
  ["itinerary_draft", "Itinerary Draft"],
  ["missing_pieces", "Missing Pieces"],
];

export const TripBoardLayout: React.FC<{ props: TripBoardProps }> = ({ props }) => {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <div>
            <h1 className="title">{props.trip.title}</h1>
            <div className="subtitle">Decision Board</div>
          </div>
          <span className="pill">{props.counts.total} saved</span>
        </div>
        <div className="grid lanes">
          {laneLabels.map(([key, label]) => (
            <section className="lane" key={key}>
              <h2 className="lane-title">{label}</h2>
              {props.lanes[key].length === 0 ? (
                <p className="empty">Nothing here.</p>
              ) : key === "missing_pieces" ? (
                (props.lanes[key] as string[]).map((gap) => (
                  <p className="item-text item" key={gap}>{gap}</p>
                ))
              ) : (
                (props.lanes[key] as TripBoardProps["lanes"]["booked"]).map((item) => (
                  <article className="item" key={item.id}>
                    <p className="item-title">{item.title || item.raw_content}</p>
                    <p className="item-text">{item.item_type} · {item.status}</p>
                  </article>
                ))
              )}
            </section>
          ))}
        </div>
      </section>
    </McpUseProvider>
  );
};

const TripBoardWidget: React.FC = () => {
  const { props, isPending } = useWidget<TripBoardProps>();
  if (isPending) return <Loading />;

  return <TripBoardLayout props={props} />;
};

function Loading() {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header"><h1 className="title">Trip Board</h1></div>
        <div className="skeleton" />
      </section>
    </McpUseProvider>
  );
}

export default TripBoardWidget;
