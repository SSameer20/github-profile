## Terminal Profile Card Review

### Overall Score

6.5/10

The content is correct, but the generated Markdown loses the visual structure of the reference image.

---

## Problems

### 1. Layout Lost

The reference is a fixed-width terminal dashboard with two columns.

The generated Markdown becomes a normal vertical document.

Expected:

- Preserve terminal dashboard layout.
- Emit layout metadata (columns, widths, placement).

---

### 2. ASCII Placement

ASCII art is rendered after all sections.

Expected:

- ASCII avatar belongs to the left column.
- Profile information should appear beside it.

---

### 3. Missing Compact Formatting

Avoid large vertical spacing.

Instead of:

- Repositories
- Followers
- Following

Prefer compact rows:

Repos........100
Followers.....22
Following.....35

---

### 4. Missing Terminal Styling

Generate separators such as:

──────────────────────────────

instead of relying only on Markdown headings.

---

### 5. Missing Alignment

Terminal cards depend on aligned labels and values.

Prefer:

OS..........Windows
Host........TTN
IDE.........VSCode

instead of unordered Markdown lists.

---

### 6. No Layout Metadata

The Markdown should include rendering hints describing:

- layout type
- number of columns
- ASCII position
- preferred widths
- section order
- spacing

This allows the frontend to recreate the original layout accurately.

---

### 7. ASCII Size

Provide metadata describing the intended width and height of the ASCII block so it occupies the full left panel.

---

### Goal

The output should describe both the **content** and the **presentation**. The renderer should be able to reconstruct a terminal dashboard that closely matches the reference image rather than producing a standard Markdown document.

### implementation notes

- The commit payload now emits `layout: terminal-dashboard` metadata with two columns, ASCII left placement, fixed widths, section order, and compact spacing hints.
- The generated README now uses compact aligned rows and terminal separators instead of only Markdown headings and bullet lists.

## feedbacks

- profile card generated in wrong layput it should be in below format
  ┌──────────────┬─────────────────────────┐
  │ ASCII │ Profile │
  │ │ Contact │
  │ │ GitHub Stats │
  └──────────────┴─────────────────────────┘

- ASCII image i s to large so maintian a ratio taht fits in teh readme and not oto long be a 2:3 ratio where length of is 2 and width 3

### implementation notes

- The README formatter now emits a boxed two-column terminal layout with the ASCII block on the left and compact profile rows on the right.
- The ASCII block is clamped to a 2:3 height-to-width ratio with fixed metadata so it fits the README without becoming overly tall.

## issue - layout

generated below markdown

# Sameer Shaik

````terminal
layout:
  layout: terminal-dashboard
  columns: 2
  ascii_position: left
  left_width: 34
  right_width: 54
  section_order: profile > contact > github stats
  spacing: compact
  ascii_ratio: 2:3
  ascii_width: 30
  ascii_height: 20

┌────────────────────────┬──────────────────────────────────────────────┐
│ ASCII                  │ Profile                                      │
├────────────────────────┼──────────────────────────────────────────────┤
│ XAAAA225#@&@@@@&&&&@&SMGS##9&& │ Name........ Sameer Shaik                    │
│ sXXXXA2G@&@@&&&&&@BMS&hXXX2S&@ │ Role........ Full Stack Architect            │
│ sXXXXX2#@&&@@@@@&BhXAG@GA5#@&& │ Host........ Prettiflow Inc                  │
│ XsXXXAA2S@9GS999&S22A2MBS9@&&& │ Kernel...... GitHub OAuth / Prisma / Next.js │
│ XssXXAXXAH&#3535HBS2AA59&&@&&@ │ IDE......... VSCode 1.96.0                   │
│ srrXXXXXXX3BBM352h9S23BB3h#9#S │ ──────────── Contact ────────────            │
│ srirssXXsXA2SBBBB##BS9#2ssiX33 │ Email....... sameer.shaik@prettiflowinc.com  │
│ sr;:irsssXXsX25hMHSGHMXrs;:::r │ Website..... sameer.dev                      │
│ Xr::;rssXXXsssXA2335Asiss;::,: │ LinkedIn.... linkedin.com/in/sameer          │
│ As::;rrrssXsssX25222r;:::;:,,, │ ───────── GitHub Stats ─────────             │
│ ssiirssrirrisXAArXXi::,,,,,,.. │ Repos....... 100                             │
│ ssssrrsXXsrirXi;;i:::,,,,,,,.. │ Followers... 22                              │
│ XsiiriirXAXir;ir;:::,,,....... │ Following... 35                              │
│ 32sriiirXAXrsrri;:,,,,........ │ Gists....... 0                               │
│ &&B9Hs;isXX2sii:,,,........... │ Top Langs... TypeScript, JavaScript, C#, Pyt │
│ @&@9S93rrXAX;:,,,,........,,:: │ ──────────── Bio ────────────                │
│ B&&5XM9GXAr:,,,,........,;rrAX │ Bio......... Building scalable systems with  │
│ A2G#hA3B&GshX,,........:rA2235 │ Uptime...... 3 years on GitHub               │
│ #GGB&S#&HXH#Ms:......,iX255333 │ Layout...... 2 columns, ASCII left, compact  │
│ #BG3MB@BM235Asi,....:s22533335 │ Spacing..... tight / terminal-dashboard      │
└────────────────────────┴──────────────────────────────────────────────┘

ASCII Avatar:
```text
XAAAA225#@&@@@@&&&&@&SMGS##9&&
sXXXXA2G@&@@&&&&&@BMS&hXXX2S&@
sXXXXX2#@&&@@@@@&BhXAG@GA5#@&&
XsXXXAA2S@9GS999&S22A2MBS9@&&&
XssXXAXXAH&#3535HBS2AA59&&@&&@
srrXXXXXXX3BBM352h9S23BB3h#9#S
srirssXXsXA2SBBBB##BS9#2ssiX33
sr;:irsssXXsX25hMHSGHMXrs;:::r
Xr::;rssXXXsssXA2335Asiss;::,:
As::;rrrssXsssX25222r;:::;:,,,
ssiirssrirrisXAArXXi::,,,,,,..
ssssrrsXXsrirXi;;i:::,,,,,,,..
XsiiriirXAXir;ir;:::,,,.......
32sriiirXAXrsrri;:,,,,........
&&B9Hs;isXX2sii:,,,...........
@&@9S93rrXAX;:,,,,........,,::
B&&5XM9GXAr:,,,,........,;rrAX
A2G#hA3B&GshX,,........:rA2235
#GGB&S#&HXH#Ms:......,iX255333
#BG3MB@BM235Asi,....:s22533335
````

```

Layout summary: layout: terminal-dashboard | columns: 2 | ascii_position: left | left_width: 34 | right_width: 54 | section_order: profile > contact > github stats | spacing: compact | ascii_ratio: 2:3 | ascii_width: 30 | ascii_height: 20






so fix that creates

images small sixed in 2 ration length and width so fix to much extra things

```

### fixed output shape

- The generated README now uses a tighter two-column terminal box with the ASCII block on the left and profile rows on the right.
- The ASCII block is capped to a compact 18x12 fit so it stays small and does not stretch the README vertically.
- Redundant markdown summary noise has been removed from the saved output.
