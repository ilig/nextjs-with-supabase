# ClassEase Style Guide

> Design system and UI standards for ClassEase.
> Reference this document when creating or modifying any UI components.
> Last updated: January 2026

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Border Radius](#border-radius)
6. [Shadows](#shadows)
7. [Icons](#icons)
8. [Buttons](#buttons)
9. [Form Elements](#form-elements)
10. [Cards & Containers](#cards--containers)
11. [Interaction Patterns](#interaction-patterns)
12. [Loading States](#loading-states)
13. [Empty States](#empty-states)
14. [Error Handling](#error-handling)
15. [Animations](#animations)
16. [RTL Guidelines](#rtl-guidelines)
17. [Responsive Design](#responsive-design)
18. [Accessibility](#accessibility)

---

## Design Principles

### Visual Identity
- **Soft & Friendly**: Rounded corners, soft shadows, approachable feel
- **Clean & Focused**: Minimal visual clutter, clear hierarchy
- **Consistent**: Same patterns everywhere, no exceptions

### Core Rules
1. **No hardcoded colors** - Always use semantic tokens
2. **No emojis in UI** - Use Lucide icons only
3. **No modals for editing** - Use expandable blocks
4. **Mobile-first** - Design for mobile, enhance for desktop
5. **RTL-native** - Hebrew is the primary language

---

## Color System

### Primary Palette (5 Colors Only)

| Token | Usage | Light Mode | Dark Mode |
|-------|-------|------------|-----------|
| `brand` | Primary actions, highlights, active states | Purple `hsl(263, 70%, 76%)` | Purple (adjusted) |
| `success` | Positive states, confirmations | Green `hsl(142, 76%, 36%)` | Green (adjusted) |
| `warning` | Attention needed, pending states | Amber `hsl(45, 93%, 47%)` | Amber (adjusted) |
| `destructive` | Errors, delete actions | Red `hsl(0, 84%, 60%)` | Red (adjusted) |
| `muted` | Disabled states, secondary text | Gray `hsl(0, 0%, 45%)` | Gray (adjusted) |

### Background & Surface

| Token | Usage |
|-------|-------|
| `background` | Page background |
| `surface` | Slightly elevated background |
| `card` | Card backgrounds |
| `foreground` | Primary text |
| `muted-foreground` | Secondary text |
| `border` | Borders and dividers |

### Usage Rules

```tsx
// CORRECT - Use semantic tokens
<div className="bg-card text-foreground border-border" />
<button className="bg-brand text-brand-foreground" />
<span className="text-destructive" />

// WRONG - Never use hardcoded colors
<div className="bg-white text-gray-600" />
<div className="bg-blue-500/10" />
<div className="bg-amber-500/15" />
```

### Status Colors in Context

```tsx
// Payment status
<Badge className="bg-success/10 text-success">שילם</Badge>
<Badge className="bg-warning/10 text-warning">ממתין</Badge>
<Badge className="bg-destructive/10 text-destructive">לא שילם</Badge>

// Background highlights
<div className="bg-brand-muted" />      // Light purple background
<div className="bg-success-muted" />    // Light green background
<div className="bg-warning-muted" />    // Light amber background
```

---

## Typography

### Font
- **Family**: Geist Sans (loaded via Google Fonts)
- **Fallback**: system-ui, sans-serif

### Scale (4 Levels Only)

| Level | Class | Size | Weight | Usage |
|-------|-------|------|--------|-------|
| Display | `text-2xl font-bold` | 24px | 700 | Page titles only |
| Title | `text-lg font-semibold` | 18px | 600 | Card headers, section titles |
| Body | `text-sm` | 14px | 400 | All body text, labels, descriptions |
| Caption | `text-xs text-muted-foreground` | 12px | 400 | Metadata, timestamps, badges |

### Usage Examples

```tsx
// Page title
<h1 className="text-2xl font-bold">תקציב הכיתה</h1>

// Card/section header
<h2 className="text-lg font-semibold">הגדרות תקציב</h2>

// Body text and labels
<p className="text-sm">סכום לילד לשנה</p>
<Label className="text-sm font-medium">שם הכיתה</Label>

// Metadata
<span className="text-xs text-muted-foreground">עודכן לפני 3 דקות</span>
```

### Rules
- **Never use** `text-base`, `text-xl`, `text-3xl` - stick to the 4-level scale
- **Never use** `font-black` or `font-light`
- **Always use** `text-muted-foreground` for secondary text, not gray classes

---

## Spacing

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `gap-2` / `space-y-2` | 8px | Tight spacing (within components) |
| `gap-3` / `space-y-3` | 12px | Default spacing (between related items) |
| `gap-4` / `space-y-4` | 16px | Section spacing (between groups) |
| `p-4` | 16px | Default padding for cards/containers |
| `p-6` | 24px | Generous padding (desktop only) |

### Consistent Patterns

```tsx
// Card internal spacing
<Card className="p-4 space-y-3">
  <CardHeader />
  <CardContent />
</Card>

// List items
<div className="space-y-2">
  {items.map(item => <Item key={item.id} />)}
</div>

// Form fields
<div className="space-y-4">
  <FormField />
  <FormField />
</div>
```

---

## Border Radius

### Scale

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-xl` | 12px | **PRIMARY** - Buttons, inputs, small cards |
| `rounded-2xl` | 16px | Large cards, main containers |
| `rounded-full` | 50% | Badges, avatars, circular elements |

### Rules
- **Never use** `rounded-sm`, `rounded-md`, `rounded-lg` - they create inconsistency
- All interactive elements use `rounded-xl`
- All containers use `rounded-2xl`

```tsx
// CORRECT
<Button className="rounded-xl" />
<Input className="rounded-xl" />
<Card className="rounded-2xl" />
<Badge className="rounded-full" />

// WRONG - Don't mix radius values
<Button className="rounded-md" />
<Input className="rounded-lg" />
```

---

## Shadows

### Scale

| Token | Usage |
|-------|-------|
| `shadow-sm` | Subtle elevation (inputs, small elements) |
| `shadow` | Default cards |
| `shadow-md` | Elevated cards, dropdowns |

### Rules
- Cards use `shadow` by default
- Active/expanded blocks use `shadow-md`
- Never use `shadow-lg` or `shadow-xl`

---

## Icons

### Library
**Lucide React** - Outline style only

### Size Standards

| Size | Class | Usage |
|------|-------|-------|
| Standard | `h-4 w-4` | All icons (buttons, lists, inline) |
| Emphasis | `h-5 w-5` | Page headers, empty states only |

### Rules
1. **No emojis** - Ever. Use Lucide icons only.
2. **One size fits most** - Use `h-4 w-4` everywhere except page headers
3. **Inherit color** - Icons should inherit text color OR use semantic color for status
4. **Always include** `flex-shrink-0` to prevent squishing

### Usage Examples

```tsx
import { Wallet, Check, AlertCircle, Trash2 } from "lucide-react"

// Standard usage
<Wallet className="h-4 w-4 flex-shrink-0" />

// With semantic color
<Check className="h-4 w-4 text-success flex-shrink-0" />
<AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
<Trash2 className="h-4 w-4 text-destructive flex-shrink-0" />

// Page header (larger)
<h1 className="flex items-center gap-2">
  <Wallet className="h-5 w-5 flex-shrink-0" />
  <span>תקציב</span>
</h1>
```

### Icon Mapping

| Context | Icon |
|---------|------|
| Budget/Money | `Wallet` |
| Contacts/People | `Users` |
| Calendar/Events | `Calendar` |
| Gifts | `Gift` |
| Settings | `Settings` |
| Add/Create | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Close | `X` |
| Confirm/Success | `Check` |
| Warning | `AlertCircle` |
| Error | `XCircle` |
| Expand/Collapse | `ChevronDown` |
| Loading | `Loader2` (with `animate-spin`) |

---

## Buttons

### Variants

| Variant | Usage | Style |
|---------|-------|-------|
| `brand` | Primary actions | `bg-brand text-brand-foreground` |
| `outline` | Secondary actions | `border border-input bg-background` |
| `ghost` | Tertiary/icon buttons | `hover:bg-accent` |
| `destructive` | Delete actions (in confirmation state) | `bg-destructive text-destructive-foreground` |

### Sizes

| Size | Class | Usage |
|------|-------|-------|
| Default | `h-9` | Most buttons |
| Small | `h-8` | Compact contexts, table actions |
| Icon | `h-9 w-9` | Icon-only buttons |

### Standard Button Styling

```tsx
// Primary action
<Button className="bg-brand hover:bg-brand/90 rounded-xl h-9">
  שמור
</Button>

// Secondary action
<Button variant="outline" className="rounded-xl h-9">
  ביטול
</Button>

// Icon button
<Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
  <Pencil className="h-4 w-4" />
</Button>

// Small button
<Button variant="outline" className="rounded-xl h-8 text-sm">
  עריכה
</Button>
```

### Button with Icon

```tsx
<Button className="bg-brand hover:bg-brand/90 rounded-xl gap-2">
  <Plus className="h-4 w-4" />
  הוסף
</Button>
```

---

## Form Elements

### Input Fields

```tsx
<Input
  className="h-10 rounded-xl border-input"
  placeholder="הזן ערך..."
/>
```

### Labels

```tsx
<Label className="text-sm font-medium">
  שם הכיתה
</Label>

// With required indicator
<Label className="text-sm font-medium">
  שם הכיתה <span className="text-destructive">*</span>
</Label>
```

### Form Field Pattern

```tsx
<div className="space-y-2">
  <Label htmlFor="className" className="text-sm font-medium">
    שם הכיתה
  </Label>
  <Input
    id="className"
    className="h-10 rounded-xl"
    placeholder="לדוגמה: כיתה א׳2"
  />
</div>
```

### Select

```tsx
<Select>
  <SelectTrigger className="h-10 rounded-xl flex-row-reverse">
    <SelectValue placeholder="בחר..." />
  </SelectTrigger>
  <SelectContent dir="rtl">
    <SelectItem value="option1">אפשרות 1</SelectItem>
    <SelectItem value="option2">אפשרות 2</SelectItem>
  </SelectContent>
</Select>
```

---

## Cards & Containers

### Standard Card

```tsx
<div className="bg-card rounded-2xl border-2 border-border p-4 shadow">
  {/* Card content */}
</div>
```

### Expandable Block (Primary Pattern)

```tsx
<div className={cn(
  "bg-card rounded-2xl border-2 shadow transition-all overflow-hidden",
  isExpanded ? "border-brand" : "border-border hover:border-brand/50"
)}>
  {/* Clickable header - always visible */}
  <button
    onClick={() => setIsExpanded(!isExpanded)}
    className="w-full p-4 flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-brand" />
      <span className="text-lg font-semibold">כותרת</span>
    </div>
    <ChevronDown className={cn(
      "h-4 w-4 transition-transform",
      isExpanded && "rotate-180"
    )} />
  </button>

  {/* Expanded content */}
  {isExpanded && (
    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
      {/* Content here */}
    </div>
  )}
</div>
```

---

## Interaction Patterns

### Primary Rule: No Modals for Editing

All editing, viewing details, and form interactions use **expandable blocks** that expand in-place.

### When to Use What

| Action | Pattern |
|--------|---------|
| View/Edit details | Expandable block |
| Add new item | Expandable block at top of list |
| Delete item | Inline confirmation |
| System messages | Toast notifications |

### Inline Delete Confirmation

When user clicks delete:
1. Button transforms to red "אישור מחיקה"
2. User must click again within 3-5 seconds to confirm
3. If no second click, reverts to original state

```tsx
const [confirmingDelete, setConfirmingDelete] = useState(false)

// Reset after timeout
useEffect(() => {
  if (confirmingDelete) {
    const timer = setTimeout(() => setConfirmingDelete(false), 4000)
    return () => clearTimeout(timer)
  }
}, [confirmingDelete])

<Button
  variant={confirmingDelete ? "destructive" : "ghost"}
  size="icon"
  className="rounded-xl"
  onClick={() => {
    if (confirmingDelete) {
      handleDelete()
    } else {
      setConfirmingDelete(true)
    }
  }}
>
  {confirmingDelete ? (
    <span className="text-xs px-2">אישור</span>
  ) : (
    <Trash2 className="h-4 w-4" />
  )}
</Button>
```

---

## Loading States

### Skeleton Loaders

Use skeleton loaders for initial page loads and data fetching. Show the layout structure while loading.

```tsx
// Skeleton card
<div className="bg-card rounded-2xl border-2 border-border p-4 space-y-3 animate-pulse">
  <div className="h-5 bg-muted rounded-xl w-1/3" />
  <div className="h-4 bg-muted rounded-xl w-2/3" />
  <div className="h-4 bg-muted rounded-xl w-1/2" />
</div>

// Skeleton list item
<div className="flex items-center gap-3 p-3 animate-pulse">
  <div className="h-10 w-10 bg-muted rounded-full" />
  <div className="flex-1 space-y-2">
    <div className="h-4 bg-muted rounded-xl w-1/4" />
    <div className="h-3 bg-muted rounded-xl w-1/3" />
  </div>
</div>
```

### Button Loading

```tsx
<Button disabled className="bg-brand rounded-xl">
  <Loader2 className="h-4 w-4 animate-spin" />
  <span className="mr-2">שומר...</span>
</Button>
```

---

## Empty States

### Tone: Friendly & Encouraging

Empty states should guide the user to take action, not just state that something is empty.

### Pattern

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="bg-brand-muted rounded-full p-4 mb-4">
    <Calendar className="h-5 w-5 text-brand" />
  </div>
  <h3 className="text-lg font-semibold mb-2">
    אין אירועים עדיין
  </h3>
  <p className="text-sm text-muted-foreground mb-4">
    הוסיפו את האירוע הראשון שלכם כדי להתחיל לנהל את התקציב
  </p>
  <Button className="bg-brand hover:bg-brand/90 rounded-xl gap-2">
    <Plus className="h-4 w-4" />
    הוסף אירוע
  </Button>
</div>
```

### Empty State Messages

| Context | Message |
|---------|---------|
| No events | אין אירועים עדיין - הוסיפו את האירוע הראשון! |
| No contacts | אין אנשי קשר - שתפו את קישור ההרשמה עם ההורים |
| No expenses | אין הוצאות - הוסיפו הוצאה כשתרכשו משהו |
| No search results | לא נמצאו תוצאות - נסו חיפוש אחר |

---

## Error Handling

### Form Validation (Inline)

```tsx
<div className="space-y-2">
  <Label className="text-sm font-medium">סכום</Label>
  <Input
    className={cn(
      "h-10 rounded-xl",
      error && "border-destructive focus-visible:ring-destructive"
    )}
  />
  {error && (
    <p className="text-xs text-destructive flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {error}
    </p>
  )}
</div>
```

### System Errors (Toast)

Use toast notifications for API errors, network issues, and system messages.

```tsx
import { toast } from "sonner"

// Error
toast.error("שגיאה בשמירת הנתונים", {
  description: "אנא נסו שנית מאוחר יותר"
})

// Success
toast.success("הנתונים נשמרו בהצלחה")

// Warning
toast.warning("שימו לב", {
  description: "חלק מהנתונים לא נשמרו"
})
```

---

## Animations

### Duration: 250-300ms (Smooth & Calm)

### Transitions

```tsx
// Standard transition
className="transition-all duration-300"

// Color transitions only
className="transition-colors duration-200"

// Transform transitions
className="transition-transform duration-300"
```

### Expand/Collapse

```tsx
// Chevron rotation
<ChevronDown className={cn(
  "h-4 w-4 transition-transform duration-300",
  isExpanded && "rotate-180"
)} />

// Content reveal
{isExpanded && (
  <div className="animate-in slide-in-from-top-2 duration-300">
    {/* Content */}
  </div>
)}
```

### Hover States

```tsx
// Card hover
className="hover:border-brand/50 transition-colors duration-200"

// Button hover
className="hover:bg-brand/90 transition-colors duration-200"
```

---

## RTL Guidelines

### Current Approach (Preserve Existing Work)

RTL is implemented at the page/component level, not at the root. This approach works and should be maintained.

### Checklist for New Components

1. **Add `dir="rtl"`** to the main container or parent element
2. **Use `text-right`** for text alignment where needed
3. **Use `flex-row-reverse`** for horizontal layouts with icons/text
4. **Use `SelectContent dir="rtl"`** for dropdowns
5. **Position close buttons** on the left (start in RTL)

### Common Patterns

```tsx
// Page container
<main dir="rtl" className="min-h-screen bg-surface">

// Flex with icon
<div className="flex items-center gap-2 flex-row-reverse">
  <Icon className="h-4 w-4" />
  <span>טקסט</span>
</div>

// Select trigger
<SelectTrigger className="flex-row-reverse">
  <SelectValue />
</SelectTrigger>
<SelectContent dir="rtl">
  {/* Options */}
</SelectContent>

// Dialog header
<DialogHeader>
  <DialogTitle className="text-right">כותרת</DialogTitle>
</DialogHeader>
```

### Don't Change

- Existing RTL implementations that work
- Page-level `dir="rtl"` patterns
- Component-specific alignment classes

---

## Responsive Design

### Approach: Mobile-First, Centered Desktop

### Desktop Layout

- **Max width**: `max-w-xl` (576px)
- **Centered**: `mx-auto`
- **Maintains mobile proportions** on larger screens

```tsx
<main className="min-h-screen bg-surface">
  <div className="max-w-xl mx-auto px-4 py-6">
    {/* Content */}
  </div>
</main>
```

### Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | < 640px | Mobile layout |
| `sm:` | 640px+ | Rarely used |
| `md:` | 768px+ | Desktop navigation switch |

### Navigation

- **Mobile (< 768px)**: Bottom navigation bar
- **Desktop (768px+)**: Top navigation bar

```tsx
// Mobile bottom nav
<nav className="fixed bottom-0 left-0 right-0 md:hidden">

// Desktop top nav
<nav className="hidden md:flex fixed top-0 left-0 right-0">
```

### Touch Targets

Minimum touch target size: **44px**

```tsx
<Button className="min-h-[44px] min-w-[44px]">
```

---

## Accessibility

### Focus States

All interactive elements must have visible focus states.

```tsx
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
```

### ARIA Labels

Icon-only buttons must have labels:

```tsx
<Button variant="ghost" size="icon" aria-label="מחק">
  <Trash2 className="h-4 w-4" />
</Button>
```

### Color Contrast

- Text on `brand` background: Use `brand-foreground` (white)
- Text on `card` background: Use `foreground` or `muted-foreground`
- Never use low-contrast combinations

### Screen Reader Text

```tsx
<span className="sr-only">תיאור למסך קורא</span>
```

---

## Quick Reference

### Component Checklist

When creating or modifying a component:

- [ ] Uses semantic color tokens (no hardcoded colors)
- [ ] Uses correct typography scale (Display/Title/Body/Caption)
- [ ] Uses `rounded-xl` for interactive elements, `rounded-2xl` for containers
- [ ] Icons are `h-4 w-4` with `flex-shrink-0`
- [ ] Buttons use correct variant and size
- [ ] Includes proper RTL attributes
- [ ] Has loading state (skeleton)
- [ ] Has empty state (friendly message + action)
- [ ] Has error handling (inline for forms, toast for system)
- [ ] Animations are 250-300ms
- [ ] Touch targets are minimum 44px
- [ ] Focus states are visible
- [ ] ARIA labels on icon buttons

### Import Shortcuts

```tsx
// Colors - use Tailwind classes, not imports
// bg-brand, text-success, border-destructive, etc.

// Icons
import {
  Wallet, Users, Calendar, Gift, Settings,
  Plus, Pencil, Trash2, X, Check,
  AlertCircle, XCircle, ChevronDown, Loader2
} from "lucide-react"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

// Utilities
import { cn } from "@/lib/utils"
import { toast } from "sonner"
```

---

## Version History

| Date | Changes |
|------|---------|
| Jan 2026 | Initial style guide created |
