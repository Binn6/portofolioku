# Mobile Responsive Design Spec
**Date:** 2026-05-10  
**Scope:** Portfolio (user-facing) + Admin panel — mobile-first, then tablet

---

## Decisions Made

| Question | Decision |
|---|---|
| Admin mobile navigation | Bottom navigation bar (5 items) |
| Portfolio sections layout | Full-width 1 column (except Skills → 2 column compact grid) |
| Admin modal style | Bottom sheet (slides up from bottom) |
| Tilt3D on mobile | Disabled on touch devices |

---

## 1. Portfolio — User Side

### 1.1 Navbar (`Navbar.jsx`)
- Already has hamburger button + dropdown — keep structure, minor fixes only:
  - Auto-close dropdown on scroll
  - Ensure z-index doesn't conflict with sections

### 1.2 Hero (`Hero.jsx`)
- Text sizing already responsive (`text-5xl md:text-7xl`) — no change needed
- Aurora canvas stays on mobile (lightweight canvas, not heavy)
- Buttons already use `flex-wrap` — no change needed

### 1.3 About (`About.jsx`)
- Mobile: stack vertically — profile card on top, bio below
- Disable Tilt3D effect on touch devices (`window.matchMedia('(hover: none)')` or check `ontouchstart`)
- Stats row (years / projects count): 2-column grid on mobile

### 1.4 Skills (`Skills.jsx`)
- Mobile: **2-column compact grid** per category
- Each cell: name + dot-level indicator, centered
- Category headers remain as separators

### 1.5 Projects (`Projects.jsx`)
- Mobile: `grid-cols-1` (full-width cards)
- Tablet: `sm:grid-cols-2`
- Desktop: already `md:grid-cols-2 lg:grid-cols-3`
- Thumbnail aspect ratio maintained

### 1.6 Experience (`Experience.jsx`)
- Already a vertical list — add horizontal padding reduction on mobile
- Full-width cards, reduce internal padding: `p-4` → `p-3 sm:p-4`

### 1.7 Education & Certificates (`Education.jsx`, `Certificates.jsx`)
- Same as Experience — already vertical lists, just responsive padding

### 1.8 Contact (`Contact.jsx`)
- Form inputs: ensure `w-full` on all fields
- Submit button: full-width on mobile

---

## 2. Admin Panel

### 2.1 AdminLayout (`AdminLayout.jsx`) — main change

**Desktop (md+):** Current collapsible sidebar — unchanged.

**Mobile (< md):** 
- Sidebar completely hidden (`hidden md:flex`)
- Bottom navigation bar fixed at bottom of viewport
- Main content: padding reduced `p-4 md:p-8`
- Main content: add `pb-20` to avoid content hidden behind bottom nav

**Bottom Nav — 5 items:**
1. Dashboard (`/binn/dashboard`) — LayoutDashboard icon
2. Projects (`/binn/projects`) — FolderKanban icon
3. Profile (`/binn/profile`) — User icon
4. Messages (`/binn/messages`) — MessageSquare icon
5. More → navigates to `/binn/more` — Grid3x3 icon

**Bottom nav styling:**
- Fixed bottom, full-width, `h-16`
- Background: `bg-surface border-t border-border`
- Active item: accent color icon + label
- Inactive: muted color

### 2.2 More Page (`pages/admin/More.jsx`) — new file

A simple page listing the remaining nav items in a 3-column icon grid:
- Skills, Experiences, Education, Certificates, CV, Logout
- Each item: icon (40×40 rounded), label below
- Logout button in red-muted style
- Shown only in mobile context (accessible via `/binn/more`)

### 2.3 Admin Content Areas

**All admin pages:**
- Reduce heading margin: `mb-8` → `mb-4 md:mb-8`
- Add button: keep in header row but smaller text on mobile

**Projects page:**
- Cards: already `md:grid-cols-2 lg:grid-cols-3` → add `grid-cols-1` base

**Skills page (table):**
- Wrap table in `overflow-x-auto` div
- Table stays as-is, just scrollable on small screens

**Certificates page (table):**
- Same — wrap in `overflow-x-auto`

**Experience, Education pages:**
- Already card/list style — just responsive padding

### 2.4 Modals (all admin pages)
Current modals use `fixed inset-0 ... flex items-center justify-center`.

**Mobile change:** Bottom sheet style
- `items-end` instead of `items-center` on mobile
- Modal panel: `rounded-t-2xl rounded-b-none w-full max-h-[90vh] overflow-y-auto`
- On md+: keep current centered style

Implementation: use responsive classes on the modal overlay and panel:
```jsx
// overlay
"fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-0 md:p-4"
// panel
"glass rounded-t-2xl md:rounded-xl p-6 w-full md:max-w-lg max-h-[90vh] overflow-y-auto"
```

---

## 3. Breakpoints Used

| Breakpoint | Tailwind prefix | Width |
|---|---|---|
| Mobile (default) | (none) | 0–639px |
| Tablet | `sm:` | 640px+ |
| Desktop | `md:` | 768px+ |
| Large | `lg:` | 1024px+ |

---

## 4. Files to Modify

### Portfolio (user-facing)
| File | Change |
|---|---|
| `components/sections/About.jsx` | Disable Tilt3D on touch, stack layout |
| `components/sections/Skills.jsx` | 2-col grid on mobile |
| `components/sections/Projects.jsx` | 1-col on mobile |
| `components/sections/Experience.jsx` | Responsive padding |
| `components/sections/Education.jsx` | Responsive padding |
| `components/sections/Certificates.jsx` | Responsive padding |
| `components/sections/Contact.jsx` | Full-width form |
| `components/layout/Navbar.jsx` | Auto-close on scroll |

### Admin
| File | Change |
|---|---|
| `components/layout/AdminLayout.jsx` | Hide sidebar on mobile, add bottom nav |
| `pages/admin/More.jsx` | **New** — icon grid for remaining nav items |
| `App.jsx` | Add `/binn/more` route |
| `pages/admin/Projects.jsx` | Modal → bottom sheet, grid responsive |
| `pages/admin/Skills.jsx` | Table → overflow-x-auto, modal → bottom sheet |
| `pages/admin/Experiences.jsx` | Modal → bottom sheet |
| `pages/admin/Education.jsx` | Modal → bottom sheet |
| `pages/admin/Certificates.jsx` | Table → overflow-x-auto, modal → bottom sheet |

---

## 5. Out of Scope (not in this iteration)
- Tablet-specific layouts beyond `sm:` breakpoint tweaks
- Dark/light mode toggle
- PWA / installable app
- Push notifications for messages
