# Class Onboarding Flow - Implementation Guide

## Overview
This document describes the complete onboarding flow for creating a new class in ClassEase (Vaad Horim management system).

## Flow Steps

### 1. Welcome Screen (`/create-class`)
**Route:** `/create-class`
**Component:** `ClassOnboardingFlow` (step 0)

- Welcomes the user
- Provides two options:
  - Start setup (proceeds to next step)
  - Watch tutorial video (optional)

### 2. Class Details (Step 1)
Collects basic information about the class:
- Class name (e.g., "גן חצב", "כיתה ב'")
- School/Kindergarten name
- City
- Academic year (defaults to current year)

**Validation:** All fields are required using Zod schema

### 3. Children & Parents (Step 2)
Two methods for adding children:

#### Option A: Excel Upload
- User uploads an Excel file with child and parent information
- Template includes: Child name, Parent 1 name/phone, Parent 2 name/phone (optional), Address
- Excel parsing using `xlsx` library
- Preview table with editable fields
- Download template button available

#### Option B: Manual Entry
- Add children one by one
- Each child can have 1-2 parents
- All fields are editable
- Can remove children

**Required fields:** Child name, Parent 1 name, Parent 1 phone

### 4. Staff Setup (Step 3)
Add teaching staff:
- Teacher/Gannenet
- Assistants
- Optional birthday field for each staff member
- Can add multiple staff members

### 5. Event Selection (Step 4)
Choose which events to track:
- 🎂 Birthdays (ימי הולדת)
- 🎉 Holidays (חגים)
- 🎁 End-of-year gifts (מתנות סוף שנה)
- 👥 Parent meetings (מפגשי הורים)
- 🚌 Trips (טיולים)

Each event has a default suggested budget.

### 6. Budget Setup (Step 5)
Two budget models:

#### Option A: Budget per Child
- Enter amount per child
- Total calculated automatically (amount × number of children)

#### Option B: Total Budget
- Enter fixed total budget amount

### 7. Budget Allocation (Step 6)
- Allocate budget to each selected event
- Shows:
  - Total budget
  - Allocated amount
  - Remaining budget (color-coded: green if positive, red if over-budget)
- Default allocations based on event templates

### 8. Review & Confirm (Step 7)
Summary screen showing:
- Class details
- Number of children
- Staff members
- Total budget and allocations

Two options:
- Launch class → proceeds to save
- Back to edit → return to previous step

### 9. Success & Invite (Step 8)
After successful creation:
- Congratulations message
- Unique invite link generated
- Copy link button
- Instructions to share with parents via WhatsApp
- Button to proceed to dashboard

## Technical Implementation

### Files Created
1. `/components/class-onboarding-flow.tsx` - Main multi-step form component
2. `/components/excel-template-download.tsx` - Excel template generator
3. `/app/create-class/page.tsx` - Route for the onboarding flow
4. `/DATABASE_SCHEMA.md` - Database schema documentation

### Dependencies Added
- `xlsx` - For Excel file parsing and generation

### Key Features
- **RTL Support**: Full Hebrew right-to-left support
- **Progress Indicator**: Visual step progress bar with icons
- **Validation**: Zod schema validation for form inputs
- **State Management**: React useState for multi-step form state
- **Responsive Design**: Mobile-friendly interface
- **Color Scheme**: Matches ClassEase brand colors (#FF4FA2, #4CD6CB, #DFFAF7, #FFE5F1)

### Form State Structure
```typescript
{
  classDetails: {
    className: string,
    schoolName: string,
    city: string,
    year: string
  },
  children: Child[],
  staff: Staff[],
  selectedEvents: string[],
  budgetType: "per-child" | "total",
  budgetAmount: number,
  budgetAllocations: BudgetAllocation[]
}
```

## Database Integration

### Required Tables (see DATABASE_SCHEMA.md)
1. `classes` - Class information
2. `children` - Child records
3. `parents` - Parent records
4. `child_parents` - Links children to parents
5. `staff` - Teaching staff
6. `events` - Class events and budgets
7. `class_members` - Class membership and roles

### Next Steps for Database Integration
1. Create tables in Supabase SQL editor using `DATABASE_SCHEMA.md`
2. Update `handleSubmit()` in `ClassOnboardingFlow` to save to Supabase
3. Implement invite code generation and validation
4. Add authentication checks
5. Set up Row Level Security (RLS) policies

## User Experience Flow

```
Landing Page (/)
  → Click "צור כיתה חדשה"
    → /create-class
      → 9-step wizard
        → Success
          → Dashboard
```

## Excel Template Format

### Required Columns (Hebrew)
- שם הילד (Child Name) - Required
- שם הורה 1 (Parent 1 Name) - Required
- טלפון הורה 1 (Parent 1 Phone) - Required
- שם הורה 2 (Parent 2 Name) - Optional
- טלפון הורה 2 (Parent 2 Phone) - Optional
- כתובת (Address) - Optional

### English Alternative Headers
The parser also accepts English column names:
- Child Name
- Parent 1 Name
- Parent 1 Phone
- Parent 2 Name
- Parent 2 Phone
- Address

## Mobile Responsiveness
- Progress bar adapts to screen size
- Event selection tiles use CSS Grid (2 columns)
- Forms are scrollable on mobile
- Touch-friendly button sizes
- RTL support maintained on all devices

## Accessibility Features
- Semantic HTML with proper labels
- Keyboard navigation support
- Clear error messages
- High contrast color scheme
- Screen reader friendly

## Future Enhancements
1. Add SMS verification during phone number input
2. Implement real-time budget calculation warnings
3. Add photo upload for children
4. Integration with payment systems (PayBox, etc.)
5. Automated WhatsApp invitation sending
6. Multi-language support (Hebrew/English/Arabic)
7. Export functionality (PDF summary)
8. Wizard state persistence (save and resume later)

## Testing Checklist
- [ ] All steps navigate correctly
- [ ] Form validation works properly
- [ ] Excel upload parses correctly
- [ ] Manual entry adds/removes children
- [ ] Budget calculations are accurate
- [ ] Invite link is generated
- [ ] Mobile responsive on all screens
- [ ] RTL text displays correctly
- [ ] Error handling for failed saves
- [ ] Loading states show appropriately

## Support & Documentation
For questions or issues with the onboarding flow, see:
- [Database Schema](DATABASE_SCHEMA.md)
- [Main README](README.md)
