# FidoCool Design Guidelines

## Design Approach

**Selected Approach:** Design System with Modern SaaS Inspiration

**Justification:** FidoCool is a utility-focused practice management tool requiring high usability, data clarity, and professional credibility. We'll use Material Design principles enhanced with modern SaaS aesthetics from Linear and Notion for a clean, efficient veterinary practice dashboard.

**Core Principles:**
- Medical professionalism with approachable warmth
- Data clarity and scanability
- Efficient workflow patterns
- Trust-building through polish and consistency

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts) - Interface text, data tables, forms
- Secondary: Space Grotesk (via Google Fonts) - Headers, section titles

**Type Scale:**
- Display: 3xl (36px) - Dashboard page titles, bold weight
- Heading 1: 2xl (24px) - Section headers, semibold weight
- Heading 2: xl (20px) - Card titles, subsection headers, semibold weight
- Heading 3: lg (18px) - Table headers, medium weight
- Body: base (16px) - Primary content, forms, regular weight
- Small: sm (14px) - Metadata, secondary info, regular weight
- Tiny: xs (12px) - Timestamps, badges, medium weight

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Micro spacing: 2, 4 (within components, between icons and text)
- Component padding: 6, 8 (cards, buttons, input fields)
- Section spacing: 12, 16 (between major sections, card groups)
- Page margins: 20 (main container padding)

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-6 md:px-8
- Dashboard layout: Sidebar (240px fixed) + Main content (flex-1)
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Data tables: Full width within container with horizontal scroll on mobile

---

## Component Library

### Navigation

**Sidebar Navigation:**
- Fixed left sidebar, 240px width, full height
- Logo/practice name at top with 8 vertical padding
- Navigation items with icons (Heroicons outline) + labels
- Active state: Slightly elevated visual treatment
- Bottom section for user profile with small avatar + name + role

**Top Bar (Optional for mobile):**
- Hamburger menu icon for mobile sidebar toggle
- Practice name center-aligned
- User avatar right-aligned

### Dashboard Components

**Metric Cards:**
- Generous padding (p-8)
- Large number display (text-4xl font-bold)
- Label below number (text-sm)
- Icon top-right corner (Heroicons, 24px)
- Subtle elevation/border treatment
- 3-column grid on desktop, stack on mobile

**Event Timeline/List:**
- Card container with header "Próximos Eventos"
- Each event as row with: Date badge (left), Pet name + Owner (center), Event type badge (right)
- Spacing between rows: 4
- Hover state for entire row
- Empty state illustration with "No hay eventos programados"

**Quick Actions:**
- Prominent primary buttons: "Nuevo Cliente", "Nueva Mascota", "Registrar Visita"
- Button group with gap-4
- Icons included in buttons (Heroicons)

### Data Tables

**Client/Pet Tables:**
- Striped rows for scanability
- Column headers: uppercase, text-xs, semibold, letter-spacing wider
- Row padding: py-4 px-6
- Columns: Name (bold), Contact Info, # Pets, Last Visit, Actions
- Actions column: Icon buttons for Edit/View/Delete
- Pagination footer with centered controls
- Mobile: Card-based layout stacking table data

### Forms

**Input Fields:**
- Labels: text-sm font-medium, mb-2
- Input height: h-12
- Border radius: rounded-md
- Focus state: ring treatment (ring-2)
- Error state: red ring + helper text below
- Helper text: text-xs, mt-1

**Form Sections:**
- Group related fields with background card
- Section headers with text-lg font-semibold mb-6
- Field spacing: gap-6 between fields
- Two-column layout on desktop for compact forms (grid-cols-2)

**Buttons:**
- Primary: h-12, px-8, rounded-md, font-medium
- Secondary: Same dimensions, different treatment
- Icon buttons: w-10 h-10, rounded-md, centered icon
- Button groups: gap-4 between buttons

### Modals/Dialogs

**Structure:**
- Backdrop overlay with blur
- Modal: max-w-2xl, rounded-lg
- Header: p-8, border-bottom
- Body: p-8, max-h-[60vh] overflow-y-auto
- Footer: p-8, border-top, flex justify-end gap-4

### Cards

**Pet Profile Cards:**
- Photo placeholder circle (96px) at top or left
- Pet name: text-xl font-semibold
- Metadata row: Species, Breed, Age with icons
- Owner name: text-sm
- Last visit timestamp
- Quick action buttons at bottom

**Client Cards:**
- Header with client name (text-lg) + contact icon
- Grid of pet mini-cards within (if showing pets)
- Statistics: Total visits, Last visit date
- Action buttons: View Details, Add Pet

### Badges & Pills

**Status Indicators:**
- Small rounded pills (rounded-full px-3 py-1 text-xs)
- Event types: "Visita Pasada", "Próxima Visita", "Vacunación"
- Distinct visual treatment per type (no color mentioned, but different patterns)

### Icons

**Icon Library:** Heroicons (via CDN)
- Navigation: 24px icons, outline style
- Buttons: 20px icons within buttons
- Cards: 20px icons for metadata
- Tables: 16px icons in action columns

---

## Animations

**Minimal, Purposeful Motion:**
- Hover transitions: 150ms ease-in-out
- Modal enter/exit: 200ms with subtle scale
- Loading states: Pulse animation on skeleton screens
- No scroll-triggered animations
- No autoplay carousels

---

## Images

**Strategic Image Use:**

**Logo/Branding:**
- Practice logo in sidebar (120px width)
- Favicon with FidoCool brand mark

**Pet Photos:**
- Circular avatars (64px, 96px sizes)
- Placeholder illustrations for pets without photos (cute animal silhouettes)
- Square thumbnails in tables (40px)

**Empty States:**
- Illustration for "No clients yet" - welcoming veterinary scene
- Illustration for "No upcoming events" - calendar with pet paw
- Illustration for "No pets registered" - pet outline with plus icon

**No Hero Section:** This is an application dashboard, not a marketing site.

---

## Accessibility & Quality Standards

- Maintain WCAG AA contrast ratios
- All interactive elements keyboard accessible
- Form inputs with clear labels and error states
- Focus indicators on all interactive elements
- Semantic HTML throughout
- Screen reader friendly labels and ARIA attributes
- Consistent tab order logical flow