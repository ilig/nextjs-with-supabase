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
11. [Future Enhancements: Email Service](#future-enhancements-email-service)

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

The Budget Tab uses a **3-block clickable interface** where each block reveals detailed content when selected.

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: תקציב הכיתה                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Collection Banner (shown when collection < 100%)           │
│  💰 נאספו ₪4,500 מתוך ₪6,000 (75%)                          │
│  [████████████████████░░░░░░░]  15/20 שילמו                 │
│  [עדכון פרטי ילדכם ותשלום בקבוצת הפייבוקס]                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ תקציב כולל  │  │   הוצאות    │  │    יתרה     │
│   ₪6,000    │  │   ₪2,500    │  │   ₪3,500    │
│ (clickable) │  │ (clickable) │  │ (clickable) │
└─────────────┘  └─────────────┘  └─────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CONTENT AREA (changes based on selected block)             │
│                                                             │
│  DEFAULT (no selection): Pie charts                         │
│  BLOCK SELECTED: Block's detail view                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Timeline: אירועים שתוקצבו (always visible)                 │
│  [Clickable bars → quick edit modal]                        │
└─────────────────────────────────────────────────────────────┘
```

#### Default View (No Block Selected)

Shows two pie charts side by side:
1. **ניצול התקציב** - Budget utilization (spent vs remaining) with percentages
2. **התפלגות ההוצאות** - Expense distribution (kids vs staff) with percentages

**Returning to Default View:**
- Each block's detail view has a [✕ סגור] button in the header
- Clicking [✕ סגור] closes the detail view and returns to the pie charts
- Clicking the same block again (when already selected) also closes it

#### Block 1: תקציב כולל (Total Budget) - When Clicked

**Purpose:** Money IN - Budget setup, collection tracking, event allocation

```
┌─────────────────────────────────────────────────────────────┐
│  תקציב כולל                                        [✕ סגור]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SECTION 1: הגדרות תקציב                                    │
│  ─────────────────────────────────────────────────────────  │
│  💰 סה"כ תקציב: ₪6,000                          [✏️ עריכה] │
│  👶 סכום לילד: ₪300 × 20 ילדים                             │
│                                                             │
│  SECTION 2: מצב גבייה                                       │
│  ─────────────────────────────────────────────────────────  │
│  📊 התקדמות גבייה                                           │
│  [████████████░░░░░░░░░░░░░░░░░] 40%                        │
│  נאספו ₪2,400 מתוך ₪6,000                                   │
│                                                             │
│  👶 מצב רישום (מתוך 20 ילדים צפויים)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✅ שילמו (8)        │  ⚠️ נרשמו, לא שילמו (4)     │   │
│  │  יוסי כהן            │  דני לוי                     │   │
│  │  מיכל אברהם          │  רונית שמש                   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ❓ טרם נרשמו (8)                                   │   │
│  │  8 ילדים מתוך 20 עדיין לא מילאו את טופס ההרשמה      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [עדכון פרטי ילדכם ותשלום בקבוצת הפייבוקס]                  │
│  (לסימון תשלום בודד → עבור לדף קשר)                         │
│                                                             │
│  SECTION 3: הקצאת תקציב לאירועים                            │
│  ─────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💰 תקציב: ₪6,000 │ מוקצה: ₪1,770 │ נותר: ₪4,230    │   │ <- STICKY
│  │ [██████████░░░░░░░░░░░░░░░░░░░░░░] 30%              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ חנוכה      │ ילדים: ₪30×20  צוות: ₪50×3 │ ₪750  │   │
│  │ ☑ פורים      │ ילדים: ₪25×20  צוות: ₪40×3 │ ₪620  │   │
│  │ ☑ פסח        │ ילדים: ₪20×20  צוות: ₪0    │ ₪400  │   │
│  │ ☐ סוף שנה    │ לא מוקצה                    │ ₪0    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                    [+ הוסף] │
└─────────────────────────────────────────────────────────────┘
```

**Three states of children for collection tracking:**
1. ✅ **שילמו** - Registered AND paid (names known)
2. ⚠️ **נרשמו, לא שילמו** - Registered but NOT paid (names known)
3. ❓ **טרם נרשמו** - Not registered yet (count only, based on `estimated_children - registered_count`)

#### Block 2: הוצאות (Expenses) - When Clicked

**Purpose:** Money OUT - Expense tracking with receipts

```
┌─────────────────────────────────────────────────────────────┐
│  הוצאות                                            [✕ סגור]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  סה"כ הוצאות: ₪2,500                           [+ הוסף]    │
│                                                             │
│  🔍 סינון: [כל האירועים ▼]                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 15 ינואר 2026                                       │   │
│  │ קישוטים לחנוכה                              ₪350    │   │
│  │ 🏷️ חנוכה   📎 קבלה                    [👁️] [🗑️]   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 12 ינואר 2026                                       │   │
│  │ סופגניות                                    ₪200    │   │
│  │ 🏷️ חנוכה   📎 קבלה                    [👁️] [🗑️]   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 5 ינואר 2026                                        │   │
│  │ ציוד משרדי כללי                             ₪150    │   │
│  │ 🏷️ כללי    📎 קבלה                    [👁️] [🗑️]   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Add Expense Modal:**
- תיאור (description)
- סכום (amount)
- תאריך (date)
- אירוע (event - dropdown, optional, can be "כללי")
- קבלה (receipt upload - drag & drop, supports images and PDFs)

**Expense-Event Relationship:**
- Expense CAN exist without an event (general supplies)
- Event CAN have multiple expenses (e.g., venue + supplies + food for one holiday)
- When marking event as "שולם" → auto-creates expense with amount prompt

#### Block 3: יתרה (Remaining) - When Clicked

**Purpose:** Health check - Balance overview and allocation status

```
┌─────────────────────────────────────────────────────────────┐
│  יתרה                                              [✕ סגור]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  💵 יתרה בפועל: ₪2,000                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  נאספו        ₪4,500                                │   │
│  │  - הוצאות     ₪2,500                                │   │
│  │  ─────────────────────                              │   │
│  │  = יתרה       ₪2,000  ✓                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📊 מצב הקצאות                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  תקציב כולל               ₪6,000                    │   │
│  │  הוקצה לאירועים           ₪1,770  (30%)             │   │
│  │  [██████░░░░░░░░░░░░░░░░░░░░░░░░░░]                  │   │
│  │  טרם הוקצה                ₪4,230  (70%)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ שים לב: עדיין לא נאסף מלוא התקציב (₪1,500 חסרים)       │
│                                                             │
│  📅 אירועים שהוקצאו וטרם שולמו                              │
│  • חנוכה - ₪750 מוקצה                                       │
│  • פורים - ₪620 מוקצה                                       │
└─────────────────────────────────────────────────────────────┘
```

#### Timeline: אירועים שתוקצבו (Always Visible)

Horizontal bar chart showing budgeted events from today onwards:
- Bar width proportional to allocated budget
- Event name inside bar
- Allocated amount above bar
- Date label
- Payment status badge (שולם ✓ / לא שולם ⚠️)
- **Clickable** - opens quick edit modal

**Timeline Quick Edit Modal (on bar click):**
```
┌─────────────────────────────────────────────────────────────┐
│  חנוכה                                             [✕]     │
├─────────────────────────────────────────────────────────────┤
│  📅 25 דצמבר 2025                                           │
│  💰 תקציב מוקצה: ₪750                                       │
│  📊 הוצאות עד כה: ₪550                                      │
│                                                             │
│  [סמן כשולם]   [ערוך הקצאה]   [צפה בהוצאות]                │
└─────────────────────────────────────────────────────────────┘
```

**"סמן כשולם" Flow:**
- Opens amount prompt with allocated budget as default
- Optional receipt upload
- On confirm: marks event as paid + creates expense record

### Tab: אנשי קשר (Contacts)

**Sub-tabs:** [ילדים והורים] [צוות]

**Header Actions:**
- Search input
- [🔗 שתף קישור לצפייה] button
- [עדכון פרטי ילדכם ותשלום בקבוצת הפייבוקס] button (same as Budget tab)

**Kids & Parents List:**
```
┌─────────────────────────────────────────────────────────────┐
│  יוסי כהן                              [שילם ✓]  [✏️] [🗑️] │
│  📅 15.03.2019                                              │
│  👨 שרה כהן  📞 050-1234567                                 │
│  👩 דוד כהן  📞 052-9876543                                 │
│  📍 רחוב הרצל 15, תל אביב                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  דני לוי                             [לא שילם ✗] [✏️] [🗑️] │
│  📅 22.07.2019                                              │
│  👨 רונית לוי  📞 054-7891234                               │
│  📍 רחוב בן גוריון 8, חיפה                                  │
│                                              [סמן כשילם]    │
└─────────────────────────────────────────────────────────────┘
```

**Payment Status in Contacts:**
- Each child card shows payment badge (שילם ✓ / לא שילם ✗)
- Unpaid children have a [סמן כשילם] button
- Clicking [סמן כשילם] marks child as paid and updates payment_date

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

### Parent Registration & Payment Message

**Single message template for registration + payment (used for both initial share and reminders):**

**Button Label:** "עדכון פרטי ילדכם ותשלום בקבוצת הפייבוקס"

**Message Content:**
```
שלום הורים יקרים! 👋

אנא עדכנו את פרטי ילדכם בקישור הבא:
https://classease.app/register/{code}

לאחר מילוי הפרטים תועברו לתשלום בקבוצת הפייבוקס.
תודה! 🙏
```

**Reminder Message (same link, slightly different wording):**
```
תזכורת להורים שטרם עדכנו 👋

אנא עדכנו את פרטי ילדכם בקישור הבא:
https://classease.app/register/{code}

לאחר מילוי הפרטים תועברו לתשלום בקבוצת הפייבוקס.
תודה! 🙏
```

**Actions:**
- [📋 העתק] - Copy message
- [📱 WhatsApp] - Open WhatsApp with pre-filled message
- [📧 Email] - Open email client with pre-filled message

**Note:** Only one reminder type - sent to the entire WhatsApp group. No individual reminders.

---

## Build Phases

### Phase 1: Foundation
- [x] Create `archive/v1` branch
- [x] Write database migration (`20260109_v2_schema_updates.sql`, `20260115_admin_invitations.sql`)
- [x] Create mobile-first layout shell
  - [x] Bottom tabs component (mobile) - `mobile-bottom-nav.tsx`
  - [x] Top tabs component (desktop) - `desktop-top-nav.tsx`
  - [x] Responsive switching - `dashboard-layout.tsx`
- [x] Verify RTL setup
- [x] Verify dark mode with semantic tokens

### Phase 2: Onboarding
- [x] Step 1: Class basics form - `step-class-basics.tsx`
  - [x] Settlement autocomplete component - `lib/data/settlements.ts`
- [x] Step 2: Amount per child - `step-annual-amount.tsx`
- [x] Step 3: Budget allocation - `step-budget-allocation.tsx`
  - [x] Event selection
  - [x] Per-event kids/staff allocation
  - [x] Sticky budget summary
- [x] Save to database
- [x] Redirect to dashboard

### Phase 3: Dashboard - Budget Tab
- [x] Metrics cards (total, spent, remaining) - `budget-tab.tsx`
- [x] Pie chart (spent vs remaining)
- [x] Distribution chart (kids vs staff)
- [x] Timeline (events with amounts)
- [x] Upcoming events list

### Phase 4: Dashboard - Contacts Tab
- [x] Kids/parents list - `contacts-tab.tsx`
  - [x] Show: name, DOB, parents, address
  - [x] Edit/delete actions
- [x] Staff list
  - [x] Show: name, role, birthday (month/day)
  - [x] Edit/delete actions
- [x] Search functionality
- [x] Share link button

### Phase 5: Setup Banner
- [x] Payment tracking UI - `setup-banners.tsx`, `payment-management-sheet.tsx`
- [x] Parent registration link + message templates
- [x] Paybox link setup
- [x] Mark as paid functionality
- [x] Dismissible banner

### Phase 6: Public Pages
- [x] `/directory/[code]` - Public directory - `public-directory-client.tsx`
- [x] `/register/[code]` - Parent registration form (implemented as `/join/[code]` → `/parent-form/[token]`)
  - [x] Form fields (child name, DOB, address, parent1, parent2)
  - [x] Save to database
  - [x] Redirect to Paybox (after submission)

### Phase 7: Settings & Admin
- [x] Class details editing - `edit-class-modal.tsx`
- [x] Multi-admin management - `admin-management-modal.tsx`
- [x] Directory visibility settings - `directory-settings-modal.tsx`
- [x] Logout

### Phase 8: Calendar & Catalog
- [x] Calendar view - `calendar-tab.tsx`, `hebrew-calendar.tsx`
- [x] Gift catalog placeholder - `gifts-tab.tsx`

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

## Future Enhancements: Email Service

### Overview

The application currently does not send emails. Admin invitations, payment reminders, and other notifications rely on WhatsApp sharing and manual link copying. Adding an email service would enable:

1. **Admin Invitations** - Send email when inviting a new admin to manage the class
2. **Payment Reminders** - Send personalized reminders to parents who haven't paid
3. **Event Notifications** - Notify parents about upcoming events
4. **Registration Confirmations** - Confirm when a parent registers their child

### Recommended Service: Resend

**Why Resend:**
- Simple API, great developer experience
- Free tier: 100 emails/day, 3,000 emails/month
- Easy Next.js integration
- Built-in React Email support for Hebrew templates

**Website:** https://resend.com

### Implementation Plan

#### 1. Setup

```bash
npm install resend
```

Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

#### 2. API Route Structure

Create: `app/api/email/route.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { type, to, data } = await request.json();

  // Handle different email types
  switch (type) {
    case 'admin-invitation':
      // Send admin invitation email
      break;
    case 'payment-reminder':
      // Send payment reminder
      break;
  }
}
```

#### 3. Email Templates (Hebrew RTL)

Create: `emails/admin-invitation.tsx`

```tsx
export function AdminInvitationEmail({
  className,
  inviteLink
}: {
  className: string;
  inviteLink: string;
}) {
  return (
    <div dir="rtl" style={{ fontFamily: 'Arial, sans-serif' }}>
      <h1>הזמנה לניהול כיתה</h1>
      <p>הוזמנת להצטרף כמנהל/ת בכיתה "{className}"</p>
      <a href={inviteLink}>לחץ כאן להצטרפות</a>
    </div>
  );
}
```

#### 4. Integration Points

| Feature | File | Function |
|---------|------|----------|
| Admin Invitations | `settings-tab.tsx` | `handleAddAdmin()` |
| Payment Reminders | `payment-management-sheet.tsx` | `handleSendReminder()` |
| Registration Confirmation | `app/register/[code]/page.tsx` | Form submit handler |

#### 5. Database Changes

Add to `admin_invitations` table:
```sql
ALTER TABLE admin_invitations ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;
```

### Alternative: No Email Service

The current implementation works without email by:
- Using WhatsApp for sharing invites
- Providing copy-to-clipboard functionality
- Relying on manual communication in parent groups

This is acceptable for MVP as most Israeli parents communicate via WhatsApp groups.

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
