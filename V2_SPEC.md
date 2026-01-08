# ClassEase V2 Specification

> This document serves as the complete reference for building ClassEase V2.
> Last updated: January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Tech Stack](#tech-stack)
4. [Data Model Changes](#data-model-changes)
5. [Routes & Navigation](#routes--navigation)
6. [Onboarding Flow](#onboarding-flow)
7. [Dashboard Structure](#dashboard-structure)
8. [Public Pages](#public-pages)
9. [Build Phases](#build-phases)
10. [V1 Archive](#v1-archive)

---

## Overview

ClassEase V2 is a complete rebuild of the dashboard and onboarding experience, focused on:
- **Budget management** as the primary feature
- **Mobile-first** design (ongoing management happens on mobile)
- **Simplified onboarding** (4 steps max)
- **Dark mode support** from day one
- **Hebrew/RTL** throughout

### What Changes
- New onboarding wizard
- New dashboard with tabbed navigation
- Budget-centric UI with charts and timeline
- Simplified data model

### What Stays
- Landing page (`app/page.tsx`, `app/homepage-v2/page.tsx`)
- Auth pages (`app/auth/*`)
- UI primitives (`components/ui/*`)
- CSS variables & Tailwind config
- Supabase client setup
- Header/Footer components

---

## Core Principles

### 1. Mobile-First
- Design for mobile screens first, scale up to desktop
- Touch-friendly tap targets (min 44px)
- Bottom navigation on mobile (thumb-reachable)
- Top navigation on desktop

### 2. RTL Everywhere
- All text, inputs, and layouts are right-to-left
- Use `dir="rtl"` on root elements
- Ensure all components respect RTL

### 3. Dark Mode Native
- Use semantic color tokens exclusively
- No hardcoded colors (no `bg-white`, `text-gray-600`, etc.)
- Use CSS variables that auto-switch:
  - `bg-background`, `bg-card`, `bg-muted`
  - `text-foreground`, `text-muted-foreground`
  - `bg-brand`, `text-brand`, `bg-brand-muted`
  - `bg-success`, `bg-destructive`, `bg-warning`, `bg-info`
  - `border-border`

### 4. Hebrew Language
- All UI text in Hebrew
- Use Hebrew date formats
- Settlement autocomplete with Israeli cities/towns

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS + CSS Variables
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Email + Google OAuth)
- **Charts:** Recharts (for pie charts, timelines)
- **Deployment:** Vercel

---

## Data Model Changes

### Classes Table - New Columns

```sql
ALTER TABLE classes ADD COLUMN IF NOT EXISTS settlement TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS institution_name TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS annual_amount_per_child DECIMAL(10,2);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS estimated_children INTEGER;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS estimated_staff INTEGER;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS paybox_link TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT FALSE;
```

### Events Table - New Columns

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS amount_per_kid DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS amount_per_staff DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS allocated_for_kids DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS allocated_for_staff DECIMAL(10,2);
ALTER TABLE events ADD COLUMN IF NOT EXISTS kids_count INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS staff_count INTEGER;
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS paid_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS sort_order INTEGER;
```

### Children Table - New Columns

```sql
ALTER TABLE children ADD COLUMN IF NOT EXISTS payment_status TEXT
  CHECK (payment_status IN ('paid', 'unpaid')) DEFAULT 'unpaid';
ALTER TABLE children ADD COLUMN IF NOT EXISTS payment_date DATE;
-- Note: birthday column already exists from previous migration
```

### Staff Table
- Already has: `name`, `role`, `birthday` (month/day only for display)
- No changes needed

---

## Routes & Navigation

### Route Structure

| Route | Purpose | Access |
|-------|---------|--------|
| `/` | Landing page | Public |
| `/homepage-v2` | Alternative landing | Public |
| `/auth/login` | Login | Public |
| `/auth/sign-up` | Sign up | Public |
| `/onboarding` | Setup wizard (3 steps) | Authenticated |
| `/dashboard` | Main app (tabbed) | Admin |
| `/directory/[code]` | Public contact list | Anyone with link |
| `/register/[code]` | Parent registration form | Anyone with link |

### Navigation Tabs

**Mobile (Bottom Navigation):**
```
[תקציב] [אנשי קשר] [לוח שנה] [קטלוג מתנות] [הגדרות]
   💰        👥         📅         🎁          ⚙️
```

**Desktop (Top Navigation):**
```
Logo  כיתה א׳2  [תקציב] [אנשי קשר] [לוח שנה] [קטלוג מתנות] [הגדרות]
```

---

## Onboarding Flow

After sign-up, user goes through 3 steps:

### Step 1: Class Basics

**Fields:**
- שם הכיתה (Class name) - text input
- שם המוסד (Institution name) - text input
- יישוב (Settlement) - autocomplete with Israeli settlements
- מספר ילדים (Number of kids) - number input
- מספר אנשי צוות (Number of staff) - number input

### Step 2: Annual Collection Amount

**Header:** "כמה לאסוף לילד לשנה?"

**Fields:**
- Amount per child (₪) - number input

**Display:**
- Total expected budget: `₪{amount} × {kids} = ₪{total}`

### Step 3: Budget Allocation

**Sticky Header (Mobile):**
```
תקציב: ₪3,000  |  מוקצה: ₪1,050  |  נותר: ₪1,950
[████████████░░░░░░░░░░░░░░░░░░░░] 35%
```

**Event List (Chronological Order):**
1. ימי הולדת לילדים
2. ימי הולדת לצוות
3. חנוכה
4. פורים
5. פסח
6. סוף שנה
7. [+ אירוע מותאם אישית]

**Each Event Card:**
```
☑️ [Event Name]
┌─────────────────────────────────────────┐
│  ילדים:  ₪[___] × [30] = ₪____         │
│  צוות:   ₪[___] × [ 3] = ₪____         │
└─────────────────────────────────────────┘
```

- Kids count pre-populated from Step 1
- Staff count pre-populated from Step 1
- Either row can be ₪0 (for kids-only or staff-only events)

### Step 4: Done

- Save all data
- Redirect to `/dashboard`

---

## Dashboard Structure

### Layout

**Mobile:**
```
┌─────────────────────────────────────────┐
│ ≡  כיתה א׳2 - גן השקמים      [🔔] [👤] │
├─────────────────────────────────────────┤
│                                         │
│  [Setup Banner - dismissible]           │
│                                         │
│  ━━━━━━━ Tab Content ━━━━━━━            │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  [💰]  [👥]  [📅]  [🎁]  [⚙️]          │
└─────────────────────────────────────────┘
```

**Desktop:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Logo   כיתה א׳2   [תקציב] [אנשי קשר] [לוח שנה] [קטלוג] [הגדרות]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Setup Banner - dismissible]                                   │
│                                                                  │
│  Tab Content                                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tab: תקציב (Budget) - Default

**Setup Banner (Dismissible):**
```
┌─────────────────────────────────────────────────────────────┐
│  🚀 איסוף תשלומים                                  [סגור ❌] │
│  15/30 שילמו  [שלח קישור להורים] [הגדר קישור תשלום] [סמן]  │
└─────────────────────────────────────────────────────────────┘
```

**Main Content:**
1. **Metrics Row:**
   - Total budget (תקציב כולל)
   - Spent (הוצאות)
   - Remaining (יתרה)

2. **Pie Chart:**
   - Spent vs Remaining

3. **Distribution Chart:**
   - Kids allocation vs Staff allocation

4. **Timeline:**
   - Events on timeline
   - Shows allocated amount per event
   - Indicates paid/unpaid status

5. **Upcoming Events:**
   - Next 30 days
   - Event name, date, allocated amount

### Tab: אנשי קשר (Contacts)

**Sub-tabs:** [ילדים והורים] [צוות]

**Header Actions:**
- Search input
- [🔗 שתף קישור לצפייה] button

**Kids & Parents List:**
```
┌─────────────────────────────────────────────────────────────┐
│  יוסי כהן                                        [✏️] [🗑️] │
│  📅 15.03.2019                                              │
│  👨 שרה כהן  📞 050-1234567                                 │
│  👩 דוד כהן  📞 052-9876543                                 │
│  📍 רחוב הרצל 15, תל אביב                                   │
└─────────────────────────────────────────────────────────────┘
```

**Staff List:**
```
┌─────────────────────────────────────────────────────────────┐
│  רונית לוי                                       [✏️] [🗑️] │
│  👩‍🏫 גננת                                                    │
│  🎂 15 במרץ                                                  │
└─────────────────────────────────────────────────────────────┘
```

### Tab: לוח שנה (Calendar)

- Calendar view showing all events
- Event details on click/tap

### Tab: קטלוג מתנות (Gift Catalog)

- Placeholder for future feature
- "בקרוב" badge

### Tab: הגדרות (Settings)

**Sections:**
1. **פרטי הכיתה** - Edit class details
2. **מנהלים** - Add/remove admins
3. **קישור לתשלום** - Set Paybox link
4. **הגדרות ספר כתובות** - Directory visibility settings
5. **יציאה** - Logout

---

## Public Pages

### `/directory/[code]` - Public Contact Directory

- Uses `invite_code` from classes table
- No login required
- Read-only view

**Content:**
- Class name header
- Search bar
- Tabs: [ילדים והורים] [צוות]
- Contact cards (view-only)

### `/register/[code]` - Parent Registration

- Public form for parents to register their child
- After submission → redirect to Paybox link

**Form Fields:**
- שם הילד/ה (Child name)
- תאריך לידה (Date of birth)
- כתובת (Address)
- הורה 1: שם + טלפון
- הורה 2: שם + טלפון (optional)

**After Submit:**
- Save to database
- Show success message
- Button: "המשך לתשלום" → Opens Paybox link

### Parent Registration Message Templates

**For sharing via WhatsApp/Email:**
```
שלום הורים יקרים! 👋

אנא מלאו את הפרטים בקישור הבא:
https://classease.app/register/{code}

לאחר מילוי הפרטים תועברו לתשלום.
תודה! 🙏
```

**Actions:**
- [📋 העתק] - Copy message
- [📱 WhatsApp] - Open WhatsApp with pre-filled message
- [📧 Email] - Open email client with pre-filled message

---

## Build Phases

### Phase 1: Foundation
- [x] Create `archive/v1` branch
- [ ] Write database migration
- [ ] Create mobile-first layout shell
  - [ ] Bottom tabs component (mobile)
  - [ ] Top tabs component (desktop)
  - [ ] Responsive switching
- [ ] Verify RTL setup
- [ ] Verify dark mode with semantic tokens

### Phase 2: Onboarding
- [ ] Step 1: Class basics form
  - [ ] Settlement autocomplete component
- [ ] Step 2: Amount per child
- [ ] Step 3: Budget allocation
  - [ ] Event selection
  - [ ] Per-event kids/staff allocation
  - [ ] Sticky budget summary
- [ ] Save to database
- [ ] Redirect to dashboard

### Phase 3: Dashboard - Budget Tab
- [ ] Metrics cards (total, spent, remaining)
- [ ] Pie chart (spent vs remaining)
- [ ] Distribution chart (kids vs staff)
- [ ] Timeline (events with amounts)
- [ ] Upcoming events list

### Phase 4: Dashboard - Contacts Tab
- [ ] Kids/parents list
  - [ ] Show: name, DOB, parents, address
  - [ ] Edit/delete actions
- [ ] Staff list
  - [ ] Show: name, role, birthday (month/day)
  - [ ] Edit/delete actions
- [ ] Search functionality
- [ ] Share link button

### Phase 5: Setup Banner
- [ ] Payment tracking UI
- [ ] Parent registration link + message templates
- [ ] Paybox link setup
- [ ] Mark as paid functionality
- [ ] Dismissible banner

### Phase 6: Public Pages
- [ ] `/directory/[code]` - Public directory
- [ ] `/register/[code]` - Parent registration form
  - [ ] Form fields
  - [ ] Save to database
  - [ ] Redirect to Paybox

### Phase 7: Settings & Admin
- [ ] Class details editing
- [ ] Multi-admin management
- [ ] Directory visibility settings
- [ ] Logout

### Phase 8: Calendar & Catalog
- [ ] Calendar view
- [ ] Gift catalog placeholder

---

## V1 Archive

### Branch: `archive/v1`

The V1 code is preserved in the `archive/v1` branch on GitHub.

**To access V1 code:**

```bash
# View on GitHub
# Go to repo → Switch to archive/v1 branch

# Checkout locally
git checkout archive/v1

# Return to V2
git checkout main

# Copy specific file from V1
git checkout archive/v1 -- path/to/file.tsx

# Compare files
git diff main archive/v1 -- path/to/file.tsx
```

### Files Archived (V1-specific)
- `components/dashboard-content.tsx`
- `components/dashboard-with-setup.tsx`
- `components/budget-hub-card.tsx`
- `components/class-directory-card.tsx`
- `components/events-calendar-card.tsx`
- `components/class-navigation-bar.tsx`
- `components/setup-checklist.tsx`
- `components/class-onboarding-flow.tsx`
- `components/simplified-class-wizard.tsx`
- `components/setup-tasks/*`
- `app/dashboard/page.tsx` (old version)
- `app/create-class/page.tsx`
- `app/onboarding/page.tsx` (old version)

### Files Kept (Shared)
- `app/page.tsx` (landing page)
- `app/homepage-v2/page.tsx`
- `app/auth/*`
- `app/globals.css`
- `components/ui/*`
- `components/header.tsx`
- `components/footer.tsx`
- `components/login-form.tsx`
- `components/sign-up-form.tsx`
- `components/theme-*.tsx`
- `lib/*`
- `tailwind.config.ts`

---

## Israeli Settlements Data

For the settlement autocomplete, use a comprehensive list of Israeli cities and towns.
Store in: `lib/data/settlements.ts`

Example structure:
```typescript
export const israeliSettlements = [
  "תל אביב",
  "ירושלים",
  "חיפה",
  "באר שבע",
  "נתניה",
  // ... full list
];
```

---

## Notes

### Event Types (Default)

| Order | Hebrew | English |
|-------|--------|---------|
| 1 | ימי הולדת לילדים | Kids' birthdays |
| 2 | ימי הולדת לצוות | Staff birthdays |
| 3 | חנוכה | Hanukkah |
| 4 | פורים | Purim |
| 5 | פסח | Passover |
| 6 | סוף שנה | End of year |

### Staff Roles

| Hebrew | English |
|--------|---------|
| גננת | Kindergarten teacher |
| סייעת | Assistant |
| מורה | Teacher |

---

## Checklist Before Launch

- [ ] All pages work on mobile
- [ ] All pages work on desktop
- [ ] Dark mode works everywhere
- [ ] RTL is correct everywhere
- [ ] Hebrew text is correct
- [ ] Database migrations applied
- [ ] Auth flow works
- [ ] Public pages accessible without login
- [ ] Payment tracking works
- [ ] Admin management works
