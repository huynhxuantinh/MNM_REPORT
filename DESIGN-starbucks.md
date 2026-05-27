# Starbucks-inspired Design Spec (ASCII Clean)

## 1) Theme Direction

Design tone: warm, premium, friendly.

- Main brand green: `#006241`
- Accent green (CTA): `#00754A`
- Deep green (dark bands/footer): `#1E3932`
- Warm background: `#f2f0eb`
- Card background: `#ffffff`
- Reward gold: `#cba258`
- Error red: `#c82014`

Core visual rhythm:
- Cream page canvas
- White content cards
- Dark green feature bands
- Strong, simple CTA buttons

## 2) Typography

Primary family:
- `SoDoSans, "Helvetica Neue", Helvetica, Arial, sans-serif`

Fallback for implementation:
- `Inter` or `Nunito Sans`

Guidelines:
- Keep letter spacing tight (`-0.01em`)
- Use weight contrast more than size contrast
- Body text on light surface: near-black (`rgba(0,0,0,0.87)`)
- Secondary text: softer black (`rgba(0,0,0,0.58)`)

## 3) Color Roles

Use colors by role, not randomly:

- `#006241`: headings and brand emphasis
- `#00754A`: primary action buttons and interactive highlights
- `#1E3932`: dark feature sections and footer
- `#f2f0eb`: page background
- `#ffffff`: card and modal surfaces
- `#cba258`: reward/status moments only
- `#c82014`: error/destructive states

## 4) Component Rules

### Buttons

Primary filled:
- bg `#00754A`, text `#fff`, border `#00754A`

Primary outlined:
- transparent bg, text `#00754A`, border `#00754A`

Dark outlined:
- transparent bg, text `rgba(0,0,0,0.87)`, border same

Universal button shape:
- `border-radius: 50px`
- Active state: `transform: scale(0.95)`

### Cards

- bg: `#fff`
- radius: `12px`
- soft shadow:
  - `0 0 0.5px rgba(0,0,0,0.14)`
  - `0 1px 1px rgba(0,0,0,0.24)`

### Inputs

- Floating label behavior
- Green tint for valid, red tint for invalid
- Consistent padding and focus border

### Floating CTA (Frap style)

- Circular `56px`
- bg `#00754A`
- white icon
- layered soft shadow
- fixed bottom-right

## 5) Spacing and Layout

Spacing scale (10px root style):
- `0.4rem`, `0.8rem`, `1.6rem`, `2.4rem`, `3.2rem`, `4rem`, `4.8rem`, `5.6rem`, `6.4rem`

Common gutters:
- Mobile: `16px`
- Tablet: `24px`
- Desktop: `40px`

Card radius:
- Standard: `12px`
- Buttons: `50px` (pill)
- Circular icons: `50%`

## 6) Elevation

Use layered, low-alpha shadows.
Avoid heavy single-shadow blocks.

Recommended levels:
- Card: very light
- Navbar: 2-3 subtle layers
- Floating CTA: highest elevation in page

## 7) Do / Dont

Do:
- Keep warm cream canvas
- Use green tiers by role
- Keep pill buttons consistent
- Keep active press feedback
- Use gold only for reward moments

Dont:
- Do not overuse one single green everywhere
- Do not use pure white canvas for all sections
- Do not replace pill buttons with square corners
- Do not add random gradients
- Do not use heavy dark shadows

## 8) Responsive

Breakpoint intent:
- Mobile < 768
- Tablet 768-1023
- Desktop >= 1024

Behavior:
- Hero split collapses to stacked on mobile
- Card grid reduces columns progressively
- Keep touch targets comfortable (>=44px when possible)

## 9) NoroStu Implementation Mapping

Use MUI theme tokens in app:
- `theme.palette.primary.main` -> brand green (`#006241`)
- `theme.palette.primary.dark` -> accent green (`#00754A`)
- `theme.palette.background.default` -> warm base
- `theme.palette.background.paper` -> card surface
- `theme.palette.text.primary` / `text.secondary` for readable contrast

Implementation rule:
- Prefer theme tokens over hardcoded colors in `sx`.
- This keeps light/dark mode consistent.

## 10) Quick Prompt Snippets

1. "Create a primary green pill CTA with radius 50px and active scale 0.95."
2. "Build a white card on warm canvas with 12px radius and soft layered shadow."
3. "Create a dark green feature band with white text and dual CTA row."
4. "Design a floating circular action button (56px) in accent green at bottom-right."
5. "Use role-based green palette and avoid random color mixing."
