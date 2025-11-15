# Design Guidelines: Clinical Documentation & Learning App

## Design Approach Documentation

**Selected Approach:** Hybrid - Design System Foundation with Medical Industry Reference

**Primary References:**
- **Notion** - Clean data tables, calm color palette, intuitive navigation
- **Calm App** - Soothing gradients, generous whitespace, stress-reducing aesthetics  
- **Mayo Clinic** - Professional medical trust signals, readable content hierarchy
- **Vitruviana** - Polished medical tech aesthetic, bold statistics, modern credibility

**Core Principles:**
1. **Cognitive Simplicity** - Reduce mental load during high-stress clinical workflows
2. **Trust & Credibility** - Professional medical aesthetic that builds confidence
3. **Speed & Clarity** - Information hierarchy optimized for busy clinicians
4. **Calm Professionalism** - Soothing but never childish or unprofessional

---

## Typography

**Font Stack:**
- **Primary:** Inter (via Google Fonts CDN) - Clean, highly readable, professional
- **Accent/Display:** Instrument Serif or Crimson Pro - Used sparingly for hero headings only

**Hierarchy:**
- **Display (Hero):** 3xl to 5xl, font-semibold, tracking-tight
- **Headings (H1):** 2xl to 3xl, font-semibold  
- **Headings (H2/H3):** xl to 2xl, font-medium
- **Body Text:** base to lg, font-normal, leading-relaxed (1.75)
- **Labels/Metadata:** sm to base, font-medium, text-slate-600
- **Micro-copy:** xs to sm, font-normal, text-slate-500

**Reading Optimization:** All body text blocks use max-w-prose for optimal line length. Case notes and medical content use leading-loose (2.0) for enhanced readability.

---

## Layout System

**Spacing Primitives (Tailwind):**
- **Primary units:** 2, 3, 4, 6, 8, 12, 16
- **Component padding:** p-4 to p-6 for cards, p-8 to p-12 for page containers
- **Vertical rhythm:** space-y-4 for tight groups, space-y-6 for sections, space-y-8 for major divisions
- **Component gaps:** gap-4 for grids, gap-6 for feature layouts

**Container Strategy:**
- **Dashboard/App Pages:** max-w-7xl mx-auto px-4 to px-8
- **Content Reading:** max-w-4xl for case notes and comparison views
- **Forms/Inputs:** max-w-2xl for focused data entry (Recall Checkpoint)

**Grid Patterns:**
- **Dashboard Cards:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Side-by-Side Compare:** grid-cols-1 lg:grid-cols-2 gap-8
- **Past Cases List:** Single column with card-based rows

---

## Component Library

### Navigation
- **Top Nav Bar:** Fixed header with logo left, navigation center, user profile right. Height h-16, backdrop-blur effect, subtle bottom border
- **Mobile:** Hamburger menu with slide-out drawer, full-height overlay navigation

### Cards & Containers
- **Standard Card:** Rounded-xl (16px radius), subtle shadow (shadow-sm), border border-slate-200, bg-white, p-6
- **Interactive Card (Past Cases):** Add hover:shadow-md transition, cursor-pointer
- **Stat Cards (Dashboard):** Prominent number display with label beneath, subtle gradient background

### Buttons
- **Primary CTA:** Rounded-lg, px-6 py-3, font-medium, medical blue/green accent
- **Secondary:** Rounded-lg, border, px-6 py-3, hover border emphasis
- **Icon Buttons:** Square/circular, p-3, icon-only (microphone, play/pause)
- **Flashcard Actions (Again/Good/Easy):** Pill-shaped (rounded-full), px-8 py-2, spaced horizontally

### Forms & Inputs
- **Text Areas (Recall Checkpoint):** Large, h-32 to h-40, rounded-lg, border-slate-300, focus ring medical accent
- **Voice Recording Button:** Large circular button (w-20 h-20), pulsing ring animation during recording, microphone icon centered

### Data Display
- **SOAP Note Sections:** Structured with bold section headers (S:, O:, A:, P:), indented content, monospace-style font for clinical data
- **Comparison Diff:** Highlighted text with subtle background for additions, strikethrough for omissions
- **Flashcard:** Card with flip animation, large centered text, "Click to Reveal" affordance

### Overlays & Modals
- **Case Detail View:** Full-page modal or slide-over panel with close button, scrollable content
- **Audio Waveform:** Animated bars during recording, subtle pulse effect

---

## Images

**Hero Dashboard Background (Optional):**
- Subtle medical pattern or abstract gradient - NOT a large photo
- If used: Very subtle, low opacity (10-15%), doesn't compete with content

**No Large Hero Images** - This is a clinical application, not a marketing site. Focus remains on functionality and data clarity.

**Icons:**
- Use **Heroicons** (outline and solid variants via CDN)
- Medical-specific icons for features: microphone, clipboard, lightbulb (flashcards), folder, stethoscope

---

## Animations

**Minimal & Purposeful:**
- **Voice Recording:** Gentle pulsing ring around microphone button, waveform bar animation
- **Flashcard Flip:** Smooth 3D flip transition (transform rotateY)
- **Button Interactions:** Subtle scale on hover (scale-105), quick transition
- **Page Transitions:** Fade-in content on load (opacity 0 to 100)

**Avoid:** Excessive scroll animations, parallax, decorative motion

---

## Key Screen Patterns

**Dashboard:** 2-3 column grid of action cards, recent cases list below, minimal header above

**Encounter Capture:** Centered content, large microphone button or text area, clear "Generate SOAP" CTA

**Recall Checkpoint:** Clean form layout, clear instructions above, prominent "Reveal AI Draft" button below

**Side-by-Side Compare:** Two-column layout with labeled headers, synchronized scrolling, visual diff highlighting

**Flashcards:** Centered card (max-w-md), flip interaction, button row beneath for scheduling

**Past Cases:** Searchable list with card items showing date, preview, and quick actions