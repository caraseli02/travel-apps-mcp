import { McpUseProvider, useWidget, useCallTool, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { tripInboxPropsSchema, type TripInboxProps } from "@/domain/widgetTypes";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  title: "Trip Inbox",
  description: "Shows saved raw travel fragments that still need review.",
  props: tripInboxPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "Saved trip fragments that still need review.",
    invoking: "Loading trip inbox",
    invoked: "Loaded trip inbox",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

export const TripInboxLayout: React.FC<{ props: TripInboxProps }> = ({ props }) => {
  const [items, setItems] = React.useState(props.items);
  const { callTool } = useCallTool("update_trip_item_status");

  const handleAction = async (itemId: string, status: string) => {
    // Optimistic UI update
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await callTool({ item_id: itemId, status, day_label: "", notes: "" });
    } catch (error) {
      console.error("Failed to update item status:", error);
      // Rollback on failure (simplified: just put it back at the end)
      const itemToRestore = props.items.find(i => i.id === itemId);
      if (itemToRestore) setItems(prev => [...prev, itemToRestore]);
    }
  };

  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <div>
            <h1 className="title">{props.trip.title}</h1>
            <div className="subtitle">Inbox Fragments Awaiting Triage</div>
          </div>
          <span className="pill">{items.length} inbox</span>
        </div>
        <div className="grid">
          {items.length === 0 ? (
            <p className="empty">No inbox items saved yet.</p>
          ) : (
            items.map((item) => (
              <TripItemRow 
                key={item.id} 
                item={item} 
                onAction={(status) => handleAction(item.id, status)} 
              />
            ))
          )}
        </div>
      </section>
    </McpUseProvider>
  );
};

const TripInboxWidget: React.FC = () => {
  const { props, isPending } = useWidget<TripInboxProps>();
  if (isPending) return <Loading title="Trip Inbox" />;

  return <TripInboxLayout props={props} />;
};

function TripItemRow({ item, onAction }: { item: TripInboxProps["items"][number]; onAction: (status: string) => void }) {
  const [isPending, setIsPending] = React.useState(false);

  const handleAction = (status: string) => {
    setIsPending(true);
    onAction(status);
  };

  return (
    <article className="card">
      <p className="item-title">{item.title || item.raw_content}</p>
      <p className="item-text">
        {item.item_type}
        {item.source_label ? ` · ${item.source_label}` : ""}
        {item.price_note ? ` · ${item.price_note}` : ""}
      </p>
      <div className="action-bar">
        <button className="action-btn" disabled={isPending} onClick={() => handleAction("shortlisted")}>✓ Shortlist</button>
        <button className="action-btn" disabled={isPending} onClick={() => handleAction("rejected")}>✗ Reject</button>
        <button className="action-btn" disabled={isPending} onClick={() => handleAction("needs_review")}>↺ Needs Review</button>
      </div>
    </article>
  );
}

function Loading({ title }: { title: string }) {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <h1 className="title">{title}</h1>
        </div>
        <div className="skeleton" />
      </section>
    </McpUseProvider>
  );
}

export default TripInboxWidget;
