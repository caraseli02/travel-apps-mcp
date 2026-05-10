# Product

## Register

product

## Users

ChatGPT users who treat the AI as a personal travel assistant. They are not browsing a standalone app; they are mid-conversation with ChatGPT, planning a real trip. Their planning is scattered: a flight found on Google Flights, a hotel on Booking.com, a restaurant tip from a friend's WhatsApp, a question about stroller-friendly streets. They paste links, screenshots, and fragments into ChatGPT and want the AI to remember, organize, and improve on all of it across sessions.

Emotional state: mix of excitement about the trip and mild overwhelm from the planning chaos. They want to feel like someone competent is handling the details so they can focus on anticipation, not logistics.

## Product Purpose

Make ChatGPT a persistent travel workspace, not just a one-shot recommendation engine. The first job is "do not lose the planning work I already did." The second job is "help me make decisions with what I saved." The third job is "improve the trip over time, across conversations."

This is not a trip generator. It is a trip companion that captures, organizes, and refines real planning work.

Success looks like: a user can start planning on Google Maps and Booking.com, paste fragments into ChatGPT, come back three days later, and find everything still there, organized, with smart suggestions for what to do next.

## Brand Personality

Helpful, smart, simple.

The UI should feel like a well-designed notebook, not a dashboard. Information is dense but never noisy. Visual elements serve clarity, not decoration. The user should feel that the AI understands their trip, not just their last message.

## Anti-references

- Generic AI chat bubbles with no visual structure. Plain text walls that could be an email.
- Overwhelming dashboards with too many widgets competing for attention.
- Tripit-style plain text itineraries with zero visual hierarchy.
- Cookie-cutter "AI made this" card grids: same-sized cards with icon + heading + text, repeated endlessly. Side-stripe colored borders on every card. Gradient text headings.
- Trip generators that spit out a full itinerary from a prompt. That is not what this product is.

## Design Principles

1. **Capture over create.** The UI's primary job is to hold what the user already found, not to generate new suggestions. Inbox first, recommendations second.
2. **Quiet competence.** The design should feel like a trusted organizer, not a flashy demo. Polish through restraint: good spacing, clear type, purposeful color, no decorative elements.
3. **Conversation-native.** These widgets live inside ChatGPT. They should feel like a natural extension of the conversation, not a separate app awkwardly embedded. Compact, scannable, glanceable.
4. **Progressive structure.** Start messy (inbox fragments), reveal structure (board, timeline) as the user organizes. Never show empty states that make the user feel behind.
5. **Wanderlog polish, not Wanderlog scope.** Steal the visual care: card layouts, clean typography, thoughtful spacing, map warmth. Do not steal the feature bloat.

## Accessibility & Inclusion

WCAG 2.1 AA. Widgets render in sandboxed iframes inside ChatGPT at 320px to 800px width. Must work on mobile and desktop. Color is never the only indicator of meaning. Touch targets minimum 44px.
