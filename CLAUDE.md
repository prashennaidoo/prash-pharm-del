# Pharmacy Delivery Tracker — Claude Context

## 1. Project Overview

SAPC-compliant pharmacy delivery tracking app for South Africa. Enables pharmacists to manage and dispatch medication deliveries, and drivers to receive, complete, and confirm deliveries with proof-of-delivery (signature + photo). Built for the South African Pharmacy Council (SAPC) regulatory context.

Two user roles:
- **Pharmacist** — full access: create/manage deliveries, view history, manage drivers
- **Driver** — limited access: view assigned deliveries, capture signature/photo proof

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, React Native |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Local storage | AsyncStorage |
| Fonts | Poppins (all weights) |
| Signature capture | react-native-signature-canvas |
| Image handling | expo-image-picker |
| Printing | expo-print |

---

## 3. Project Structure

```
app/
  (tabs)/         # Pharmacist UI — tab-based navigation
  driver/         # Driver UI — separate stack navigation
  _layout.tsx     # Root layout, auth gate
components/       # Shared and role-specific UI components
constants/
  theme.ts        # Single source of truth for colours, spacing, typography
hooks/            # Custom React hooks
lib/              # Supabase client and service helpers
utils/            # Pure utility functions
types/            # Shared TypeScript types and interfaces
assets/           # Fonts, images, icons
```

---

## 4. Coding Conventions

- **TypeScript strict mode** — no `any`, explicit return types on all functions
- **Theme** — always import from `constants/theme.ts`; never hardcode colours, font sizes, or spacing
- **Font** — use Poppins exclusively; reference font weights via the theme
- **Components** — follow existing component patterns in `components/`; match file naming, prop typing, and StyleSheet structure
- **Supabase** — use helpers in `lib/` for all database and auth calls; do not write raw Supabase queries inline in screens
- **No design changes** — do not alter colours, layout, spacing, or typography unless explicitly asked
- **No new dependencies** — do not add packages without asking first

---

## 5. Session Protocol

At the **start** of every session:
1. Read `CLAUDE.md` (this file)
2. Read `DEVLOG.md` to understand recent changes and current state

During work:
- Test after every change — verify nothing is broken before proceeding
- Keep changes minimal and targeted to what was asked

At the **end** of every session:
- Update `DEVLOG.md` with: what was changed, why, and any known issues or follow-up items
- Commit after every working milestone with a clear, descriptive message

---

## 6. Important Rules

1. **Preserve existing functionality** — changes must not break working features
2. **Minimal and targeted** — only change what is necessary to fulfil the request
3. **Do not reorganise the file structure** — keep files where they are unless restructuring is explicitly requested
4. **Do not rewrite working code** — if a rewrite is needed, explain why before doing it
5. **Ask before refactoring** — do not clean up, rename, or restructure code outside the scope of the task
6. **Explain breaking changes** — if a change affects other parts of the app, flag it explicitly before proceeding
