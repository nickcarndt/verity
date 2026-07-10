# Verity — Design Spec (DESIGN_SPEC.md)

> The design blueprint for Verity. Read this alongside PROJECT_SPEC.md and .cursorrules before building any UI. This document exists to make Verity look like a **real, premium fintech product** — not an AI-generated demo. When building UI, Claude Code must follow this spec, not its own defaults.

---

## 0. The Prime Directive

There are **two surfaces**, and they have **opposite** design goals. Do not blur them.

1. **The Product UI** (the app itself: dashboard, reconciliation views, exception detail). Goal: **restraint.** Clean, dense, fast, data-forward. Feels like Ramp / Stripe / Mercury / Linear. **No cinematic motion, no gradients, no decorative effects.** The data is the hero.
2. **The Marketing/Landing surface** (the page that sells Verity, the first impression). Goal: **cinematic wow.** This is where Higgsfield-generated motion and premium visuals belong — used with taste, on the hero and a few key moments only.

Knowing which surface gets which treatment is itself the mark of design maturity. Never put dashboard restraint on the landing page, and never put landing-page flash inside the product.

---

## 1. Anti-Slop Rules (the "em dashes" of UI — never do these)

These are the tells that scream "vibe-coded." Verity must avoid all of them:

- ❌ **No violet/purple gradient hero** on a dark background with glowing accents. This is the #1 AI-slop fingerprint.
- ❌ **No untouched shadcn defaults** — always change the default radius, the default `slate`/`zinc` gray, and the default system font. Shipping the trio untouched is the fingerprint.
- ❌ **No emoji as feature icons** (🚀 ✨ 🔒). Use a curated icon set, purposefully.
- ❌ **No glassmorphism / frosted-glass blur cards.** 2023 flourish. Gone.
- ❌ **No gradient borders, no glow effects** in the product UI.
- ❌ **No "three identical feature cards + FAQ accordion + gradient CTA"** generic landing template.
- ❌ **No lorem ipsum, no placeholder content.** Always use real invoice numbers, real dollar amounts, real contract clauses.
- ❌ **No uniform even spacing everywhere.** Vary spacing intentionally to create hierarchy.

---

## 2. PRODUCT UI — the design system

### 2.1 Aesthetic target
**Enterprise-fintech-premium.** References to feed Claude Code (and to screenshot for visual reference): **Ramp dashboard, Stripe dashboard, Mercury, Linear.** When prompting: *"Build this to feel like Ramp's dashboard — dense, restrained, data-forward, near-black on off-white, one accent color, no gradients."*

### 2.2 Color palette (exact — do not use raw Tailwind defaults)
Define these as CSS variables / Tailwind theme tokens. This is a "financial trust" palette: near-black ink, warm off-white surfaces, one confident deep-green accent, and clear semantic colors for severity.

```
/* Base — warm neutrals, NOT slate/zinc */
--background:      #FAFAF8   /* warm off-white, not pure white */
--surface:        #FFFFFF   /* cards, tables */
--surface-subtle: #F4F4F1   /* zebra rows, hover */
--border:         #E6E6E1   /* hairline borders */
--ink:            #16161A   /* near-black primary text */
--ink-muted:      #6B6B72   /* secondary text */
--ink-subtle:     #9A9AA0   /* tertiary/labels */

/* Accent — deep green = financial trust */
--accent:         #0B6E4F   /* primary brand green */
--accent-hover:   #095A40
--accent-subtle:  #E7F1EC   /* accent backgrounds/badges */

/* Semantic — severity (for exception flags) */
--critical:       #B42318   /* overbilling, high $ impact */
--critical-bg:    #FEF3F2
--warning:        #B54708   /* out-of-term, missing PO */
--warning-bg:     #FFF6ED
--info:           #175CD3   /* duplicates, informational */
--info-bg:        #EFF4FF
--success:        #067647   /* clean/reconciled */
--success-bg:     #ECFDF3
```

Rule: **one accent color** (the green) used sparingly for primary actions and brand moments. Severity colors are functional, not decorative — they only appear on badges, flags, and dollar-impact indicators.

### 2.3 Typography (this carries 80% of perceived quality)
- **Primary typeface:** **Geist** (or Inter with tightened tracking) for UI text. Clean, modern, neutral-premium.
- **Numeric/tabular:** use **Geist Mono** or a tabular-figure setting for all dollar amounts, invoice numbers, and table numerics so columns align. This is a huge "real fintech product" signal — misaligned numbers scream amateur.
- **Type scale (don't use uniform sizes — create hierarchy):**
  ```
  Display / page title:  30px / 600 / -0.02em tracking
  Section heading:       20px / 600 / -0.01em
  Card title:            15px / 600
  Body:                  14px / 400 / 1.5 line-height
  Label / meta:          12px / 500 / 0.01em / --ink-subtle, uppercase optional
  Numeric (tabular):     14px / 500 / tabular-nums
  ```
- Never use the default system font stack. Load Geist/Inter properly.

### 2.4 Radius, spacing, density
- **Radius:** `6px` on cards/inputs, `4px` on badges, `8px` on modals/drawers. **Sharp-ish = serious/enterprise.** Do NOT use the soft default shadcn radius (too consumer/bubbly for a financial tool).
- **Spacing scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48. Use tight spacing *within* related groups, generous spacing *between* sections. Deliberate rhythm, not uniform gaps.
- **Density:** dashboards should be **dense** — real fintech tools show a lot of data cleanly. Don't over-pad. Table rows ~44px, comfortable but efficient.
- **Shadows:** almost none. A single hairline border does more than a shadow in enterprise UI. At most, a very subtle shadow on drawers/modals (`0 1px 3px rgba(0,0,0,0.06)`).

### 2.5 The key components (build these to feel premium)
- **Exception table** (the centerpiece): columns = Invoice # (mono), Vendor, Exception Type (badge), Severity (colored badge), $ Impact (tabular, right-aligned, colored by severity), Clause Ref (link), Status. Zebra striping with `--surface-subtle`. Hover row highlight. Sortable headers. Right-aligned numerics with tabular figures.
- **Severity badges:** small, `4px` radius, semantic bg + text color (e.g., critical = `--critical-bg` bg, `--critical` text). Never use raw red/yellow/green — use the exact semantic tokens.
- **Dollar-impact emphasis:** the $ figure on a flagged exception is the most important number on screen — make it slightly larger, tabular, and colored by severity. This is where the eye should go.
- **Trace drawer:** clicking an exception opens a right-side drawer (not a modal) showing the agent's reasoning trace + the cited contract clause with the relevant text highlighted. This "every flag is grounded in a source clause" moment is Verity's whole value prop — make it feel authoritative.
- **Empty / loading / error states:** design all three deliberately. A thoughtful empty state ("No exceptions found — all 12 invoices reconciled cleanly ✓") signals real-product polish. Skeleton loaders, not spinners, for the table.
- **Streaming state:** when the agent is working, stream its progress (parsing → extracting obligations → reconciling → flagging) as a clean step indicator, not a generic spinner.

### 2.6 Component stack for the product UI
- **shadcn/ui** (customized per above — radius, color, font all overridden) as the base.
- **Tremor** for any charts/metrics (exception counts, $ at risk over time) — it's built for exactly this fintech-dashboard look.
- **TanStack Table** under the shadcn table for real sorting/filtering/virtualization on the exception table.
- **lucide** icons, curated — pick intentional icons, don't grab the first match. Consistent stroke weight.
- **Motion (Framer Motion)** only for micro-interactions: drawer slide-in, row expand, subtle number count-up on the $ figures. **No decorative animation in the product.**

---

## 3. MARKETING / LANDING SURFACE — where the wow lives

This is the page that sells Verity and makes the first impression. **This is where Higgsfield-generated motion and cinematic visuals belong.** Different rules apply here — richness is good, as long as it's tasteful and restrained to key moments.

### 3.1 Aesthetic target
Premium AI-startup landing page. References: **Linear's landing, Vercel's landing, Ramp's homepage, ElevenLabs' site.** Cinematic but clean — never busy.

### 3.2 Where Higgsfield motion goes (and where it doesn't)
- ✅ **Hero background/centerpiece:** a Higgsfield-generated cinematic loop or animated visual behind/beside the headline — abstract, premium, on-brand (think: flowing data, document/ledger motifs, subtle green-tinted motion). This is the "wow in 3 seconds" moment.
- ✅ **One or two key section transitions or a product-reveal moment** — a tasteful animated sequence showing Verity catching an exception.
- ✅ **A polished demo video** of the actual product (screen-recorded, lightly motion-enhanced).
- ❌ **Not on every section.** Overusing Higgsfield effects is its own AI-slop tell. One hero moment + maybe one reveal. The rest of the page is clean typography and real product screenshots.
- ❌ **Never inside the actual product UI.**

### 3.3 How to generate the Higgsfield assets (keep them tasteful)
- Match the brand: deep-green accent, near-black/off-white, financial/ledger/document motifs. Prompt for "subtle, premium, cinematic, minimal, enterprise fintech" — NOT "flashy, colorful, sci-fi."
- Keep motion slow and confident. Fast/busy motion reads cheap. Slow, deliberate motion reads expensive.
- Generate a few options, pick the most restrained one. When in doubt, less.

### 3.4 Landing page structure (avoid the generic template)
- **Hero:** headline (what Verity does in one sentence) + one-line subhead + one primary CTA + the Higgsfield cinematic visual. Real product screenshot visible or just below the fold.
- **The proof moment:** show the actual exception dashboard with real data — "Verity caught $32,450 in billing exceptions across 47 invoices in 8 seconds." Real numbers from your eval report. This is more convincing than any feature list.
- **How it works:** 3 steps, but shown through real product UI, not generic emoji cards.
- **The technical credibility section:** for a portfolio piece aimed at FDE interviewers — briefly show the architecture (agents + MCP + evals + tracing). This signals the engineering depth behind the polish.
- **CTA:** clean, single accent button. No gradient.

---

## 4. How to instruct Claude Code with this spec

When building any UI, reference this file explicitly:

> "Read docs/DESIGN_SPEC.md. Build the [component] following the Product UI system exactly — use the defined color tokens, Geist font, 6px radius, tabular numerics, and the severity badge system. Feel like Ramp's dashboard: dense, restrained, no gradients, no decorative motion. Show real fixture data, not placeholders."

For the landing page:

> "Read docs/DESIGN_SPEC.md section 3. Build the marketing landing surface — cinematic but clean, like Linear's landing. Leave a hero slot for a Higgsfield-generated visual. Use real product screenshots and real numbers from the eval report. One accent color, no generic feature-card template."

**Highest-leverage tactic:** screenshot a reference (Ramp dashboard, Linear landing) and give it to Claude Code as a visual reference alongside this spec. Visual reference + written spec beats either alone.

---

## 5. The one-line test before shipping any screen

Ask: *"Would this look at home inside Ramp or Stripe's actual product?"* If yes, ship it. If it looks like a generic admin template or an AI-generated demo, it's not done — check it against the Anti-Slop Rules in Section 1.
