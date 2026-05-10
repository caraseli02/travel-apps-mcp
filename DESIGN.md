# Design

## Theme

Light, warm, trustworthy. Not clinical white, not SaaS cream. A tinted neutral base with one confident accent. Think Wanderlog's polish and visual warmth, not a generic travel-tech dashboard.

Scene: a traveler sitting on their couch at 9pm, phone in hand, excitedly piecing together a Rome trip. The UI should feel calm and capable, like opening a well-organized travel journal, not like logging into enterprise software.

## Color Strategy

**Committed**: one saturated accent carries 30-40% of the surface, with warm tinted neutrals for everything else.

```
--accent: oklch(0.55 0.18 260);          /* Confident blue-violet, not corporate blue */
--accent-light: oklch(0.92 0.04 260);    /* Tinted surface for accent areas */
--bg: oklch(0.98 0.005 80);              /* Warm off-white, not pure white */
--surface: oklch(1.00 0.003 80);         /* Card background, barely warm */
--text: oklch(0.18 0.02 60);             /* Near-black with warm undertone */
--text-muted: oklch(0.50 0.01 70);       /* Secondary text */
--border: oklch(0.90 0.01 80);           /* Subtle warm border */

/* Category colors - used sparingly, as small indicators */
--cat-flight: oklch(0.55 0.15 250);
--cat-hotel: oklch(0.55 0.18 310);
--cat-food: oklch(0.60 0.18 50);
--cat-activity: oklch(0.55 0.16 155);
--cat-transport: oklch(0.55 0.08 260);
--cat-note: oklch(0.60 0.12 85);
```

## Typography

System font stack. Size contrast between levels, not decoration.

```
--font: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

h1: 20px / 700 / 1.2
h2: 16px / 600 / 1.3
body: 13px / 400 / 1.5
caption: 11px / 500 / 1.4
```

Body line length capped at 65-75ch. No font-size below 11px.

## Layout

- No nested cards. Cards sit on a tinted background, never inside another card.
- Spacing rhythm: 4px base unit. 8, 12, 16, 20, 24, 32 are the steps. Vary deliberately, never all-the-same.
- Maximum widget width: 800px. These live in ChatGPT iframes.
- Content is compact and scannable. Users are mid-conversation, not browsing a website.

## Components

### Cards (Activity, Hotel, Restaurant)
- Horizontal layout (image left, content right) for compactness in iframes
- Small category pill, not a colored side stripe
- Duration and cost as inline text, not badge explosions
- One clear action per card

### Board Columns
- Minimal headers with count
- Cards are compact: title + one detail line + category indicator
- No decorative drag handles; the affordance is the card itself

### Timeline
- Vertical line with dot nodes
- Time as small left-aligned label, content right
- Gaps shown as subtle dashed sections, not loud empty states

### Budget Bar
- Single bar with category breakdown below
- Numbers, not charts. Clean typography over visual noise.

### Packing Checklist
- Collapsible sections with progress ring
- Checkboxes with subtle animation
- Weather tags as small inline pills, not badges

## Motion

Subtle, purposeful. Ease-out-quart for all transitions (200-300ms). No bounce, no elastic, no decorative animations. Hover states lift cards 2px with shadow increase. Checkbox fills with a quick scale-up settle.

## Elevation

Two levels only:
- Rest: no shadow, or barely visible (0.5 opacity)
- Lifted: soft shadow on hover/focus

No medium shadows. No hard shadows. Glassmorphism is banned.

## Spacing

All spacing is a multiple of 4px. The rhythm: 4, 8, 12, 16, 20, 24, 32, 40, 48. Never use 10, 15, 18, 22, or other non-multiples.
