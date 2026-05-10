import { McpUseProvider, useWidget, type WidgetMetadata } from "mcp-use/react";
import React from "react";
import { explorePlacesPropsSchema, type ExplorePlacesProps } from "@/domain/widgetTypes";
import "../styles.css";

export const widgetMetadata: WidgetMetadata = {
  title: "Explore Places",
  description: "Shows a carousel of places to explore.",
  props: explorePlacesPropsSchema,
  exposeAsTool: false,
  metadata: {
    prefersBorder: true,
    widgetDescription: "A horizontal carousel of places to explore with images and subtitles.",
    csp: { connectDomains: [], resourceDomains: [] },
  },
};

export const ExplorePlacesLayout: React.FC<{ props: ExplorePlacesProps }> = ({ props }) => {
  return (
    <McpUseProvider>
      <section className="widget">
        <div className="header">
          <div>
            <h1 className="title">{props.section_title || "Explore"}</h1>
          </div>
          {props.browse_url && (
            <button className="pill" onClick={() => window.open(props.browse_url, "_blank")}>
              Browse All
            </button>
          )}
        </div>
        <div className="carousel-container">
          <div className="carousel-track">
            {props.places.map((place) => (
              <div key={place.id} className="img-card" onClick={() => place.url && window.open(place.url, "_blank")}>
                <div className="img-card-media">
                  {place.image_url ? (
                    <img src={place.image_url} alt={place.title} />
                  ) : (
                    <div className="placeholder-icon" />
                  )}
                </div>
                <div className="img-card-content">
                  <h3 className="img-card-title">{place.title}</h3>
                  <p className="img-card-subtitle">{place.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </McpUseProvider>
  );
};

const ExplorePlacesWidget: React.FC = () => {
  const { props, isPending } = useWidget<ExplorePlacesProps>();
  if (isPending) return <div className="skeleton" />;
  return <ExplorePlacesLayout props={props} />;
};

export default ExplorePlacesWidget;
