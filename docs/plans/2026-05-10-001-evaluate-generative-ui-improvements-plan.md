# Architectural Improvement Plan: Generative UI & Interactive Canvases

This document outlines three concrete paths to upgrade the `travel-apps-mcp` project based on concepts from the "Build Interactive Agents with Generative UI" course. The goal is to evolve the application from a "text-to-read-only-widget" model into a highly collaborative, interactive AI workspace.

---

## Path 1: Transition to Interactive "Canvas" Widgets (Shared State Sync)

### Overview
Currently, the MCP server returns read-only widgets. If a user wants to move a hotel from the "Inbox" to the "Shortlist", they must tell the AI via chat. 
We can transition to a **Canvas** pattern by making the React widgets (in `resources/`) fully interactive. State changes made by the user on the UI (e.g., drag-and-drop, clicking a "Booked" checkbox) will sync directly back to the backend, updating the agent's context without requiring a chat message.

### Pros & Cons
*   **Pros:** Massive UX improvement. Users prefer clicking/dragging for simple actions rather than typing prompts. It creates a true "collaborative workspace" feeling.
*   **Cons:** Requires setting up a bi-directional communication channel. The current `mcp-use` implementation might be strictly request/response, meaning we'd need to expose API endpoints that the React widget can `POST` to when a user interacts with it.

### Code Example Concept
Currently, the `TripBoard` component might look like this:
```tsx
// Read-only widget
export function TripBoard({ trip, items }) {
  return <div>{items.map(item => <Card item={item} />)}</div>;
}
```

**Improved Interactive Version:**
```tsx
// Interactive Canvas Widget
export function TripBoard({ trip, items }) {
  const handleDrop = async (itemId, newStatus) => {
    // 1. Optimistic UI update here
    // 2. Sync back to backend bypassing chat
    await fetch(`http://localhost:3000/api/trips/${trip.id}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
  };

  return <DragDropContext onDragEnd={handleDrop}>...</DragDropContext>;
}
```

### References
*   [Course Lesson 6: Canvas Applications](https://learn.deeplearning.ai/courses/build-interactive-agents-with-generative-ui/lesson/6/canvas-applications)

---

## Path 2: Declarative Generative UI (Dynamic Composition)

### Overview
Right now, the agent has strict tools that map 1:1 to large, rigid widgets (`trip-board`, `trip-budget`). 
By adopting **Declarative Generative UI**, we break these large widgets into atomic building blocks (`<Map />`, `<FlightCard />`, `<CostBreakdown />`). We then give the agent a single tool (`render_layout`) that accepts a JSON tree describing how to assemble these blocks. The agent can dynamically invent new layouts based on the user's immediate question.

### Pros & Cons
*   **Pros:** Incredible flexibility. If a user asks *"Show me a map of the hotels and a pie chart of my budget,"* the agent can stitch exactly that together.
*   **Cons:** Harder to guarantee visual consistency. The LLM might hallucinate bad layouts or pass incorrect props to the atomic components.

### Code Example Concept
Instead of a strict `render_trip_board` tool, the agent uses a dynamic layout tool:

```typescript
// Agent calls this tool:
server.tool({
  name: "render_custom_layout",
  schema: z.object({
    components: z.array(z.object({
      type: z.enum(["map", "list", "chart", "flightCard"]),
      props: z.any()
    }))
  })
}, async (input) => {
  return widget({
    name: "dynamic-layout",
    props: { components: input.components }
  });
});
```

### References
*   [Course Lesson 4: Declarative Generative UI](https://learn.deeplearning.ai/courses/build-interactive-agents-with-generative-ui/lesson/4/declarative-generative-ui)
*   [Vercel AI SDK - Generative UI](https://sdk.vercel.ai/docs/ai-sdk-rsc/generative-ui)

---

## Path 3: Standalone "coAgent" App via CopilotKit & AG-UI

### Overview
Currently, this project relies on ChatGPT's interface. To gain full control over the user experience, we can extract the backend logic and build a standalone web application using **CopilotKit** and the **AG-UI protocol**. 
Using **coAgents** (connecting LangGraph to CopilotKit), we can stream the agent's intermediate reasoning, maintain shared state automatically, and embed the chat interface directly next to a full-screen React Canvas.

### Pros & Cons
*   **Pros:** 100% control over styling, routing, and UX. No longer bound by ChatGPT's 800px iframe limitations. Native support for "Human-in-the-Loop" interactions.
*   **Cons:** Largest scope of work. Requires building a new Next.js host application, migrating the MCP logic into LangGraph/CopilotKit agents, and hosting our own LLM orchestrator.

### Code Example Concept
Using CopilotKit in a Next.js app to share state between the frontend and the AI agent:

```tsx
// Frontend: Next.js page using CopilotKit
"use client";
import { useCoAgent } from "@copilotkit/react-core";

export function TravelApp() {
  // Bi-directional state sync with the LangGraph agent via AG-UI
  const { state: tripState, setState: setTripState } = useCoAgent({
    name: "travel_planner_agent",
    initialState: { items: [], budget: 0 }
  });

  return (
    <main className="flex">
      {/* Interactive Canvas */}
      <InteractiveTripBoard items={tripState.items} onUpdate={setTripState} />
      
      {/* Chat Sidebar */}
      <CopilotSidebar />
    </main>
  );
}
```

### References
*   [CopilotKit coAgents Documentation](https://docs.copilotkit.ai/coagents)
*   [AG-UI Protocol Explained](https://ag-ui.com/)
*   [Course Lesson 5 & 6 (AG-UI and Canvases)](https://learn.deeplearning.ai/courses/build-interactive-agents-with-generative-ui/)
