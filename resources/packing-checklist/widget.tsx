import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React, { useState } from "react";
import { packingChecklistPropsSchema, type PackingChecklistProps } from "@/domain/widgetTypes";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  title: "Packing Checklist",
  description: "A categorized packing checklist based on weather and trip duration.",
  props: packingChecklistPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "Categorized packing list with progress tracking.",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

export const PackingChecklistLayout: React.FC<{ props: PackingChecklistProps }> = ({ props }) => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (category: string, item: string) => {
    const key = `${category}-${item}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allItems = Object.entries(props.categories).flatMap(([cat, items]) =>
    items.map((i) => `${cat}-${i}`)
  );
  const checkedCount = allItems.filter((key) => checkedItems[key]).length;
  const progress = allItems.length ? Math.round((checkedCount / allItems.length) * 100) : 0;

  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <div>
            <h1 className="title">Packing Checklist</h1>
            <div className="subtitle">
              {props.destination} · {props.duration_days} Day Trip
            </div>
          </div>
          <div className="pill">{progress}% packed</div>
        </div>

        <div className="summary-info" style={{ marginBottom: "16px", fontSize: "12px", color: "#606b79" }}>
          {props.weather_summary.min_temp_c}-{props.weather_summary.max_temp_c}°C
          {props.weather_summary.rain_expected ? " · Rain likely" : ""}
        </div>

        {Object.entries(props.categories).map(([category, items]) => (
          <div key={category} className="list-group" style={{ marginBottom: "12px" }}>
            <div className="list-group-header">
              <h3 className="list-group-title" style={{ textTransform: "capitalize" }}>
                {category}
              </h3>
              <span className="meta">
                {items.filter((i) => checkedItems[`${category}-${i}`]).length}/{items.length}
              </span>
            </div>
            <div className="list-group-content">
              {items.map((item) => {
                const isChecked = !!checkedItems[`${category}-${item}`];
                return (
                  <div key={item} className="list-item" onClick={() => toggleItem(category, item)}>
                    <div className={`checkbox ${isChecked ? "checked" : ""}`} />
                    <span className={`list-item-text ${isChecked ? "checked" : ""}`}>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {props.weather_based_items.length > 0 && (
          <div className="weather-tips" style={{ marginTop: "16px", padding: "12px", background: "#fff9f0", borderRadius: "8px", border: "1px solid #ffecb3" }}>
            <h4 style={{ fontSize: "12px", fontWeight: 700, margin: "0 0 8px", color: "#856404" }}>Weather-Based Suggestions</h4>
            {props.weather_based_items.map((wi, i) => (
              <div key={i} style={{ fontSize: "11px", color: "#856404", marginBottom: "4px" }}>
                <strong>{wi.item}</strong>: {wi.reason}
              </div>
            ))}
          </div>
        )}
      </section>
    </McpUseProvider>
  );
};

const PackingChecklistWidget: React.FC = () => {
  const { props, isPending } = useWidget<PackingChecklistProps>();
  if (isPending) return <div className="skeleton" />;
  return <PackingChecklistLayout props={props} />;
};

export default PackingChecklistWidget;
