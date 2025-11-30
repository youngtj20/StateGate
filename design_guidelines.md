# LGPOA State Selection Landing Page - Design Guidelines

## Design Approach
**Reference-Based: Government/Institutional Portal Design**
Drawing inspiration from official government portals (gov.uk, digital.gov.ng) combined with modern SaaS authentication pages. Prioritize trust, clarity, and accessibility with a professional, authoritative aesthetic befitting a pension administration system.

## Core Design Elements

### Typography
- **Primary Font**: Inter or DM Sans (Google Fonts) - modern, highly legible for government applications
- **Headings**: 
  - Hero/H1: text-4xl/text-5xl, font-semibold
  - Section headers: text-2xl/text-3xl, font-medium
  - Labels: text-sm, font-medium, uppercase tracking
- **Body Text**: text-base/text-lg, font-normal, leading-relaxed for optimal readability
- **Micro-copy**: text-sm/text-xs for helper text and disclaimers

### Layout System
**Tailwind Spacing Units: 4, 6, 8, 12, 16, 24**
- Consistent padding: p-8 for cards, p-6 for sections, p-4 for buttons
- Vertical rhythm: space-y-6 for form elements, space-y-8 for sections
- Desktop two-column split: 45% decorative left panel, 55% functional right panel
- Mobile: Stack vertically, decorative panel reduced to compact header

### Component Library

**Split-Screen Layout**
- Left Panel: Fixed decorative section with Nigeria map illustration, gradient overlay, branding lockup
- Right Panel: Centered form container (max-w-md), vertically centered content

**State Selection Component**
- Large, searchable select dropdown with all 36 states + FCT alphabetically ordered
- Clear label: "Select Your State" with helper text below
- Search functionality within dropdown for quick navigation
- Selected state displays full name (e.g., "Lagos State" not "Lagos")
- Validation state indicators (border styling for empty/filled)

**Form Elements**
- Spacious input fields: py-4 px-6, rounded-lg borders
- Focus states: Prominent border highlighting, no color shifts
- Labels positioned above inputs with proper spacing (mb-2)

**Primary CTA Button**
- Full-width on mobile, fixed width on desktop
- Generous padding: py-4 px-8
- Clear action label: "Continue to [State Name] Login" (dynamic based on selection)
- Disabled state when no selection made
- Loading spinner replaces text during redirect

**Branding Elements**
- Nigerian government coat of arms/logo placement (top-left on desktop, centered on mobile)
- "LGPOA" primary wordmark with tagline: "Know Your Citizens Technology"
- Official color scheme respecting Nigerian government identity

**Trust Indicators**
- Subtle footer with contact information
- Security badge/icon near form
- "Official Government Portal" designation

### Images
**Nigeria Map Illustration** (Left Panel, Desktop Only)
- Stylized, geometric Nigeria map with state boundaries
- Semi-transparent overlay with gradient
- Abstract, modern interpretation (not photorealistic)
- Fills left panel completely: background-size: cover
- Mobile: Condensed version in header (h-32 banner) or removed entirely

**Government Logo/Seal** 
- Nigerian coat of arms positioned prominently
- High contrast, clear visibility
- SVG format for crispness at all sizes

No hero image in traditional sense - the split-screen layout with map illustration serves as the visual anchor.

### Accessibility
- ARIA labels for state dropdown
- Keyboard navigation fully supported
- High contrast ratios for all text (WCAG AA minimum)
- Focus visible on all interactive elements
- Screen reader announcements for redirect actions

### Responsive Behavior
- **Desktop (lg:)**: Horizontal split 45/55
- **Tablet (md:)**: Adjust split to 40/60 or stack
- **Mobile**: Vertical stack, map illustration as compact header or hidden, form takes full width with lateral padding (px-6)

### Animations
Minimal, purposeful only:
- Smooth dropdown open/close (duration-200)
- Gentle loading spinner during redirect
- No scroll animations or decorative motion

### Page Structure
1. Split-screen container (full viewport height on desktop)
2. Left: Decorative panel with map + branding
3. Right: Centered card with state selector form
4. Footer: Minimal contact/support info

**Critical Constraint**: This is a single-purpose utility page - keep it focused, professional, and fast. Every element serves the goal of getting users to their state-specific login efficiently and confidently.