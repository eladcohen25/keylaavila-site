# Keyla Avila — Brand Style Guide

## Color Palette

| Token         | Hex       | Usage                                    |
|---------------|-----------|------------------------------------------|
| Cream         | `#FEFCFA` | Primary background                       |
| Warm White    | `#FAF7F4` | Alternate section background             |
| Blush         | `#F0E4DC` | Accent backgrounds, highlights           |
| Sand          | `#E8DDD3` | Borders, dividers, subtle fills          |
| Muted Rose    | `#C9A99A` | Primary accent, buttons, links           |
| Taupe         | `#8C7B6F` | Secondary text, captions                 |
| Charcoal      | `#2C2825` | Primary body text                        |
| Soft Black    | `#1A1714` | Headings, high-contrast elements         |

### Usage Rules
- Never use more than 2 accent colors in a single section
- Backgrounds alternate between Cream and Warm White for rhythm
- Blush is reserved for feature areas, credential badges, and hover states
- Muted Rose is the primary CTA and accent color — use sparingly

---

## Typography

### Heading: Cormorant Garamond
- Weights: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold)
- Usage: All headings (h1–h4), hero text, pull quotes
- Style: Often light or regular weight at large sizes for elegance
- Letter-spacing: -0.02em for large headings, normal for smaller

### Body: DM Sans
- Weights: 300 (Light), 400 (Regular), 500 (Medium)
- Usage: Body text, navigation, buttons, captions, form fields
- Style: Clean, modern, highly readable
- Letter-spacing: 0.01em for body, 0.08em for uppercase labels

### Hierarchy
| Element        | Font              | Size (Desktop)  | Weight | Line Height |
|----------------|-------------------|-----------------|--------|-------------|
| Hero Heading   | Cormorant         | 64–80px         | 300    | 1.05        |
| Section Title  | Cormorant         | 44–56px         | 400    | 1.1         |
| Card Title     | Cormorant         | 28–32px         | 500    | 1.2         |
| Body Large     | DM Sans           | 18–20px         | 300    | 1.7         |
| Body Regular   | DM Sans           | 16px            | 400    | 1.7         |
| Caption/Label  | DM Sans           | 12–14px         | 500    | 1.4         |
| Button         | DM Sans           | 14–15px         | 500    | 1            |

---

## Spacing System

### Section Padding
- Mobile: `py-20 px-6`
- Tablet: `py-28 px-10`
- Desktop: `py-32 px-12` to `py-40`

### Container
- Max width: 1280px, centered
- Inner padding: 24px mobile, 48px desktop

### Component Spacing
- Between heading and subhead: 16–24px
- Between subhead and content: 32–48px
- Between cards/items: 24–32px
- Between sections: 0 (padding handles it)

### Rhythm Rule
Alternate between tighter and more spacious sections to create visual breathing. Never stack two dense sections back-to-back.

---

## Button Styles

### Primary Button
- Background: Soft Black (#1A1714)
- Text: Cream (#FEFCFA)
- Font: DM Sans, 14px, weight 500, uppercase, letter-spacing 0.08em
- Padding: 16px 32px
- Border-radius: 100px (pill shape)
- Hover: Background shifts to Charcoal, subtle scale(1.02)
- Transition: 300ms ease

### Secondary Button
- Background: transparent
- Border: 1px solid Sand (#E8DDD3)
- Text: Charcoal (#2C2825)
- Same font treatment as primary
- Hover: Background fills with Blush, border becomes Muted Rose
- Transition: 300ms ease

### Text Link
- Color: Muted Rose (#C9A99A)
- Underline: 1px, offset 4px, Muted Rose at 40% opacity
- Hover: Full opacity underline, slight translateX(2px) on arrow if present

---

## Image Treatment

### Portrait Photos
- Aspect ratio: 3:4 or 2:3 (portrait-first)
- Border-radius: 8–12px
- Object-fit: cover
- Optional: subtle box-shadow (0 8px 32px rgba(0,0,0,0.06))

### Gallery Images
- Masonry grid with varied heights
- 8px gap on mobile, 16px on desktop
- Slight hover: scale(1.02), increased shadow

### Placeholder Strategy
- Use neutral gradient placeholders (#E8DDD3 to #F0E4DC)
- Clearly labeled for easy asset replacement
- Maintain aspect ratios

---

## Animation Principles

### Philosophy
Animation is a premium design feature. Every motion must be intentional, supporting hierarchy and storytelling. Less is more.

### Scroll Reveals
- Direction: fade-up (translateY: 30px → 0)
- Duration: 600–800ms
- Easing: [0.25, 0.1, 0.25, 1] (custom ease-out)
- Trigger: when element is 15–20% visible
- Stagger between siblings: 100–150ms

### Text Animations
- Hero headings: word-by-word or line-by-line stagger
- Section headings: simple fade-up
- Body text: fade-up as a block

### Image Animations
- Subtle scale-in (1.05 → 1.0) with fade
- Optional: soft parallax (translateY range: ±30px)
- Gallery items: staggered grid reveal

### Hover States
- Buttons: scale(1.02), color shift — 300ms
- Cards: translateY(-4px), shadow increase — 300ms
- Images: scale(1.02) — 500ms
- Links: underline draw, color shift — 200ms

### Navigation
- Sticky with backdrop blur on scroll
- Mobile menu: slide-in from right with staggered link reveal
- Background opacity transition on scroll

### Do Not
- Animate more than 3 elements simultaneously in viewport
- Use bounce or elastic easing
- Create animation durations longer than 1000ms
- Use parallax that causes content to feel disconnected
- Animate layout-triggering properties (width, height, top, left)

---

## Section Rhythm Guidelines

| # | Section        | Background  | Density | Height     |
|---|----------------|-------------|---------|------------|
| 1 | Hero           | Cream       | Medium  | Full viewport |
| 2 | About          | Warm White  | Medium  | Auto       |
| 3 | Services       | Cream       | Dense   | Auto       |
| 4 | Credentials    | Blush       | Light   | Auto       |
| 5 | Testimonials   | Cream       | Light   | Auto       |
| 6 | Content Creator| Warm White  | Medium  | Auto       |
| 7 | Gallery        | Cream       | Dense   | Auto       |
| 8 | Booking        | Warm White  | Medium  | Auto       |
| 9 | FAQ            | Cream       | Light   | Auto       |
| 10| Footer         | Soft Black  | Light   | Auto       |

---

## Mobile Design Principles

1. **Touch-first**: All interactive elements minimum 44px touch target
2. **Typography scales down gracefully**: Hero 40px, Section titles 32px
3. **Single column**: All layouts collapse to single column below 768px
4. **Images stack**: Side-by-side images stack vertically, maintain portrait ratio
5. **Navigation**: Hamburger menu with full-screen overlay
6. **Spacing reduces**: Section padding 80px → 60px, gaps tighten proportionally
7. **Horizontal scroll**: Gallery can use horizontal scroll on mobile
8. **Forms**: Full-width inputs, large touch targets, clear labels
9. **Performance**: Reduce animation complexity on mobile (prefers-reduced-motion)
10. **CTA visibility**: Primary CTAs are always visible without excessive scrolling
