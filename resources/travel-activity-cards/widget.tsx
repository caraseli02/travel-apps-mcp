import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { travelActivityCardsPropsSchema, type TravelActivityCardsProps } from "@/domain/widgetTypes";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  title: "Travel Activities",
  description: "Shows recommended activities for a destination.",
  props: travelActivityCardsPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "A horizontal carousel of recommended activities.",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

export const TravelActivityCardsLayout: React.FC<{ props: TravelActivityCardsProps }> = ({ props }) => {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <div>
            <h1 className="title">Recommended for {props.city}</h1>
            <div className="subtitle">
              {props.season} · {props.weather} weather
            </div>
          </div>
        </div>
        <div className="carousel-container">
          <div className="carousel-track">
            {props.activities.map((activity) => (
              <div key={activity.id} className="img-card">
                <div className="img-card-media" style={{ background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                  <span style={{ fontSize: "24px" }}>{activity.category === "museum" ? "🏛️" : "🎭"}</span>
                </div>
                <div className="img-card-content">
                  <h3 className="img-card-title">{activity.name}</h3>
                  <p className="img-card-subtitle">{activity.description}</p>
                  <div className="meta" style={{ marginTop: "8px", fontSize: "10px", fontWeight: 600 }}>
                    {activity.duration_hours}h · ${activity.cost_usd}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </McpUseProvider>
  );
};

const TravelActivityCardsWidget: React.FC = () => {
  const { props, isPending } = useWidget<TravelActivityCardsProps>();
  if (isPending) return <div className="skeleton" />;
  return <TravelActivityCardsLayout props={props} />;
};

export default TravelActivityCardsWidget;
