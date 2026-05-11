# Mobile Responsive Design — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio website (user-facing + admin panel) fully responsive for mobile and tablet, mobile-first.

**Architecture:** Tailwind responsive class pass over all existing components + `AdminLayout.jsx` refactor to show a fixed bottom nav on mobile instead of the sidebar. One new page (`More.jsx`) handles the overflow admin nav items. Modals become bottom sheets on mobile via responsive class swap.

**Tech Stack:** React 19, Tailwind CSS 3, Framer Motion, Lucide React, Laravel (unchanged)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `components/layout/AdminLayout.jsx` | Modify | Hide sidebar < md, add bottom nav bar |
| `pages/admin/More.jsx` | **Create** | Icon grid for remaining nav items + logout |
| `App.jsx` | Modify | Add `/binn/more` route |
| `components/layout/Navbar.jsx` | Modify | Auto-close dropdown on scroll |
| `components/sections/About.jsx` | Modify | Vertical stack + disable Tilt3D on touch |
| `components/sections/Skills.jsx` | Modify | 2-col compact grid on mobile |
| `components/sections/Projects.jsx` | Modify | 1-col on mobile |
| `components/sections/Experience.jsx` | Modify | Responsive padding |
| `components/sections/Education.jsx` | Modify | Responsive padding |
| `components/sections/Certificates.jsx` | Modify | Responsive padding |
| `components/sections/Contact.jsx` | Modify | Full-width form inputs |
| `pages/admin/Projects.jsx` | Modify | Modal → bottom sheet |
| `pages/admin/Skills.jsx` | Modify | Table overflow-x-auto + modal → bottom sheet |
| `pages/admin/Experiences.jsx` | Modify | Modal → bottom sheet |
| `pages/admin/Education.jsx` | Modify | Modal → bottom sheet |
| `pages/admin/Certificates.jsx` | Modify | Table overflow-x-auto + modal → bottom sheet |

---

## Status: IMPLEMENTED ✅

All tasks completed inline. Changes applied:

- [x] AdminLayout: sidebar `hidden md:flex`, main `p-4 md:p-8 pb-20 md:pb-8`, bottom nav with 5 items
- [x] More.jsx: new page with 3-col icon grid
- [x] App.jsx: `/binn/more` route added
- [x] Navbar.jsx: `setOpen(false)` on scroll
- [x] About.jsx: profile card `order-1 md:order-2`, bio `order-2 md:order-1`, tilt disabled on touch
- [x] Skills.jsx: `grid grid-cols-2 sm:grid-cols-1` per category, dot indicator on mobile
- [x] Projects.jsx (section): `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- [x] Education.jsx (section): `p-4 sm:p-5`
- [x] Certificates.jsx (section): `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, `p-4 sm:p-5`
- [x] Contact.jsx: `gap-10 md:gap-16`
- [x] Admin Projects: grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, modal bottom sheet
- [x] Admin Skills: table `overflow-x-auto min-w-[360px]`, modal bottom sheet
- [x] Admin Experiences: modal bottom sheet, `mb-4 md:mb-8`
- [x] Admin Education: modal bottom sheet, `mb-4 md:mb-8`
- [x] Admin Certificates: table `overflow-x-auto min-w-[480px]`, modal bottom sheet
