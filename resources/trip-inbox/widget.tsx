import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
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
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

export const TripInboxLayout: React.FC<{ props: TripInboxProps }> = ({ props }) => {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <div>
            <h1 className="title">{props.trip.title}</h1>
            <div className="subtitle">Inbox Fragments Awaiting Triage</div>
          </div>
          <span className="pill">{props.items.length} inbox</span>
        </div>
        <div className="grid">
          {props.items.length === 0 ? (
            <p className="empty">No inbox items saved yet.</p>
          ) : (
            props.items.map((item) => <TripItemRow key={item.id} item={item} />)
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

function TripItemRow({ item }: { item: TripInboxProps["items"][number] }) {
  return (
    <article className="card">
      <p className="item-title">{item.title || item.raw_content}</p>
      <p className="item-text">
        {item.item_type}
        {item.source_label ? ` · ${item.source_label}` : ""}
        {item.price_note ? ` · ${item.price_note}` : ""}
      </p>
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
