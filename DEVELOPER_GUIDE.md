# MamaSquads Developer Guide

## Overview

MamaSquads is a verified, moms-only playdate community app. It runs as a React web app (hosted on Vercel) and an iOS app (wrapped with Capacitor).

**Live site:** https://mamasquads.com
**Repo:** https://github.com/cicisimon97-art/mamasquad-app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (single-page app) |
| Build tool | Vite 5 |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage, RLS) |
| iOS wrapper | Capacitor 8 |
| Hosting | Vercel (auto-deploys from `main` branch) |
| Styling | Inline styles (no CSS framework) |

---

## Project Structure

```
mamasquad-app/
├── src/
│   ├── main.jsx          # THE main file — all components, screens, logic (~7000 lines)
│   ├── supabaseClient.js  # Supabase client initialization
│   └── app.jsx            # Additional app utilities
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker (network-first, no caching)
│   ├── logo.png           # App logo
│   ├── privacy-policy.html # Privacy policy page
│   └── AppIcon1024.png    # iOS app icon (1024x1024, no alpha)
├── ios/                   # Capacitor iOS project (Xcode)
│   └── App/
│       ├── App.xcodeproj  # Xcode project
│       └── App/
│           ├── public/    # Built web assets (copied by `cap sync`)
│           └── Assets.xcassets/AppIcon.appiconset/  # App icon
├── capacitor.config.json  # Capacitor config
├── supabase-schema.sql    # Full database schema (run in Supabase SQL Editor)
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── vercel.json            # Vercel deployment config
└── CLAUDE.md              # AI assistant context file
```

### Important: `src/main.jsx`

This is a single large file containing the entire app. All components, screens, state management, and business logic live here. This was a deliberate choice for rapid prototyping.

If you plan to refactor, the natural split would be:
- `components/` — Reusable UI (Avatar, BirthdayPicker, AddressInput, BottomNav, Icons)
- `screens/` — Each screen (HomeTab, DiscoverTab, GroupDetailScreen, ProfileDetail, etc.)
- `hooks/` — Custom hooks for Supabase data fetching
- `utils/` — Date formatting, age calculation, distance helpers

---

## Key Commands

```bash
# Install dependencies
npm install

# Start dev server (localhost:5173)
npm run dev

# Production build
npm run build

# Build + sync to iOS (run before opening Xcode)
npm run build:ios

# Sync web assets to iOS without rebuilding
npx cap sync ios

# Open Xcode project
npx cap open ios
```

---

## Environment Variables

Create a `.env` file in the project root (NOT committed to git):

```
VITE_SUPABASE_URL=https://khowgzwwculgcesoadlu.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
```

Get the anon key from: **Supabase Dashboard → Settings → API → Project API keys → anon/public**

---

## Database (Supabase)

**Project URL:** https://khowgzwwculgcesoadlu.supabase.co

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (linked to Supabase Auth) |
| `groups` | Mom groups/squads |
| `group_members` | Group membership (user ↔ group) |
| `join_requests` | Pending requests to join private groups |
| `events` | Playdates and events |
| `event_rsvps` | Event attendance (user ↔ event) |
| `comments` | Comments on events |
| `connections` | Mom-to-mom friend connections |
| `notifications` | In-app notifications |
| `invite_codes` | Beta invite codes |
| `meetup_proposals` | Polls for scheduling meetups |
| `votes` | Votes on meetup polls |

### Row Level Security (RLS)

All tables have RLS enabled. Policies are defined in `supabase-schema.sql`. Key patterns:
- Most tables: authenticated users can read all rows
- Insert: users can only insert rows where `user_id = auth.uid()`
- Update/Delete: users can only modify their own rows
- Group admins: can manage join requests and group data for their groups

### Schema Changes

If you need to modify the database schema:
1. Update `supabase-schema.sql` with the change
2. Run the SQL in **Supabase Dashboard → SQL Editor**
3. Test with the app

---

## Authentication

Uses **Supabase Auth** with email/password. Flow:

1. User signs up with email + password + invite code
2. On first login, user creates their profile (name, area, bio, kids, interests)
3. Identity verification is handled through the app (verification status stored in `users.is_verified`)

### User Roles

| Role | Stored in `users.role` | Capabilities |
|------|----------------------|--------------|
| `founder` | `'founder'` | Full admin access, always shown first in Discover |
| `admin` | `'admin'` | Can manage groups, approve requests, moderate |
| (default) | `null` | Regular member |

---

## App Architecture

### Navigation

The app uses a custom navigation system (not React Router):

- **Tab navigation:** `tab` state switches between Home, Discover, Groups, Notifications
- **Detail screens:** `selectedEvent`, `selectedProfile`, `selectedGroup`, etc.
- **History stack:** `navHistory` ref stores previous states. `pushNav()` saves current state before navigating, `popNav()` restores the previous state on back.

```
pushNav({}) → saves current state
popNav()    → restores previous state
```

### Screen Hierarchy (render order in main component)

```
1. showMyProfile    → MyProfileTab
2. selectedEvent    → EventDetail
3. selectedProfile  → ProfileDetail
4. tab === "create" → CreateEventScreen
5. showAdminApply   → AdminApplyScreen
6. showCreateGroup  → CreateGroupScreen
7. showDiscover     → DiscoverTab (standalone)
8. selectedGroup    → GroupDetailScreen
9. (default)        → Main tabs (Home, Discover, Groups, Notifications)
```

Higher in the list = rendered on top. This is how "detail" screens overlay the main tabs.

### Key Components

| Component | Line ~  | Purpose |
|-----------|---------|---------|
| `MamaSquadsApp` | 260 | Root component, all state and handlers |
| `HomeTab` | 2700 | Home feed with events, filters, groups |
| `DiscoverTab` | 3210 | Find other moms, distance filter |
| `ProfileDetail` | 3476 | View another mom's profile |
| `MyProfileTab` | 3660 | View/edit your own profile |
| `GroupsTab` | 4500~ | List of groups |
| `GroupPollsTab` | 4747 | Polls/meetup proposals within a group |
| `CreateEventScreen` | 4700~ | Create a new playdate |
| `GroupDetailScreen` | 5293 | Group detail with feed, members, polls |
| `NotificationsTab` | 4550~ | Notification list |
| `AddressInput` | 125 | Location autocomplete (Nominatim API) |
| `BirthdayPicker` | 72 | Date picker for kid birthdays |
| `BottomNav` | 6800~ | Bottom tab bar |

### Styles

All styles are defined in the `styles` object near the bottom of `main.jsx` (line ~6670). Key style objects:

- `styles.app` — Main app container (100dvh, flex column)
- `styles.mainContent` — Scrollable content area
- `styles.detailScreen` — Full-screen overlay for detail views
- `styles.detailBody` — Scrollable body within detail screens
- `styles.bottomNav` — Fixed bottom navigation bar
- `styles.primaryBtn` — Primary action button (burgundy)

### Theme

- Primary color: `#6B2C3B` (burgundy)
- Background: `#FFFBFC` (off-white)
- Font: DM Sans / system fonts
- Display font: Playfair Display (headings)

---

## Location Services

- **Location search** uses [Nominatim](https://nominatim.openstreetmap.org/) (OpenStreetMap) — free, no API key needed
- Search is biased toward **Long Island / NYC area** (bounding box in AddressInput)
- Discover tab distance filter uses Haversine formula for mile-based radius
- Default coordinates (when GPS unavailable): Long Island, NY (40.7891, -73.1350)

---

## iOS / Capacitor

### How it works

Capacitor wraps the built web app in a native WKWebView. The web assets are copied to `ios/App/App/public/` during `cap sync`.

### Building for iOS

```bash
npm run build:ios    # Build web + sync to iOS
npx cap open ios     # Open in Xcode
```

Then in Xcode:
- Select target device/simulator
- Cmd+R to build and run

### App Store Submission

1. Set signing team in Xcode (Signing & Capabilities)
2. Product → Archive
3. Upload to App Store Connect
4. Fill out listing (see `MamaSquads_AppStore_Guide.html` for details)

### Config

`capacitor.config.json`:
- `appId`: `com.mamasquads.app`
- `webDir`: `dist` (Vite build output)
- `server.hostname`: `localhost` (important — do not change to mamasquads.com or the app will white-screen)

---

## Deployment

### Web (Vercel)

- Auto-deploys when you push to `main` branch
- No special config needed — Vercel detects Vite and builds automatically
- Environment variables must be set in Vercel dashboard (Settings → Environment Variables)

### iOS (App Store)

- Build with `npm run build:ios`
- Open Xcode, archive, upload to App Store Connect
- Bump version in `package.json` and Xcode before each release

---

## Service Worker

`public/sw.js` uses a **network-first** strategy — every request goes to the network. No caching. This ensures users always get the latest version.

To force an update for users who have the app on their home screen, bump the `CACHE_NAME` version (currently `mamasquads-v8`).

---

## Pull-to-Refresh

The app has a custom pull-to-refresh implementation on the main content area. Pull down from the top of any screen to trigger a full page reload. This is especially important for PWA users who can't use browser refresh.

---

## Common Tasks

### Add a new screen

1. Create the component function in `main.jsx`
2. Add state variable (e.g., `const [showNewScreen, setShowNewScreen] = useState(false)`)
3. Add it to the render hierarchy (before the main tabs return)
4. Use `pushNav({})` before setting state, and `popNav()` for the back button

### Add a new database table

1. Write the CREATE TABLE + RLS policies SQL
2. Run it in Supabase SQL Editor
3. Add it to `supabase-schema.sql` for documentation
4. Use `supabase.from('table_name')` in the app code

### Add a new notification type

1. Insert into `notifications` table with the new `type` value
2. Update `NotificationsTab` to handle the new type's icon/display
3. Update `onNavigate` handler if the notification should navigate somewhere

### Modify styles

All styles are in the `styles` object (line ~6670). Search for the style name. The app uses inline styles exclusively — no CSS files.

---

## Known Considerations

- **Single file architecture**: `main.jsx` is ~7000 lines. This works but makes collaboration harder. Consider splitting into modules if adding a second developer.
- **Safe area handling**: iOS safe areas (notch, home indicator) are handled with `env(safe-area-inset-*)` in styles. Always include these for new fixed-position or edge-hugging elements.
- **Nominatim rate limits**: The free Nominatim API has a 1 request/second limit. The AddressInput has a 400ms debounce. If you see 429 errors, increase the debounce.
- **Supabase anon key**: The anon key is safe to expose in client code (it's designed for this). RLS policies protect data access. Never expose the service_role key.

---

## Contacts

- **Founder**: Cici (GitHub: cicisimon97-art)
- **Supabase project**: khowgzwwculgcesoadlu
