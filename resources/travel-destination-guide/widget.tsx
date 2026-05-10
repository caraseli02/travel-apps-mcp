import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { travelDestinationGuidePropsSchema, type TravelDestinationGuideProps } from "@/domain/widgetTypes";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  title: "Destination Guide",
  description: "A comprehensive guide for a travel destination.",
  props: travelDestinationGuidePropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "A guide with overview, stats, tips and suggested activities.",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

export const TravelDestinationGuideLayout: React.FC<{ props: TravelDestinationGuideProps }> = ({ props }) => {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header" style={{ borderBottom: "1px solid #dfe5ec", paddingBottom: "12px" }}>
          <div>
            <div className="eyebrow" style={{ fontSize: "10px", fontWeight: 700, color: "#606b79", textTransform: "uppercase", marginBottom: "4px" }}>Destination Guide</div>
            <h1 className="title" style={{ fontSize: "24px" }}>{props.city}</h1>
            <div className="subtitle">{props.country}</div>
          </div>
          <div className="best-time" style={{ textAlign: "right", fontSize: "12px", color: "#606b79" }}>
            <strong>Best time</strong><br />
            {props.best_time}
          </div>
        </div>

        <div className="overview" style={{ margin: "16px 0", fontSize: "14px", lineHeight: "1.5", color: "#303946" }}>
          {props.overview}
        </div>

        <div className="stat-group">
          <div className="stat-item">
            <span className="stat-label">Activities</span>
            <span className="stat-value">{props.activities.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Free Picks</span>
            <span className="stat-value">{props.activities.filter(a => a.cost_usd === 0).length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Outdoor</span>
            <span className="stat-value">{props.activities.filter(a => a.weather_dependent).length}</span>
          </div>
        </div>

        <div className="section" style={{ borderTop: "1px solid #dfe5ec", paddingTop: "16px", marginTop: "16px" }}>
          <h2 className="lane-title" style={{ marginBottom: "12px" }}>Travel Notes</h2>
          <div className="tips-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {props.tips.map((tip, i) => (
              <div key={i} className="tip-row" style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <span className="badge">{tip.category}</span>
                <span className="tip-text" style={{ fontSize: "13px", color: "#303946" }}>{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section" style={{ borderTop: "1px solid #dfe5ec", paddingTop: "16px", marginTop: "16px" }}>
          <h2 className="lane-title" style={{ marginBottom: "12px" }}>Good First Picks</h2>
          <div className="activities-list">
            {props.activities.slice(0, 3).map((activity, i) => (
              <div key={i} className="item" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="item-title">{activity.name}</div>
                  <div className="item-text">{activity.description}</div>
                </div>
                <div className="item-meta" style={{ fontSize: "11px", fontWeight: 600, color: "#606b79", whiteSpace: "nowrap" }}>
                  {activity.duration_hours}h · {activity.cost_usd === 0 ? "Free" : `$${activity.cost_usd}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </McpUseProvider>
  );
};

const TravelDestinationGuideWidget: React.FC = () => {
  const { props, isPending } = useWidget<TravelDestinationGuideProps>();
  if (isPending) return <div className="skeleton" />;
  return <TravelDestinationGuideLayout props={props} />;
};

export default TravelDestinationGuideWidget;
