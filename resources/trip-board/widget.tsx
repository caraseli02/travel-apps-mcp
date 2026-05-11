import { McpUseProvider, useWidget, useCallTool, type WidgetMetadata } from "mcp-use/react";
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
  const [lanes, setLanes] = React.useState(props.lanes);
  const { callTool } = useCallTool("update_trip_item_status");

  const handleMove = async (itemId: string, fromLane: keyof TripBoardProps["lanes"], toStatus: string) => {
    const item = (lanes[fromLane] as any[]).find((i) => i.id === itemId);
    if (!item) return;

    const optimisticItem = { ...item, status: toStatus };

    setLanes((prev) => {
      const next = { ...prev };
      next[fromLane] = (next[fromLane] as any[]).filter((i) => i.id !== itemId) as any;

      // map statuses to lanes
      let targetLane: keyof TripBoardProps["lanes"] | null = null;
      if (toStatus === "needs_review") targetLane = "open_decisions";
      if (toStatus === "shortlisted") targetLane = "shortlisted";
      if (toStatus === "booked") targetLane = "booked";

      if (targetLane && next[targetLane]) {
        next[targetLane] = [optimisticItem, ...(next[targetLane] as any[])] as any;
      }
      return next;
    });

    try {
      await callTool({ item_id: itemId, status: toStatus, day_label: "", notes: "" });
    } catch (err) {
      console.error("Failed to update item:", err);
      setLanes(props.lanes);
    }
  };

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
              {lanes[key].length === 0 ? (
                <p className="empty">Nothing here.</p>
              ) : key === "missing_pieces" ? (
                (lanes[key] as string[]).map((gap) => (
                  <p className="item-text item" key={gap}>{gap}</p>
                ))
              ) : (
                (lanes[key] as TripBoardProps["lanes"]["booked"]).map((item) => (
                  <BoardItemRow 
                    key={item.id} 
                    item={item} 
                    laneKey={key} 
                    onMove={(status) => handleMove(item.id, key, status)} 
                  />
                ))
              )}
            </section>
          ))}
        </div>
      </section>
    </McpUseProvider>
  );
};

function BoardItemRow({ item, laneKey, onMove }: { item: any; laneKey: string; onMove: (status: string) => void }) {
  const [isPending, setIsPending] = React.useState(false);

  const handleAction = (status: string) => {
    setIsPending(true);
    onMove(status);
  };

  return (
    <article className="item">
      <p className="item-title">{item.title || item.raw_content}</p>
      <p className="item-text">{item.item_type} · {item.status}</p>
      <div className="action-bar">
        {laneKey === "open_decisions" && (
          <>
            <button className="action-btn" disabled={isPending} onClick={() => handleAction("shortlisted")}>→ Shortlist</button>
            <button className="action-btn" disabled={isPending} onClick={() => handleAction("rejected")}>✗ Reject</button>
          </>
        )}
        {laneKey === "shortlisted" && (
          <>
            <button className="action-btn" disabled={isPending} onClick={() => handleAction("booked")}>→ Book</button>
            <button className="action-btn" disabled={isPending} onClick={() => handleAction("needs_review")}>← Un-shortlist</button>
          </>
        )}
        {laneKey === "booked" && (
          <button className="action-btn" disabled={isPending} onClick={() => handleAction("shortlisted")}>← Un-book</button>
        )}
      </div>
    </article>
  );
}

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
