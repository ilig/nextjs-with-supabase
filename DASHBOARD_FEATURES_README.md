# Dashboard Features - Setup Guide

## Overview
Three new dashboard features have been added:

1. **Payment Tracking** - Track which parents have paid, how much collected, and progress
2. **Events Calendar** - View upcoming events in both list and calendar mode
3. **Class Directory** - Searchable list of children, parents, and staff

## Database Migration Required

Before using these features, you need to run the database migration to add the payments table.

### Steps to Apply Migration:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `/supabase/migrations/20250125_add_payments_table.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute the migration

The migration will:
- Create a `payments` table to track parent payments
- Add Row Level Security (RLS) policies
- Create indexes for optimal performance
- Add an optional `expected_payment_per_parent` column to the `classes` table

### Alternative: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

This will automatically apply all pending migrations.

## Features Overview

### 1. Payment Tracking Card
**Location:** Left column of dashboard, after budget breakdown

**Features:**
- Shows number and percentage of parents who paid
- Displays total amount collected vs expected
- Visual progress bars with color coding (green/yellow/red)
- Status badge indicating payment health
- Quick stats: expected per parent, average paid, remaining to collect

**Data Required:**
- Parents must exist in the database
- Link the `expected_payment_per_parent` field in your class settings
- Add payment records using the Supabase dashboard or create a payment form

### 2. Events Calendar Card
**Location:** Left column of dashboard, after payment tracking

**Features:**
- Two view modes: List view and Calendar view
- List view shows upcoming events (next 60 days) with days countdown
- Calendar view displays a monthly calendar with event indicators
- Color-coded badges for urgent events (7 days or less)
- Shows event emoji icons, dates, and budget information
- Click events to view details (handler can be customized)

**Hebrew Support:**
- Month names in Hebrew
- Right-to-left layout
- Hebrew date formatting

### 3. Class Directory Card
**Location:** Left column of dashboard, after events calendar

**Features:**
- Three tabs: Children, Parents, Staff
- Real-time search/filter across all views
- **Children view:** Shows child name, address, and linked parents with phone numbers
- **Parents view:** Shows parent name, phone (clickable to call), and their children
- **Staff view:** Shows name, role badge (teacher/assistant), and birthday

**Interactive:**
- Click-to-call phone numbers
- Search bar filters results instantly
- Responsive card hover effects
- Count badges on tab buttons

## Customization

### Adjusting Expected Payment
To set the expected payment per parent:

1. Update your class record in Supabase:
```sql
UPDATE classes
SET expected_payment_per_parent = 500
WHERE id = 'your-class-id';
```

Or it will automatically use the `budget_amount` from your class settings.

### Adding Sample Payment Data

To test the payment tracking feature, add some sample payments:

```sql
-- Get your class ID and parent IDs first
SELECT id FROM classes LIMIT 1;
SELECT id, name FROM parents LIMIT 5;

-- Add sample payments
INSERT INTO payments (class_id, parent_id, amount, status)
VALUES
  ('your-class-id', 'parent-id-1', 500, 'completed'),
  ('your-class-id', 'parent-id-2', 500, 'completed'),
  ('your-class-id', 'parent-id-3', 250, 'completed');
```

## Component Architecture

All three components are modular and reusable:

- `/components/payment-tracking-card.tsx` - Payment tracking
- `/components/events-calendar-card.tsx` - Events calendar
- `/components/class-directory-card.tsx` - Class directory

They're integrated into `/components/dashboard-content.tsx` and receive props from `/app/dashboard/page.tsx`.

## Styling

All components follow the existing design system:
- Gradient backgrounds matching dashboard theme
- Color coding: Green (payments), Pink (events), Blue (directory)
- RTL (right-to-left) support for Hebrew
- Responsive grid layout
- Hover effects and transitions
- shadcn/ui components with Tailwind CSS

## Future Enhancements

Potential features to add:
- Payment form modal for adding new payments
- Export payment reports to Excel
- Email/SMS reminders for unpaid parents
- Event RSVP tracking
- Parent portal for self-service payment updates
- Payment method statistics and charts

## Troubleshooting

### Payments table doesn't exist
Run the database migration as described above.

### No parents showing in payment tracking
Make sure parents are linked to children through the `child_parents` table.

### Calendar not showing events
Check that your events have valid `event_date` values in the database.

### Type errors in TypeScript
Run `npm run dev` to restart the development server and pick up type changes.

## Support

For issues or questions, check the application logs or Supabase dashboard for error details.
