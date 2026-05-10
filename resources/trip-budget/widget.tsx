import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { tripBudgetPropsSchema, type TripBudgetProps } from "@/domain/widgetTypes";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  title: "Trip Budget",
  description: "Shows tracked trip spending against a saved budget target.",
  props: tripBudgetPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "Trip spending tracker with extracted prices, budget target, and category totals.",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

export const TripBudgetLayout: React.FC<{ props: TripBudgetProps }> = ({ props }) => {
  const width = `${Math.min(100, Math.max(0, props.percent_used))}%`;
  
  // Create a formatter for the trip's currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: props.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <div>
            <h1 className="title">{props.trip.title}</h1>
            <div className="subtitle">Spending Tracker</div>
          </div>
          <span className="pill">{formatCurrency(props.spent)}</span>
        </div>
        <div className="grid">
          <section className="card">
            <div className="row">
              <span className="meta">Budget used</span>
              <span className="amount">{props.percent_used}%</span>
            </div>
            <div className="progress" aria-label="Budget used"><span style={{ width }} /></div>
            <p className="item-text">
              {props.target == null ? "No budget target saved." : `${formatCurrency(props.remaining ?? 0)} remaining of ${formatCurrency(props.target)}.`}
            </p>
          </section>
          {props.rows.length === 0 ? <p className="empty">No priced items saved yet.</p> : null}
          {props.rows.map((row) => (
            <article className="card row" key={row.id}>
              <div>
                <p className="item-title">{row.title}</p>
                <p className="item-text">{row.item_type} · {row.status}</p>
              </div>
              <span className="amount">{formatCurrency(row.amount)}</span>
            </article>
          ))}
        </div>
      </section>
    </McpUseProvider>
  );
};

const TripBudgetWidget: React.FC = () => {
  const { props, isPending } = useWidget<TripBudgetProps>();
  if (isPending) return <Loading />;

  return <TripBudgetLayout props={props} />;
};

function Loading() {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header"><h1 className="title">Trip Budget</h1></div>
        <div className="skeleton" />
      </section>
    </McpUseProvider>
  );
}

export default TripBudgetWidget;
