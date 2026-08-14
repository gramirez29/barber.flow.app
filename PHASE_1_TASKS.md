# 🚀 PHASE 1 IMPLEMENTATION TASKS
## Core Enhancements - Ready to Start

**Estimated Effort**: 40 hours  
**Priority**: HIGH  
**Status**: ✅ Specification Complete | ⏳ Ready for Implementation

---

## 📋 TASK CHECKLIST

### Task Group 1.1: LOGIN PAGE HERO (8 hours)

#### [1.1.1] Create LoginHeroSection Component (4 hours)
- [ ] Create file: `src/presentation/components/auth/LoginHeroSection.tsx`
- [ ] Implement hero container with:
  - Background image support
  - Semi-transparent overlay (20% opacity)
  - Responsive sizing
- [ ] Add brand section:
  - Icon display
  - App name with gradient text (#C9A84C → #E5C878)
  - Tagline/description
- [ ] Add feature pills container
- [ ] Material-UI theming integration
- [ ] TypeScript strict typing
- [ ] Add unit tests

**Acceptance Criteria**:
```
✓ Hero displays full-width
✓ Background image visible with proper overlay
✓ Brand section readable on all breakpoints
✓ No TypeScript errors
✓ Responsive: xs/sm/md/lg breakpoints tested
```

---

#### [1.1.2] Create FeaturePill Component (1.5 hours)
- [ ] Create file: `src/presentation/components/shared/FeaturePill.tsx`
- [ ] Export from: `src/presentation/components/shared/index.ts`
- [ ] Implement pill styling:
  - Fully rounded (999px border-radius)
  - Accent border + 10% opacity background
  - 13px font size
  - Icon + text support
- [ ] Props interface with TypeScript
- [ ] Add hover states
- [ ] Accessibility: ARIA labels, keyboard nav
- [ ] Add unit tests

**Acceptance Criteria**:
```
✓ Pill displays correctly (rounded, colored border)
✓ Hover state visible
✓ Icon displays properly
✓ Text truncates if too long
✓ Responsive sizing
```

---

#### [1.1.3] Create FeaturePillRow Component (1.5 hours)
- [ ] Create file: `src/presentation/components/auth/FeaturePillRow.tsx`
- [ ] Implement container for 3 features
- [ ] Accept array of features as props
- [ ] Center alignment with gap spacing
- [ ] Responsive wrapping on mobile
- [ ] Use FeaturePill component internally

**Acceptance Criteria**:
```
✓ 3 pills display horizontally on desktop
✓ Wraps vertically on mobile if needed
✓ Proper spacing between pills
✓ No overflow on small screens
```

---

#### [1.1.4] Update LoginForm Component (2 hours)
- [ ] Modify: `src/presentation/components/auth/LoginForm.tsx`
- [ ] Add overlapping card design:
  - Hero section above
  - Card extends 28px above hero
  - Negative margin or positioning
- [ ] Update styling:
  - Remove full-width constraint
  - Add max-width constraint
  - Adjust padding for overlap
- [ ] Test on all breakpoints
- [ ] Verify no regression in form functionality

**Acceptance Criteria**:
```
✓ Card overlaps hero by 28px
✓ Form functionality unchanged
✓ Styling looks professional
✓ Works on mobile/tablet/desktop
✓ No console errors
```

---

### Task Group 1.2: CALENDAR ENHANCEMENTS (12 hours)

#### [1.2.1] Create CalendarSummaryCard Component (2 hours)
- [ ] Create file: `src/presentation/components/appointments/CalendarSummaryCard.tsx`
- [ ] Implement using HeroCard pattern:
  - Eyebrow: "TODAY'S SCHEDULE" (or selected date label)
  - Title: Formatted date (e.g., "Monday, June 23, 2026")
  - Subtitle: Appointment count
- [ ] Add action buttons:
  - Create appointment button
  - Optional: View more / Details
- [ ] Use MetricPill component if needed
- [ ] Responsive layout

**Acceptance Criteria**:
```
✓ Date displays correctly formatted
✓ Appointment count accurate
✓ Buttons functional
✓ Responsive on all breakpoints
✓ No TypeScript errors
```

---

#### [1.2.2] Create WeekDayChip Component (1.5 hours)
- [ ] Create file: `src/presentation/components/appointments/WeekDayChip.tsx`
- [ ] Implement individual chip:
  - Day abbreviation (Mon, Tue, etc.)
  - Day number
  - Appointment count with badge
  - Selected state styling
  - Hover state
- [ ] Props:
  - `day: number`
  - `dayName: string`
  - `appointmentCount: number`
  - `selected: boolean`
  - `onClick: () => void`
- [ ] Add click handler
- [ ] Accessibility: keyboard nav

**Acceptance Criteria**:
```
✓ Displays day name, number, count
✓ Selected state visible (border, bg color)
✓ Click selects the day
✓ Proper styling/spacing
✓ Badge shows count > 0
```

---

#### [1.2.3] Create WeekDayChips Container (2 hours)
- [ ] Create file: `src/presentation/components/appointments/WeekDayChips.tsx`
- [ ] Display 7 chips (Mon-Sun)
- [ ] Horizontal scroll on mobile if needed
- [ ] Calculate appointment count for each day
- [ ] Handle selected day state
- [ ] Props:
  - `selectedDate: Date`
  - `onDateSelect: (date: Date) => void`
  - `appointments: Appointment[]`
- [ ] Responsive: full width or scroll

**Acceptance Criteria**:
```
✓ All 7 days display
✓ Current day highlighted
✓ Appointment counts accurate
✓ Clicking day updates selection
✓ Works on mobile (scroll if needed)
```

---

#### [1.2.4] Create ViewModeSelector Component (1.5 hours)
- [ ] Create file: `src/presentation/components/appointments/ViewModeSelector.tsx`
- [ ] Implement 3 pills: Month / Week / Day
- [ ] Use OptionSelector pattern (2-button style but 3 options)
- [ ] Props:
  - `mode: 'month' | 'week' | 'day'`
  - `onChange: (mode) => void`
- [ ] Active state: accent color
- [ ] Inactive state: surface color
- [ ] Icon support (Calendar, List, Calendar icon)

**Acceptance Criteria**:
```
✓ 3 pills display in row
✓ Active pill highlighted
✓ Click changes view mode
✓ Proper styling
✓ Icons display correctly if provided
```

---

#### [1.2.5] Create ViewModePill Component (1 hour)
- [ ] Create file: `src/presentation/components/appointments/ViewModePill.tsx`
- [ ] Individual pill in ViewModeSelector
- [ ] Props:
  - `label: string`
  - `active: boolean`
  - `onClick: () => void`
  - `icon?: React.ReactNode`
- [ ] Styling matches OptionSelector pattern

**Acceptance Criteria**:
```
✓ Pill displays correctly
✓ Active/inactive states clear
✓ Click handler works
✓ Icon displays if provided
```

---

#### [1.2.6] Update AppointmentCalendar Component (3.5 hours)
- [ ] Modify: `src/presentation/components/appointments/AppointmentCalendar.tsx`
- [ ] Add above calendar:
  - CalendarSummaryCard
  - ViewModeSelector
  - WeekDayChips
- [ ] Implement view mode switching:
  - Month view: current FullCalendar
  - Week view: show 7 days
  - Day view: show single day appointments
- [ ] Handle day selection
- [ ] Update appointment highlighting
- [ ] Responsive layout

**Acceptance Criteria**:
```
✓ Summary card displays date info
✓ Week chips show all 7 days + counts
✓ View mode selector functional
✓ Month/week/day switching works
✓ Appointments display in selected mode
✓ Day selection updates summary
✓ No regression in existing calendar
```

---

### Task Group 1.3: REUSABLE COMPONENTS (20 hours)

#### [1.3.1] Create HeroCard Component (2 hours)
- [ ] Create file: `src/presentation/components/shared/HeroCard.tsx`
- [ ] Export from: `src/presentation/components/shared/index.ts`
- [ ] Props interface:
  ```typescript
  interface HeroCardProps {
    title: string;
    eyebrow?: string;
    subtitle?: string;
    backgroundImage?: string;
    children?: React.ReactNode;
    actions?: React.ReactNode;
  }
  ```
- [ ] Styling:
  - Background image support with overlay
  - Responsive padding
  - Theme integration
  - Proper text hierarchy
- [ ] Accessibility: proper heading levels
- [ ] Add unit tests

**Acceptance Criteria**:
```
✓ Displays title, eyebrow, subtitle
✓ Background image renders with overlay
✓ Children render properly
✓ Responsive on all breakpoints
✓ Actions buttons visible and clickable
```

---

#### [1.3.2] Create MetricPill Component (1.5 hours)
- [ ] Create file: `src/presentation/components/shared/MetricPill.tsx`
- [ ] Export from: `src/presentation/components/shared/index.ts`
- [ ] Props interface:
  ```typescript
  interface MetricPillProps {
    value: string | number;
    label: string;
    color?: string;
    backgroundColor?: string;
    icon?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
  }
  ```
- [ ] Styling:
  - Border radius: 14px
  - Large value display
  - Uppercase label
  - Size variants
  - Loading state support
- [ ] Add unit tests

**Acceptance Criteria**:
```
✓ Value displays in large font
✓ Label displays in uppercase
✓ Icon renders if provided
✓ Size variants work (small/med/large)
✓ Loading state works
✓ Colors apply correctly
```

---

#### [1.3.3] Create FeaturePill Component (1 hour)
**Note**: Already created in Task 1.1.2, but document here for clarity
- [ ] Verify: `src/presentation/components/shared/FeaturePill.tsx`
- [ ] Export from: `src/presentation/components/shared/index.ts`

---

#### [1.3.4] Create SettingRow Component (2 hours)
- [ ] Create file: `src/presentation/components/shared/SettingRow.tsx`
- [ ] Export from: `src/presentation/components/shared/index.ts`
- [ ] Props interface:
  ```typescript
  interface SettingRowProps {
    label: string;
    control: React.ReactNode;
    description?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    hideDivider?: boolean;
  }
  ```
- [ ] Styling:
  - Flex row layout
  - Divider between rows
  - Proper spacing
  - Icon support
  - Disabled state
- [ ] Add unit tests

**Acceptance Criteria**:
```
✓ Label displays left
✓ Control displays right
✓ Description shows if provided
✓ Icon displays if provided
✓ Divider shows except last row
✓ Disabled state appears
```

---

#### [1.3.5] Create OptionSelector Component (2 hours)
- [ ] Create file: `src/presentation/components/shared/OptionSelector.tsx`
- [ ] Export from: `src/presentation/components/shared/index.ts`
- [ ] Props interface:
  ```typescript
  interface OptionSelectorProps {
    options: Array<{
      label: string;
      value: string;
      icon?: React.ReactNode;
    }>;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
  }
  ```
- [ ] Styling:
  - Pill-style buttons
  - Active: accent color + dark text
  - Inactive: surface color
  - Border radius: 12px
  - Equal flex width
- [ ] 2 or more options support
- [ ] Add unit tests

**Acceptance Criteria**:
```
✓ All options display
✓ Active option highlighted
✓ Clicking option updates value
✓ onChange callback fires
✓ Disabled state works
✓ Icons display if provided
```

---

#### [1.3.6] Create Shared Index File (0.5 hours)
- [ ] Create/Update: `src/presentation/components/shared/index.ts`
- [ ] Export all components:
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

#### [1.3.7] Component Testing (3 hours)
- [ ] Create test files for all 5 components:
  - `HeroCard.test.tsx`
  - `MetricPill.test.tsx`
  - `FeaturePill.test.tsx`
  - `SettingRow.test.tsx`
  - `OptionSelector.test.tsx`
- [ ] Test:
  - Rendering
  - Props validation
  - User interactions (click, change)
  - Accessibility
  - Responsive behavior
- [ ] Achieve 80%+ coverage

**Acceptance Criteria**:
```
✓ All components tested
✓ 80%+ code coverage
✓ All tests passing
✓ No console warnings
```

---

## 🔄 DEPENDENCIES & PREREQUISITES

### Before Starting Task Group 1.1:
- [ ] Background image copied to `barber-flow-web/public/images/`
- [ ] Material-UI v6 verified (already installed)
- [ ] Theme colors defined (already done: #C9A84C gold)

### Before Starting Task Group 1.2:
- [ ] FullCalendar library installed (verify in package.json)
- [ ] useAppointments hook exists
- [ ] Date formatting utilities available

### Before Starting Task Group 1.3:
- [ ] Material-UI components available
- [ ] Testing setup complete (Jest/React Testing Library)
- [ ] No dependencies on other components

---

## ⏱️ HOUR BREAKDOWN

| Task | Hours | Status |
|------|-------|--------|
| 1.1.1 LoginHeroSection | 4 | - |
| 1.1.2 FeaturePill | 1.5 | - |
| 1.1.3 FeaturePillRow | 1.5 | - |
| 1.1.4 Update LoginForm | 2 | - |
| **Group 1.1 Subtotal** | **9** | - |
| 1.2.1 CalendarSummaryCard | 2 | - |
| 1.2.2 WeekDayChip | 1.5 | - |
| 1.2.3 WeekDayChips | 2 | - |
| 1.2.4 ViewModeSelector | 1.5 | - |
| 1.2.5 ViewModePill | 1 | - |
| 1.2.6 Update AppointmentCalendar | 3.5 | - |
| **Group 1.2 Subtotal** | **12** | - |
| 1.3.1 HeroCard | 2 | - |
| 1.3.2 MetricPill | 1.5 | - |
| 1.3.3 FeaturePill | 1 | - |
| 1.3.4 SettingRow | 2 | - |
| 1.3.5 OptionSelector | 2 | - |
| 1.3.6 Shared Index | 0.5 | - |
| 1.3.7 Component Testing | 3 | - |
| **Group 1.3 Subtotal** | **12** | - |
| **PHASE 1 TOTAL** | **40** | - |

---

## ✅ PHASE 1 SUCCESS CRITERIA

When complete, verify:

- [ ] LoginPage displays professional hero section
- [ ] Background image visible with overlay
- [ ] Feature pills display correctly
- [ ] Card overlaps hero smoothly
- [ ] Calendar shows summary card
- [ ] Week day chips interactive
- [ ] View mode selector functional
- [ ] All 5 reusable components created
- [ ] All components pass tests
- [ ] TypeScript: 0 errors
- [ ] All pages responsive (xs/sm/md/lg)
- [ ] Accessibility: WCAG 2.1 AA minimum
- [ ] No console errors or warnings

---

## 📱 TESTING CHECKLIST

Before marking task complete:

- [ ] **Desktop (1920px)**: Full layout visible, all elements accessible
- [ ] **Tablet (768px)**: Responsive layout working, no overflow
- [ ] **Mobile (375px)**: Text readable, buttons tappable, no scroll issues
- [ ] **Mobile (320px)**: Minimum size working (if supported)
- [ ] **Keyboard**: Tab through all interactive elements
- [ ] **Screen Reader**: Content announced correctly
- [ ] **Light Theme**: Colors readable with proper contrast
- [ ] **Dark Theme**: Colors readable with proper contrast
- [ ] **Color Blind**: Sufficient non-color indicators (icons, text, patterns)

---

## 🚀 READY TO START

1. ✅ All specifications documented
2. ✅ Task breakdown clear
3. ✅ Hours estimated
4. ✅ Success criteria defined
5. ✅ Testing approach outlined

**Next Step**: Pick first developer and start with Task 1.3.1 (HeroCard) since it has no dependencies and other components need it.

**Alternatively**: Start in parallel with Task 1.1.1 (LoginHeroSection) while Task 1.3.x components are being built.

---

**Generated**: 2026-06-23  
**Status**: ✅ READY FOR IMPLEMENTATION
