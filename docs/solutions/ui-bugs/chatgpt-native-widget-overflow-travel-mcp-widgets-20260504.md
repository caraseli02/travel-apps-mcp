---
module: Travel MCP Widgets
date: 2026-05-04
problem_type: ui_bug
component: rails_view
symptoms:
  - "Widget showcase looked like a generic AI-generated component gallery instead of a ChatGPT-native Apps SDK surface"
  - "Mobile render at 390px had horizontal overflow in the activity card copy and bottom action row"
  - "Original UI used emoji icons, multicolor category badges, inline onclick handlers, and a sticky app-like nav shell"
root_cause: logic_error
resolution_type: code_fix
severity: medium
tags: [apps-sdk, chatgpt-ui, responsive-css, widget-design, accessibility]
---

# Troubleshooting: ChatGPT-Native Widget UI Polish and Mobile Overflow

## Problem

The v3 travel widget prototype was visually functional but did not feel native to the ChatGPT Apps SDK environment. It read as a generic component gallery: emoji-led rows, many category colors, app-shell navigation, and inline JavaScript handlers.

During browser verification, the mobile render at 390px also showed horizontal overflow in the activity cards and bottom action row.

## Environment

- Module: Travel MCP Widgets
- Stage: post-implementation
- Affected component: static HTML/CSS/JS widget showcase
- File: `mcp_servers/widgets/v3_prototype_showcase.html`
- Date: 2026-05-04
- OS/context: macOS local workspace, verified with headless Google Chrome
- Rails version: not applicable

## Symptoms

- The UI looked like a full mini-app/gallery instead of focused ChatGPT display-mode cards.
- The original design used emoji icons, broad category tinting, generic purple accents, and a sticky navigation shell.
- The original interactions used `onclick` handlers on non-button elements for packing toggles.
- A headless Chrome screenshot at 390px showed activity text and the footer CTA row extending past the right edge.
- The page needed to follow Apps SDK guidance: system typography, restrained color, no ornamental gradients/patterns, no nested scrolling, focused card actions, and mobile-safe layout.

## What Didn't Work

**Initial visual rewrite only:** Replacing the gallery with cleaner cards improved the desktop look, but the first mobile screenshot still exposed horizontal overflow.

- **Why it failed:** CSS grid children can keep intrinsic content width unless the content column is explicitly allowed to shrink. The footer action row also stayed right-aligned without wrapping behavior that worked well on narrow viewports.

**Generic decorative polish:** Adding richer custom styling would have made the page more distinctive, but conflicted with the Apps SDK UI guidance.

- **Why it failed:** ChatGPT app widgets should use system colors for text and spatial structure, inherit system fonts, avoid custom gradients/patterns, and reserve brand color for accents or primary buttons.

## Solution

Rework the prototype into a set of focused ChatGPT-native cards and fix the mobile layout constraints.

**Code changes:**

```css
/* Before: emoji-heavy, app-shell style rows with no body overflow guard. */
body{
  font-family:var(--font);
  background:var(--bg);
  color:var(--text);
}

.act-card{
  display:flex;
  gap:12px;
  padding:12px;
  cursor:pointer;
}

/* After: system type, restrained surfaces, and mobile-safe page bounds. */
body{
  margin:0;
  background:Canvas;
  color:CanvasText;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:14px;
  line-height:1.45;
  overflow-x:hidden;
}

.activity{
  display:grid;
  grid-template-columns:42px minmax(0,1fr) auto;
  gap:11px;
  align-items:start;
}
```

```css
/* Mobile overflow fix. */
.activity>div:nth-child(2){min-width:0}

.activity h3,
.activity p{
  max-width:100%;
  overflow-wrap:break-word;
}

.card-actions{
  display:flex;
  justify-content:flex-end;
  gap:8px;
  flex-wrap:wrap;
}

@media(max-width:640px){
  .activity{grid-template-columns:38px minmax(0,1fr)}
  .activity p{display:block}
  .activity .save{grid-column:2;justify-self:start}
  .card-actions{justify-content:flex-start}
}
```

```html
<!-- Before: inline handlers and emoji-coded groups. -->
<div class="pack-group-head" onclick="toggleGroup('pg1')">
  <div class="pg-left"><span class="pg-icon">👕</span><span class="pg-label">Clothing</span></div>
</div>

<!-- After: real buttons with state attributes and CSS-drawn chevrons. -->
<div class="pack-group" data-group>
  <button class="pack-toggle" type="button" aria-expanded="true">
    <span class="pack-label"><span class="pack-symbol">C</span>Clothing</span>
    <span class="chev" aria-hidden="true"></span>
  </button>
</div>
```

```js
document.querySelectorAll("[data-group]").forEach(group=>{
  const toggle=group.querySelector(".pack-toggle");
  toggle.addEventListener("click",()=>{
    const closed=group.classList.toggle("is-closed");
    toggle.setAttribute("aria-expanded",String(!closed));
  });
});
```

**Commands run:**

```bash
node - <<'NODE'
const fs=require('fs');
const html=fs.readFileSync('mcp_servers/widgets/v3_prototype_showcase.html','utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for (const script of scripts) new Function(script);
console.log(`checked ${scripts.length} inline script block(s)`);
NODE

git diff --check -- mcp_servers/widgets/v3_prototype_showcase.html

'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=720,1200 \
  --screenshot=/tmp/travel-v3-desktop-2.png \
  file:///Users/vladislavcaraseli/Documents/travel-mcp-app/mcp_servers/widgets/v3_prototype_showcase.html

'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  --headless=new --disable-gpu --remote-debugging-port=9223 \
  --window-size=390,1400 \
  file:///Users/vladislavcaraseli/Documents/travel-mcp-app/mcp_servers/widgets/v3_prototype_showcase.html
```

## Why This Works

The root cause was not a single syntax bug; it was a mismatch between the widget design and the platform surface. The previous prototype used patterns that are common in generated demo UIs but weak inside ChatGPT: decorative emoji icons, many custom colors, a sticky shell, and click handlers on non-semantic elements.

The revised version aligns the visual hierarchy with Apps SDK expectations:

- System typography and neutral structural colors preserve ChatGPT fit.
- One restrained brand accent is used for badges, progress, and primary actions.
- Each widget is a focused card with concise metadata and at most two bottom actions.
- Inline event handlers are replaced with real buttons and explicit ARIA state.
- The mobile overflow is fixed by letting grid content shrink with `minmax(0,1fr)` and `min-width:0`, wrapping footer actions, and guarding long text with `overflow-wrap`.

## Prevention

- Verify both desktop and mobile screenshots after frontend changes, especially at 390px width.
- In CSS grid/flex layouts, set `min-width:0` on content columns that contain text.
- Avoid emoji as primary UI iconography for ChatGPT app widgets; use monochrome system-like marks or outlined custom icons.
- Keep Apps SDK widgets focused: no deep navigation, no app-shell chrome, no nested scrolling, and no more than two primary card actions.
- Use real `button` elements for direct edits and maintain `aria-pressed` or `aria-expanded` when state changes.
- Reserve brand color for accents and primary actions; do not recolor structural text/backgrounds or use decorative gradients/patterns.

## Related Issues

No related issues documented yet.
