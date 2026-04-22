---
name: Productivity Workspace
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#404752'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#717783'
  outline-variant: '#c0c7d4'
  surface-tint: '#0060ab'
  primary: '#005faa'
  on-primary: '#ffffff'
  primary-container: '#0078d4'
  on-primary-container: '#ffffff'
  inverse-primary: '#a3c9ff'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e4e2e1'
  on-secondary-container: '#656464'
  tertiary: '#974700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc5b00'
  on-tertiary-container: '#ffffff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e3ff'
  primary-fixed-dim: '#a3c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004883'
  secondary-fixed: '#e4e2e1'
  secondary-fixed-dim: '#c8c6c6'
  on-secondary-fixed: '#1b1c1c'
  on-secondary-fixed-variant: '#474747'
  tertiary-fixed: '#ffdbc8'
  tertiary-fixed-dim: '#ffb689'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#743500'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  display:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

## Brand & Style

The brand personality of this design system is focused on **efficiency, clarity, and reliability**. It aims to evoke a sense of calm focus, transforming a chaotic schedule into a manageable, structured experience. The target audience is the modern professional who requires a tool that feels institutional yet approachable.

The design style follows a **Corporate / Modern** aesthetic, heavily influenced by the Microsoft Fluent design language. It prioritizes readability through generous whitespace and a strict typographic scale. Visual interest is achieved not through decorative elements, but through functional depth, subtle motion, and the precise use of the primary blue to guide user intent.

## Colors

The color palette is built around the iconic **Primary Blue (#0078D4)**, which serves as the primary action color for buttons, active states, and focus indicators. 

In **Light Mode**, the interface utilizes a crisp white background with subtle gray-washed surfaces (#F3F2F1) to differentiate sidebar navigation from the main content area. In **Dark Mode**, the system shifts to a deep charcoal gray/blue, using layered surfaces to indicate hierarchy. Text colors are carefully weighted to ensure high legibility while maintaining a soft visual footprint that reduces eye strain during long periods of use.

## Typography

This design system utilizes **Inter** as the primary typeface, selected for its exceptional legibility and neutral, systematic character that mirrors the utility of Segoe UI. 

The typographic hierarchy is intentionally tight. **Display** styles are used sparingly for calendar headers or list titles to maintain a clean look. **Body-md** is the workhorse for task names and event descriptions, while **Label** styles are reserved for metadata like dates, times, and category tags. All weights are kept between Regular (400) and Semi-Bold (600) to ensure the interface never feels "heavy" or overly aggressive.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model, allowing the calendar view to expand and provide maximum context while the task sidebar remains at a fixed, comfortable width (320px - 360px). 

The spacing rhythm is based on a **4px baseline grid**. All padding and margins should be multiples of 8px to ensure a consistent vertical rhythm. Components like task cards use a 16px internal padding (md), while smaller list items use 8px (sm) to maximize information density without feeling cluttered.

## Elevation & Depth

Visual hierarchy in this design system is established through a combination of **Tonal Layers** and **Ambient Shadows**. 

1.  **Resting State:** Components like task cards and calendar events sit flat on the surface with a thin 1px border (#EDEBE9 in light mode).
2.  **Raised State:** On hover or when an item is being "focused," a very soft, diffused shadow is applied (0px 4px 12px rgba(0,0,0,0.08)). 
3.  **Active/Modal State:** High-level containers like task detail panels or event creation popovers use a more pronounced shadow to create clear separation from the background.

Shadows should never be harsh or pure black; they are tinted slightly by the primary or surface colors to maintain a modern, "lightweight" feel.

## Shapes

The shape language is consistently **Rounded**, using an **8px (0.5rem)** corner radius for almost all UI elements including cards, input fields, and buttons. 

Larger containers like the main calendar view or side panels may use **16px (1rem)** to denote them as primary structural areas. This level of roundedness strikes a balance between professional precision and a friendly, modern user experience. Selectable items, like day-cells in a mini-calendar, may use pill shapes to indicate selection without interfering with the surrounding grid.

## Components

-   **Buttons:** Primary buttons are solid Blue (#0078D4) with white text. Secondary buttons use a light gray ghost style with a thin border. All buttons have an 8px corner radius.
-   **Task Cards:** Simple white or dark-gray rectangles with 8px corners. They feature a circular checkbox on the left and the task text to the right. A thin border is preferred over a shadow for the resting state.
-   **Checkboxes:** Circular (pill-shaped) to align with the "To Do" aesthetic. When checked, they fill with the primary blue and display a white checkmark.
-   **Input Fields:** Clean, minimal styling with a bottom-only border that transforms into a full 1px focus ring in the primary blue color when active.
-   **Chips/Tags:** Used for categories or "Reminders." These are small, low-contrast pills with 12px horizontal padding and `label-sm` typography.
-   **Calendar Events:** Solid blocks of color with 4px rounded corners. Use high-transparency versions of category colors for the background and 100% opacity for the left-side accent bar.
-   **Side Panels:** Use a slightly different background color (#F3F2F1) to provide clear visual anchoring for navigation and task lists.