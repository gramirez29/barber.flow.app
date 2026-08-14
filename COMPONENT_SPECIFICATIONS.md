# 🛠️ COMPONENT SPECIFICATIONS
## Detailed Implementation Guides for Missing UI Components

**Version**: 1.0  
**Date**: 2026-06-23  
**Status**: Ready for Development

---

## 1️⃣ HERO CARD COMPONENT

### Purpose
Reusable container for displaying hero sections with consistent styling across multiple pages.

### Usage Locations
- LoginPage (mobile-style hero)
- SettingsPage (workspace info)
- NotificationsPage (stats header)
- CalendarPage (date summary)

### TypeScript Interface
```typescript
interface HeroCardProps {
  // Required
  title: string;
  
  // Optional
  eyebrow?: string;
  subtitle?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  children?: React.ReactNode;
  
  // Actions
  actions?: React.ReactNode;
  
  // Styling
  maxHeight?: string | number;
  minHeight?: string | number;
}
```

### Visual Specification
```
┌────────────────────────────────┐
│ [Optional Background Image]    │
│ ├─ Overlay (20% opacity dark)  │
│ │                               │
│ │ EYEBROW (11px, Accent, UC)   │
│ │ Title (26px, Bold, Primary)  │
│ │ Subtitle (14px, Secondary)   │
│ │                               │
│ │ [Optional Children/Actions]  │
└────────────────────────────────┘
```

### CSS Classes
```typescript
// Material-UI theming
sx={{
  background: backgroundImage 
    ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${backgroundImage})`
    : backgroundColor,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  color: theme.palette.text.primary,
  minHeight: minHeight || 'auto',
  maxHeight: maxHeight || 'auto',
}}
```

### Example Usage
```typescript
<HeroCard
  eyebrow="Daily Report"
  title="June 23, 2026"
  subtitle="3 appointments scheduled"
  backgroundColor={theme.palette.background.paper}
>
  <Stack direction="row" spacing={2}>
    <MetricPill value="3" label="Appointments" />
    <MetricPill value="¢15,000" label="Revenue" />
  </Stack>
</HeroCard>
```

---

## 2️⃣ METRIC PILL COMPONENT

### Purpose
Display key metrics with large values and labels in a compact, reusable format.

### Usage Locations
- Settings page (metrics display)
- Notifications page (stats)
- Calendar page (summary info)
- Any dashboard card

### TypeScript Interface
```typescript
interface MetricPillProps {
  // Required
  value: string | number;
  label: string;
  
  // Optional
  color?: string; // defaults to primary
  backgroundColor?: string;
  icon?: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
}
```

### Visual Specification
```
┌──────────────────────┐
│                      │
│   [Icon]             │
│   Large Value        │
│   (22px Bold)        │
│                      │
│   UPPERCASE LABEL    │
│   (12px)             │
│                      │
└──────────────────────┘
Padding: 14px
Border Radius: 14px
Background: surfaceElevated
```

### CSS Classes
```typescript
sx={{
  backgroundColor: backgroundColor || theme.palette.background.default,
  borderRadius: '14px',
  padding: theme.spacing(2),
  textAlign: 'center',
  minWidth: size === 'small' ? '100px' : size === 'large' ? '160px' : '120px',
  border: `1px solid ${theme.palette.divider}`,
}}
```

### Example Usage
```typescript
<MetricPill
  value="15"
  label="Appointments"
  icon={<EventNoteIcon />}
  color={theme.palette.info.main}
/>

<MetricPill
  value="¢125,000"
  label="Total Revenue"
  icon={<TrendingUpIcon />}
  color={theme.palette.success.main}
/>
```

---

## 3️⃣ FEATURE PILL COMPONENT

### Purpose
Highlight key features/capabilities with icon badges, used primarily on login hero.

### Usage Locations
- LoginPage hero section (3 feature pills)
- Could be reused for onboarding tours

### TypeScript Interface
```typescript
interface FeaturePillProps {
  // Required
  text: string;
  
  // Optional
  icon?: React.ReactNode;
  color?: string; // defaults to primary accent
}
```

### Visual Specification
```
┌────────────────────┐
│ 🎯 Feature Text    │
└────────────────────┘

Border Radius: 999px (fully rounded)
Border: 2px solid accent
Background: accent + 10% opacity (rgba)
Padding: 8px 16px
Font: 13px, secondary color
```

### CSS Classes
```typescript
sx={{
  borderRadius: '999px',
  border: `2px solid ${theme.palette.primary.main}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  padding: theme.spacing(1, 2),
  fontSize: '13px',
  color: theme.palette.text.secondary,
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}}
```

### Example Usage
```typescript
<Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
  <FeaturePill text="Manage Appointments" icon={<EventIcon />} />
  <FeaturePill text="Client Database" icon={<PeopleIcon />} />
  <FeaturePill text="Real-time Notifications" icon={<NotificationsIcon />} />
</Box>
```

---

## 4️⃣ SETTING ROW COMPONENT

### Purpose
Consistent layout for settings/preferences with label, description, and interactive control.

### Usage Locations
- Settings page (all preference rows)
- Report settings form
- Any settings list

### TypeScript Interface
```typescript
interface SettingRowProps {
  // Required
  label: string;
  control: React.ReactNode; // Switch, Select, etc.
  
  // Optional
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  hideDivider?: boolean;
  onClick?: () => void;
}
```

### Visual Specification
```
┌────────────────────────────────────────┐
│ [Icon] Label                    Control│
│        Description (secondary)         │
├────────────────────────────────────────┤
```

### CSS Classes
```typescript
sx={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingY: theme.spacing(2),
  borderBottomWidth: 1,
  borderBottomColor: theme.palette.divider,
  borderBottomStyle: 'solid',
  
  '&:last-child': {
    borderBottom: 'none',
  },
}}
```

### Example Usage
```typescript
<SettingRow
  icon={<LanguageIcon />}
  label="Language"
  description="Select your preferred language"
  control={<OptionSelector {...props} />}
/>

<SettingRow
  icon={<NotificationsIcon />}
  label="Notifications"
  description="Enable/disable push notifications"
  control={<Switch checked={notif} onChange={...} />}
/>
```

---

## 5️⃣ OPTION SELECTOR COMPONENT

### Purpose
Two or more option buttons for selection (Language, Theme, etc.)

### Usage Locations
- Settings page (Language selector, Theme selector)
- Notification type filter
- Any preference selection

### TypeScript Interface
```typescript
interface OptionSelectorProps {
  // Required
  options: Array<{
    label: string;
    value: string;
    icon?: React.ReactNode;
  }>;
  value: string;
  onChange: (value: string) => void;
  
  // Optional
  disabled?: boolean;
  fullWidth?: boolean;
}
```

### Visual Specification
```
┌─────────┬─────────┐
│ Option1 │ Option2 │  ← Active: Gold bg, dark text
└─────────┴─────────┘
Each button: flex: 1, height: 44px
Radius: 12px, gap: 4px
```

### CSS Classes
```typescript
// Container
sx={{
  display: 'flex',
  gap: theme.spacing(0.5),
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(0.5),
  borderRadius: theme.spacing(1.5),
  flex: 1,
}}

// Button
sx={{
  flex: 1,
  padding: theme.spacing(1),
  borderRadius: theme.spacing(1.5),
  border: 'none',
  backgroundColor: isActive 
    ? theme.palette.primary.main 
    : theme.palette.background.default,
  color: isActive
    ? theme.palette.primary.contrastText
    : theme.palette.text.primary,
  cursor: 'pointer',
  fontWeight: 600,
}}
```

### Example Usage
```typescript
<OptionSelector
  options={[
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ]}
  value={theme}
  onChange={setTheme}
/>

<OptionSelector
  options={[
    { label: 'Español', value: 'es' },
    { label: 'English', value: 'en' },
  ]}
  value={language}
  onChange={setLanguage}
/>
```

---

## 6️⃣ WEEK DAY CHIP COMPONENT

### Purpose
Display individual day with appointment count, part of week selector row.

### Usage Locations
- Calendar page (week day selector below date picker)

### TypeScript Interface
```typescript
interface WeekDayChipProps {
  // Required
  day: number; // 1-31
  dayName: string; // 'Mon', 'Tue', etc.
  appointmentCount: number;
  selected: boolean;
  
  // Optional
  onClick: () => void;
  disabled?: boolean;
  color?: string; // highlight color for selected
}
```

### Visual Specification
```
┌──────────┐
│ Mon      │
│ 23       │
│ ⊙ 3      │  ← Appointment count with dot
└──────────┘

Width: ~68px, Height: ~68px
Border Radius: 14px
Selected: accent color, shadow
```

### CSS Classes
```typescript
sx={{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '68px',
  height: '68px',
  borderRadius: '14px',
  border: `2px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  cursor: 'pointer',
  boxShadow: selected ? theme.shadows[4] : 'none',
  transition: 'all 0.2s ease',
}}
```

---

## 7️⃣ CALENDAR SUMMARY CARD COMPONENT

### Purpose
Display date summary with appointment count at top of calendar.

### Usage Locations
- Calendar page (above calendar)

### TypeScript Interface
```typescript
interface CalendarSummaryCardProps {
  // Required
  selectedDate: string; // ISO format 'YYYY-MM-DD'
  appointmentCount: number;
  
  // Optional
  onCreateClick?: () => void;
  loading?: boolean;
}
```

### Visual Specification
```
┌──────────────────────────────┐
│ TODAY'S SCHEDULE  (eyebrow)   │
│ Monday, June 23, 2026 (title) │
│ 3 appointments (subtitle)     │
├──────────────────────────────┤
│ [+ Create] [View More ›]      │
└──────────────────────────────┘
```

### Example Usage
```typescript
<CalendarSummaryCard
  selectedDate="2026-06-23"
  appointmentCount={3}
  onCreateClick={() => navigate('/appointments/new')}
/>
```

---

## 🎨 SHARED STYLING TOKENS

### Colors
```typescript
// Accents
primary: '#C9A84C' // Gold
primaryLight: '#E5C878'
primaryDark: '#A68637'

// Semantic
success: '#10B981'
error: '#EF4444'
info: '#3B82F6'

// Backgrounds
bgPrimary: '#1A1A1A' (light mode)
bgSecondary: '#0D0D0D' (dark mode)
bgSurface: '#242424'

// Text
textPrimary: '#FFFFFF'
textSecondary: '#A1A1AA'
```

### Spacing Scale
```typescript
4px  // xs
8px  // sm
12px // md
16px // lg
24px // xl
32px // 2xl
```

### Border Radius
```typescript
6px   // sm (small components)
10px  // md (buttons, inputs, cards)
12px  // lg (card corners, modals)
14px  // xl (large cards)
20px  // 2xl (large hero cards)
999px // full (pills)
```

### Shadows
```typescript
// Light shadow (cards, hover states)
0 4px 8px rgba(0, 0, 0, 0.08)

// Medium shadow (elevated elements)
0 8px 16px rgba(0, 0, 0, 0.12)

// Dark shadow (modals, overlays)
0 20px 40px rgba(0, 0, 0, 0.2)
```

---

## 🔄 RESPONSIVE BREAKPOINTS

```typescript
xs: 0px      // Mobile phones
sm: 600px    // Tablets
md: 960px    // Small laptops
lg: 1280px   // Desktops
xl: 1920px   // Large screens
```

### Component Adjustments by Breakpoint
```
xs (Mobile):
- HeroCard: full width padding, single column metrics
- MetricPill: size: 'small'
- WeekDayChips: horizontal scroll if needed
- OptionSelector: full width

md (Tablet+):
- HeroCard: normal layout
- MetricPill: size: 'medium'
- WeekDayChips: 7 columns visible
- OptionSelector: inline

lg (Desktop+):
- HeroCard: constrained max-width
- MetricPill: size: 'large'
- All components: optimal spacing
```

---

## ✅ TESTING CHECKLIST

For each component, verify:

- [ ] Props validation (TypeScript strict mode)
- [ ] Responsive on xs/sm/md/lg breakpoints
- [ ] Color contrast meets WCAG AA standard
- [ ] Keyboard navigation works (tab, enter, escape)
- [ ] Screen reader announces content correctly
- [ ] Hover/active states visible
- [ ] Disabled states properly indicated
- [ ] Loading states handled gracefully
- [ ] Error states displayed clearly
- [ ] Touch targets minimum 44px on mobile

---

## 📚 COMPONENT DEPENDENCIES

### Required Packages (Already Installed)
- `@mui/material` - Base components
- `@mui/icons-material` - Icons
- `react` - React library
- `react-dom` - React DOM

### Internal Dependencies
```typescript
// HeroCard uses
- Typography, Box, Stack
- theme (from @mui/material)

// MetricPill uses
- Card, CardContent, Typography, Stack, Box
- CircularProgress (for loading state)

// FeaturePill uses
- Box, Typography
- alpha utility from @mui/material

// SettingRow uses
- Box, Typography, Stack

// OptionSelector uses
- Box, Button, Stack

// WeekDayChip uses
- Box, Typography, Button

// CalendarSummaryCard uses
- Card, Box, Typography, Button, Stack
```

---

## 🚀 IMPLEMENTATION ORDER

**Priority 1** (Day 1-2):
1. HeroCard
2. MetricPill
3. FeaturePill

**Priority 2** (Day 3-4):
4. SettingRow
5. OptionSelector
6. WeekDayChip

**Priority 3** (Day 5):
7. CalendarSummaryCard
8. Specialized pages (Settings, Notifications)

---

## 💾 FILE LOCATIONS

```
src/presentation/components/
├── shared/
│   ├── HeroCard.tsx
│   ├── HeroCard.test.tsx
│   ├── MetricPill.tsx
│   ├── MetricPill.test.tsx
│   ├── FeaturePill.tsx
│   ├── FeaturePill.test.tsx
│   ├── SettingRow.tsx
│   ├── SettingRow.test.tsx
│   ├── OptionSelector.tsx
│   ├── OptionSelector.test.tsx
│   └── index.ts (barrel export)
└── appointments/
    ├── WeekDayChip.tsx
    ├── WeekDayChip.test.tsx
    ├── WeekDayChips.tsx
    ├── CalendarSummaryCard.tsx
    └── index.ts
```

### Barrel Export (shared/index.ts)
```typescript
export { HeroCard } from './HeroCard';
export { MetricPill } from './MetricPill';
export { FeaturePill } from './FeaturePill';
export { SettingRow } from './SettingRow';
export { OptionSelector } from './OptionSelector';

export type { HeroCardProps } from './HeroCard';
export type { MetricPillProps } from './MetricPill';
export type { FeaturePillProps } from './FeaturePill';
export type { SettingRowProps } from './SettingRow';
export type { OptionSelectorProps } from './OptionSelector';
```

---

**Status**: Ready for development ✅  
**Next**: Create component files and start implementation

