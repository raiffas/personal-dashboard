# Personal Dashboard — Design System

## What this is

A personal, journal-like dashboard app: a home screen (day/night), a checkin (journaling) screen, an inbox, and a calendar. The whole system is built around one idea — **a hand-decorated journal, not a productivity tool.**

## Sources

This design system was authored from two files uploaded directly to this project (no Figma or codebase attached):

- `uploads/design-system.md` — a written spec extracted from Home (day), Home (night), and Checkin mockups, extended to Inbox and Calendar.
- `uploads/style-guide.html` — a working HTML style-guide demo (day/night toggle, hero pattern, palette, type, paper card, buttons, nav).

No component library, Figma file, or production codebase was provided. Because no concrete source defines a component inventory, this design system authors a standard component set sized to the brand's actual needs (see "Intentional additions" below) rather than inventing a large generic kit.

## Concept

Day and night are the same layout with the accent hue swapped (warm yellow ↔ cool indigo) — like flipping a page in the same notebook. Every page gets, at most, one large glowing orb (sun or moon) as its single hero focal point. Compose/write surfaces (Checkin today) sit on a torn scrap of taped paper — the product's one recurring "you are writing something" affordance. Inbox/Calendar cross-links from Home use a soft pink arrow-chevron shape instead of a button.

## Intentional additions

Beyond what `design-system.md` §6–7 specifies (Nav bar, Arrow nav button, Paper card, Buttons, Date stamp, list rows/calendar cells), this system adds a small number of primitives needed to make Inbox and Calendar function, following the spec's own extension rules in §7:

- **PageHeader** — the "inbox" / "calendar" bubble-letter header pattern described in §7.
- **UnreadDot** — the small pink dot marker described in §7 ("Unread / today markers").
- **Orb** — factored out of the hero pattern so it's reusable/sizeable.
- **EmptyState** — the Caveat-voice empty-state pattern described in §7.

## Content fundamentals

- **Case:** lowercase, almost everywhere copy is voiced by the product itself — headlines ("good morning!"), accents ("write your checkin!", "jot ur thoughts"), date stamp ("monday august 10 2026"), empty states ("nothing here yet"). UI labels/nav (inbox, calendar, checkin) are also lowercase. Reserve normal sentence case for anything that must read as a neutral system label rather than the product's "voice" (rare in this system).
- **Person:** second person, direct address — "write your checkin!" not "users can write a checkin." The product talks to you like a friend, not about you.
- **Punctuation:** minimal. Exclamation points are earned and used sparingly for warmth ("good morning!", "got it, saved!") — not stacked, not on every line. Date stamp and nav labels carry no punctuation at all.
- **Tone:** casual, encouraging, a little playful — "jot ur thoughts" uses informal shorthand ("ur") deliberately; don't over-correct it to "your" everywhere, but don't overuse the affectation either. Confirmations read like a note from a friend: "got it, saved!" not "Entry successfully submitted." Errors and empty states should carry the same warmth, never a cold system tone.
- **Emoji:** not used in product copy or UI. The style-guide demo file uses a flower glyph (✿) and pen glyph (✎) purely as decorative marks in its own header/footer chrome — these are demo-file flourishes, not a sanctioned in-product emoji pattern. Don't introduce emoji into Home/Checkin/Inbox/Calendar copy.
- **Voice examples to imitate:** "good morning!" / "good night!", "write your checkin!", "jot ur thoughts", "nothing here yet", "got it, saved!".

## Visual foundations

- **Color:** two mood palettes (day: sky blue `--bg` #9AC5FF, golden-yellow headline; night: lavender `--bg` #C2CDFF, deep-indigo headline) that swap together via `[data-mode]`, plus a small set of shared accents that never change (`--ink` maroon, `--arrow-pink`, `--paper`, `--nav-bg`). `--ink` is deliberately the one color that doesn't swap between moods — it's "the pen," a constant across the whole product. Body copy that must be read (inbox previews, calendar titles, form labels) uses the darker `--text-primary` / `--text-secondary` ink tier, never the pale `--text-muted` decorative tone, which is reserved for hero-page decoration (the date stamp) where AA contrast doesn't matter.
- **Type:** three faces, each with one job. Boogaloo (bubbly, rounded, arced) is the sticker/headline voice — hero greeting, and scaled-down page headers on Inbox/Calendar. Caveat (casual pen script) is for handwritten asides only. Inter carries everything that needs to be read quickly: nav, dates, body, form fields, list content. Never mix — body copy is never set in Boogaloo or Caveat.
- **Backgrounds:** flat mood-color fields, no photography, no gradients as backgrounds (the one radial gradient in the system is reserved for the orb itself), no repeating textures or patterns. The background is always the current mood color, on every page — not just Home — so nothing reads as "bolted on."
- **Illustration:** none — no hand-drawn illustrations beyond the orb and paper-card motifs themselves, which are built from CSS shapes, not artwork.
- **Animation:** minimal, purposeful, short (150–220ms), ease-out. Arrow-nav hover nudges 4px in the pointing direction + scales to 1.03. The paper card enters with a "flutter": translateY -10px→0 combined with a rotate 2°→0°. No bounce, no spring physics, no looping ambient motion — the orb glow is a static shadow, not a pulse.
- **Hover states:** arrow buttons nudge + scale (above). Primary buttons gain a hard 2px offset shadow in `--ink` plus a -2px/-2px translate, echoing the headline's cutout treatment. Secondary/text buttons underline on hover only — no color change.
- **Press states:** not separately specified beyond the hover treatment; treat press as a continuation of the hover offset (don't add a new visual language for :active).
- **Borders:** hairline `rgba(0,0,0,0.06)` under the nav bar only. Primary buttons get a solid 2px `--ink` border — the one deliberately heavy border in the system, matching the headline's ink color. Nothing else is bordered; cards and paper rely on shadow, not borders, to separate from the background.
- **Shadows:** one soft shadow token (`--shadow-soft`, `0 8px 30px rgba(0,0,0,0.08)`) used only under the paper card. Buttons use a hard, zero-blur offset shadow (`2px 2px 0 var(--ink)`) instead of a soft shadow — this is a distinct, deliberate technique (a "cutout," not a drop shadow) and shouldn't be softened to match the paper card's shadow.
- **Corner radii:** two tokens only. `--radius-sm` (8px) for nav, form fields, buttons, and the small paper-card treatment used for list rows/calendar cells. `--radius-lg` (24px) for the hero/paper-card container corners, before the torn-edge clip-path mask is applied on the actual Checkin paper.
- **Cards:** two distinct card languages, don't blend them. (1) The compose "paper card": `--paper` fill, jagged torn-bottom edge via `clip-path`, a rotated tape strip, `--shadow-soft`, reserved for places the user writes. (2) The plain list-row/calendar-cell "index card": same `--paper` fill and `--radius-sm`, but no tape, no torn edge, no rotation — used for Inbox rows and Calendar cells sitting on top of the mood color like index cards on a desk.
- **Transparency & blur:** `--tape` is applied at ~75% opacity over the mood background; that's the only intentional transparency in the system. No blur/glassmorphism anywhere.
- **Rotation:** one or two rotated elements per screen, never more. The hero headline rotates ±3–4°, the tape strip rotates -4° to -6°. Don't rotate a third element on the same screen — it tips from "handmade" into "messy."
- **Layout:** single centered content column, `--max-width` 720px, fixed top nav (`--nav-height` 56px) that persists across pages. `--space-section` (64px) separates the hero from the date stamp below it.
- **Imagery color vibe:** n/a — no photography is used in this system; all color comes from the flat mood palette and the orb's radial gradient.

## Iconography

No dedicated icon system, icon font, or SVG icon set exists in the source material. Iconography in this product is deliberately minimal and built from the same shape language as everything else, not a separate icon layer:

- The nav bar's mode indicator is a plain filled circle in `--orb-core` (a miniature orb), not a sun/moon glyph.
- Inbox/Calendar cross-links use the arrow-chevron `clip-path` shape, not an arrow icon.
- Unread/today markers are a small solid dot in `--arrow-pink`, not a badge or icon.
- No emoji, no unicode symbols, are used as in-product icons (the ✿ and ✎ marks in the uploaded style-guide file are demo-page flourishes only, not part of the app itself — see Content fundamentals).

If a future screen genuinely needs a glyph this shape language can't express, match stroke weight/fill style to the soft, rounded, filled forms above rather than importing a generic outline icon set wholesale.

## Components

- `components/core/` — `Orb`, `Button`, `PaperCard`, `IndexCard`, `UnreadDot`, `DateStamp`, `EmptyState`, `PageHeader`.
- `components/navigation/` — `NavBar`, `ArrowButton`.

## Index

- `styles.css` — root stylesheet, `@import`s everything below.
- `tokens/` — `colors.css` (mood palettes + shared accents), `typography.css` (font stacks + type scale), `spacing.css` (radii, shadow, layout), `fonts.css` (Google Fonts import: Boogaloo, Caveat, Inter).
- `guidelines/` — foundation specimen cards for the Design System tab (colors, type, spacing, motifs).
- `components/` — reusable React primitives, grouped by concern.
- `ui_kits/personal-dashboard/` — click-through recreation of Home (day/night), Checkin, Inbox, Calendar.
- `assets/` — visual assets. **No logo was provided** — the brand name is rendered in the Boogaloo display face wherever a mark would go; see VISUAL FOUNDATIONS.
- `SKILL.md` — portable skill file for using this system in Claude Code.

