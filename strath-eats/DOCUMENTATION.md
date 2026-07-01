# StrathEats — Complete Documentation

## Overview

StrathEats is a campus food ordering platform built for Strathmore University. It connects students/staff with campus cafeterias ("cafeterias"), enabling browsing of live menus, ordering food, M-Pesa payment integration, and real-time order tracking across four roles: **Student**, **Staff**, **Vendor**, and **Admin**.

**Live URL:** (hosted via Firebase Hosting or Render — check with team)  
**GitHub:** https://github.com/luiz-zer0/strath-eats

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend framework** | React 19 (Vite) |
| **Routing** | React Router DOM v7 |
| **Styling** | Tailwind CSS 3 + custom CSS files |
| **Auth & DB** | Firebase Auth + Firestore |
| **Payments** | M-Pesa STK Push (Django backend) |
| **Backend** | Django (Python) — deployed on Render |
| **Build tool** | Vite 5 |
| **Notifications** | Browser Notification API |

### Key Dependencies

- `firebase` — Auth, Firestore, Analytics
- `recharts` — Charts on admin dashboard
- `react-router-dom` — Client-side routing
- `tailwindcss` — Utility-first CSS

---

## Project Structure

```
strath-eats/
  index.html                 # Vite entry HTML
  package.json               # Scripts & dependencies
  vite.config.js             # Vite configuration
  tailwind.config.js         # Tailwind theme customization
  postcss.config.js          # PostCSS plugins

  src/
    main.jsx                 # App entry point — mounts React, imports index.css
    App.jsx                  # Route definitions, provider nesting

    context/
      AuthContext.jsx         # User auth state, login/register/logout
      CartContext.jsx         # Shopping cart for student ordering
      OrdersContext.jsx       # User order management + placeOrder
      ThemeContext.jsx        # Dark/light mode toggle (localStorage)

    services/
      firebase.js             # Firebase init (config hardcoded)
      authservice.js          # Auth functions (signUp, signIn, etc.)
      stallservive.js         # Stall/cafeteria CRUD + listeners
      stallService.js         # Re-exports stallservive.js
      orderservice.js         # Order CRUD + listeners + M-Pesa trigger
      notificationservice.js  # Browser notification helpers

    pages/
      Landing.jsx             # Public landing page
      Auth.jsx                # Student/staff sign in + sign up + forgot password
      OrderRoleSelect.jsx     # Role selection before ordering (guest -> auth)
      VerifyEmail.jsx         # Post-registration email verification page
      student/
        StudentDashboard.jsx  # Full student dashboard: browse, cart, orders, profile
      vendor/
        VendorAuth.jsx        # Vendor sign in + sign up + forgot password
        VendorDashboard.jsx   # Vendor dashboard: orders, menu, settings, analytics
      admin/
        AdminLogin.jsx        # Admin sign in + forgot password
        AdminDashboard.jsx    # Admin dashboard: overview, orders, cafeterias, users

    styles/
      index.css               # Global styles, CSS variables, Tailwind, component classes
      auth.css                # Auth page specific styles
      student.css             # Student dashboard styles
      vendor.css              # Vendor dashboard styles
      admin.css               # Admin dashboard styles

    utils/
      analytics.js            # Admin analytics helpers (revenue, trends, etc.)
      formatters.js           # Currency, date, time formatters
      receipt.js              # Order receipt HTML generation + download

  backend/                    # Django backend — M-Pesa integration
    .env                      # M-Pesa credentials (NOT committed — ask team)
    manage.py
    requirements.txt
    api/                      # Django API app
    stratheats/               # Django project settings
    db.sqlite3                # SQLite database (dev)
```

---

## Routes

| Path | Component | Auth Required | Role |
|---|---|---|---|
| `/` | `Landing.jsx` | No | Public |
| `/order` | `OrderRoleSelect.jsx` | No | Public |
| `/auth` | `Auth.jsx` | No | Student/Staff |
| `/verify-email` | `VerifyEmail.jsx` | No | Post-registration |
| `/dashboard` | `StudentDashboard.jsx` | Yes | Student/Staff |
| `/vendor` | `VendorAuth.jsx` | No | Vendor sign in/up |
| `/vendor/dashboard` | `VendorDashboard.jsx` | Yes | Vendor |
| `/admin` | `AdminLogin.jsx` | No | Admin sign in |
| `/admin/dashboard` | `AdminDashboard.jsx` | Yes | Admin |
| `*` | Redirects to `/` | — | Catch-all |

---

## Authentication & Roles

### Role System
Four roles exist: `student`, `staff`, `vendor`, `admin`.

- **Student/Staff** — Register via `/auth`. Email must end with `@strathmore.edu`. Must verify email before first sign-in.
- **Vendor** — Register via `/vendor`. No email domain restriction. Must verify email. Gets a Firestore `cafeterias/{uid}` doc and `users/{uid}` profile.
- **Admin** — Pre-created in Firebase Console (no self-registration). Signs in via `/admin`.

### Auth Flow
1. User signs up → Firebase Auth account created → verification email sent
2. User verifies email → redirected back to sign-in page
3. On first sign-in, Firestore profile is fetched from `users/{uid}`
4. AuthContext stores: `user`, `role`, `isLoggedIn`, `pendingVerification`
5. Session inactivity timeout at 30 minutes (shows warning at 29 min)

### Forgot Password
All three auth pages have "Forgot password?":
- **Student/Staff** (`Auth.jsx`) — inline form, calls `sendPasswordReset()`
- **Vendor** (`VendorAuth.jsx`) — inline form, calls `sendPasswordReset()`
- **Admin** (`AdminLogin.jsx`) — inline form, calls `sendPasswordReset()`

### Social Login
Google sign-in is available on the main auth page for students/staff. Domain `@strathmore.edu` is enforced.

---

## Features by Role

### Student / Staff Dashboard (`/dashboard`)

| Feature | Details |
|---|---|
| **Browse Cafeterias** | Cards showing cafeteria name, category, hours, menu item count. Only shows live (online) cafeterias. |
| **View Menu** | Click a cafeteria card to expand its full menu. Each item shows name, price(s), availability. |
| **Portion selection** | Items with `portions` field show half/full pricing via a modal popup. |
| **Cart (right panel)** | Add/remove items, toggle qty, see running total. Toggle Dine-in / Takeaway mode. Set pickup time. |
| **Toggle cart** | Clicking an item already in cart removes it (does not add duplicate). |
| **Place Order** | Submits order to Firestore with `st: 'paid'`. Triggers M-Pesa STK Push (if backend is live). |
| **View Orders** | Order cards grouped by status (Paid, Accepted, Preparing, Ready, Collected, Cancelled). |
| **Cancel Order** | Only available for orders with `st: 'paid'`. |
| **Print Receipt** | Generates and downloads an HTML receipt for collected/cancelled orders. |
| **Profile Management** | Edit name, M-Pesa number, student/staff ID. |
| **Notifications** | Browser notifications on order status changes. |
| **Dark/Light Mode** | Toggle in the sidebar. |

### Vendor Dashboard (`/vendor/dashboard`)

| Feature | Details |
|---|---|
| **Orders Queue** | Tabs: Incoming (paid), Ongoing (accepted/preparing/ready), Completed (collected), Cancelled. |
| **Order Actions** | Confirm → Prepare → Mark Ready → Mark Collected. "Cancel" button for incoming orders. |
| **Menu Management** | Add new items with name, price, category. Edit items (✏️) pre-fills the form, "Save Changes" updates. Delete items (🗑️). |
| **Portion Support** | Toggle "Has portions" to enable half/full pricing per item. |
| **Online Toggle** | "Cafeteria status" switch in orders header and settings. Students only see live cafeterias. |
| **Settings** | Cafeteria name, category, hours, description, M-Pesa number. All saved locally (localStorage draft) + synced to Firestore. |
| **Analytics** | KPIs (total orders, revenue), line chart (7-day trend), top items, mode split (dine-in vs takeaway). |
| **Dark/Light Mode** | Toggle in the sidebar. |

### Admin Dashboard (`/admin/dashboard`)

| Feature | Details |
|---|---|
| **Overview Tab** | 4 KPI cards: Total Orders, Total Revenue, Active Users, Active Cafeterias. Revenue by Cafeteria bar chart. Period filter (24h, 7d, 30d, 90d). |
| **All Orders Tab** | Searchable table (search by order ID, student name, or cafeteria). Filterable by status. Shows all platform orders. |
| **Cafeterias Tab** | List of all registered cafeterias with name, category, status, menu item count. Suspend/reactivate buttons (stored in local state only, not Firestore — see Known Issues). Menu item preview chips. |
| **Users Tab** | List of all registered users. Suspend/reactivate toggle. |
| **Dark/Light Mode** | Toggle in the sidebar. |

---

## Database Schema (Firestore)

### Collection: `users`

| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Auth UID (doc ID) |
| `firstName` | string | User's first name |
| `lastName` | string | User's last name |
| `email` | string | Email address |
| `role` | string | `student`, `staff`, `vendor`, `admin`, `other` |
| `mpesa` | string (opt) | M-Pesa phone number |
| `studentId` | string (opt) | Student ID number |
| `staffId` | string (opt) | Staff ID number |
| `stallId` | string (opt) | For vendors — links to their cafeteria doc |
| `stallName` | string (opt) | For vendors — cafeteria name |
| `createdAt` | timestamp | Account creation time |
| `suspended` | boolean (opt) | Whether user is suspended |

### Collection: `stalls` (cafeterias)

| Field | Type | Description |
|---|---|---|
| `uid` | string | Vendor's UID (doc ID) |
| `name` | string | Cafeteria display name |
| `cat` | string | Category (e.g. "Local meals & stews") |
| `hrs` | string | Operating hours (e.g. "08:00-17:00") |
| `desc` | string | Description text |
| `mpesa` | string | M-Pesa till number |
| `online` | boolean | Whether accepting orders |
| `menu` | array | Array of menu item objects (see below) |
| `vendor` | string (opt) | Vendor's display name |
| `updatedAt` | timestamp | Last update time |

**Menu item object** (`stalls.menu[]`):

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique item ID (Date.now() + random) |
| `nm` | string | Item name |
| `pr` | number | Base price (only if portions is null) |
| `cat` | string | Item category/filter label |
| `av` | boolean | Whether item is available |
| `portions` | object (opt) | `{ half: number, full: number }` — if set, pr is ignored |

### Collection: `orders`

| Field | Type | Description |
|---|---|---|
| `id` | string | Auto-generated doc ID |
| `userId` | string | UID of the ordering user |
| `user` | string | User's display name |
| `userEmail` | string | User's email |
| `stallId` | string | Target cafeteria's ID |
| `stallName` | string | Cafeteria display name at time of order |
| `items` | array | Array of `{ nm, pr, qty, cat, portion? }` |
| `tot` | number | Order total in KES |
| `mode` | string | `Dine-in` or `Takeaway` |
| `pu` | string | Pickup time string |
| `st` | string | Status: `paid`, `accepted`, `preparing`, `ready`, `collected`, `cancelled` |
| `createdAt` | timestamp | Order creation time |
| `updatedAt` | timestamp | Last status update time |

---

## Context Providers (Nesting Order)

Providers are nested in `App.jsx` in this order (outermost first):

1. **`BrowserRouter`** — React Router
2. **`ThemeProvider`** — Dark/light mode (persisted to localStorage)
3. **`AuthProvider`** — User auth, login/register, profile
4. **`CartProvider`** — Student cart state
5. **`OrdersProvider`** — User orders, placeOrder, updateOrderStatus
6. **`ToastProvider`** — Toast notifications (rendered last for proper z-index)

---

## Services Layer

### `firebase.js`
Initializes Firebase with hardcoded config. Exports `auth` and `db`.

### `authservice.js`
Core auth functions: `signUp`, `signIn`, `logOut`, `resendVerification`, `getUserProfile`, `subscribeToUsers`, `signInWithGoogle`, `sendPasswordReset`. Enforces `@strathmore.edu` domain for students/staff.

### `stallservive.js`
Cafeteria data: `getStalls`, `getStall`, `subscribeToStalls` (real-time list), `subscribeToStall` (real-time single doc), `getMenu` (subcollection).

### `orderservice.js`
Order operations: `placeOrder`, `updateOrderStatus`, `getUserOrders`, plus real-time listeners `subscribeToUserOrders`, `subscribeToVendorOrders`, `subscribeToAllOrders`. Also `triggerMpesaStkPush` sends POST to Django backend.

### `notificationservice.js`
Browser notification utilities: `requestNotificationPermission`, `sendBrowserNotification`, `getStatusNotificationData`.

---

## Styling & Theme

### Dark/Light Mode
- **Default:** Dark mode (navy backgrounds, white/slate text, gold accents)
- **Storage:** `localStorage` key `stratheats:theme` (`'dark'` or `'light'`)
- **Mechanism:** `ThemeContext` toggles `data-theme` attribute on `<html>`. CSS variables in `:root` (dark) and `[data-theme="light"]` overrides switch colors.

### CSS Variable System (defined in `index.css`)

All colors in page-specific CSS files (`student.css`, `vendor.css`, `admin.css`, `auth.css`) reference these variables for theme support:

```
--bg-body         # Primary background
--bg-card         # Card/surface background  
--text-primary    # Primary text (headings)
--text-body       # Body text
--text-muted      # Muted/secondary text
--text-dim        # Dim/low-contrast text
--border          # Default border
--border-2        # Lighter border
--hover-bg        # Hover background
```

### Tailwind Config
Custom colors: `navy` (1-5 shades), `gold` / `gold-2`. Font: `'Sora', system-ui, sans-serif`.

### Responsive Breakpoints
- 1100px — tablet landscape
- 900px — tablet portrait
- 768px — large phone
- 600px — phone
- 480px — small phone (stack sidebar)

---

## M-Pesa Integration

- **Frontend:** `orderservice.js` → `triggerMpesaStkPush()` sends a POST to the Django backend at `VITE_BACKEND_URL/api/stk-push/`
- **Backend:** Django app (in `backend/`) handles STK push via Safaricom Daraja API. Uses env vars: `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`
- **Deployment:** Backend currently deployed at `https://strath-eats.onrender.com`
- **Local dev:** The backend runs separately — no Docker, uses SQLite.

---

## Development Setup

### Prerequisites
- Node.js 18+
- Python 3.10+ (for Django backend)
- Firebase project (`stratheats-51dca`)

### Frontend

```bash
cd strath-eats
npm install
npm run dev        # http://localhost:5173
npm run build      # Production build to dist/
npm run preview    # Preview production build
```

### Backend (M-Pesa)

```bash
cd strath-eats/backend
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python manage.py runserver
```

Create `backend/.env` with M-Pesa credentials (ask team).

### Environment Variables (Frontend)
No `.env` file is used for the frontend — Firebase config is hardcoded. The backend URL defaults to `https://strath-eats.onrender.com` in `orderservice.js`.

---

## Deployment

### Frontend Build
```bash
cd strath-eats
npm run build     # Outputs to dist/
```
Deploy `dist/` to any static host (Firebase Hosting, Vercel, Netlify, etc.).

### Firebase Hosting (if configured)
```bash
firebase deploy --only hosting
```

---

## Firestore Security Rules

The rules file (`firestore.rules`) has a known syntax error in the `stalls` block — a missing semicolon after `allow write`. This causes `getDoc()` calls to fail. The project uses `onSnapshot` (real-time listener) for stalls instead, which bypasses the issue. Rules must be edited in the Firebase Console to fix permanently.

Current problematic rule section:
```
match /stalls/{stallId} {
  allow read: if request.auth != null;
  allow write          // <-- missing semicolon! Should be: allow write;
  allow delete: if request.auth != null && request.auth.uid == stallId;
}
```

---

## Known Issues & Notes

1. **Firestore rules syntax error** — `stalls` block missing semicolon. `getDoc` fails, `onSnapshot` works. Fix in Firebase Console.
2. **Admin cafe status** — Suspend/reactivate is stored in local React state only, not persisted to Firestore. Refreshing resets all cafeterias to active.
3. **Admin analytics** — The "Revenue by Cafeteria" chart uses `revenueByStall` which references `order.stall` from `toAdminOrderRow`. Ensure `toAdminOrderRow` is used consistently.
4. **Vendor menu persistence** — Menu edits are saved to localStorage draft first, then synced to Firestore. Fast toggles may briefly show stale data.
5. **No `.env` for frontend** — Firebase config is hardcoded in `firebase.js`. This is fine for open-source but not ideal for security.
6. **Composite index** — A composite index on `orders` collection for `stallId` (Asc) + `createdAt` (Desc) exists and is enabled. Required for `subscribeToVendorOrders`.
7. **Inactivity timeout** — 30-minute session timeout on AuthContext. A warning banner appears at 29 minutes. Refresh the page to reset the timer.

---

## Quick Reference: Colors

| Token | Dark Value | Light Value |
|---|---|---|
| `--bg-body` | `#0a0f1e` (navy) | `#f1f5f9` (slate-50) |
| `--bg-card` | `#1a2035` (navy-3) | `#ffffff` |
| `--text-primary` | `#f1f5f9` (slate-50) | `#0f172a` (slate-900) |
| `--text-body` | `#cbd5e1` (slate-300) | `#334155` (slate-700) |
| `--text-muted` | `#64748b` (slate-500) | `#64748b` |
| `--border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.1)` |
| Gold accent | `#f0b429` | `#f0b429` (unchanged) |
