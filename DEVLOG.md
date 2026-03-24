# DEVLOG — Pharmacy Delivery Tracker

A running development journal. Update at the end of every session.

---

## Session 0 — Project Setup
**Date:** 2026-03-24
**Status:** Complete

### Context
Existing, functional Pharmacy Delivery Tracker app built by a previous developer. Project has been handed over for ongoing improvements and schema changes. No greenfield work — preserving all existing functionality.

### Tech Stack Confirmed
- Expo SDK 54, React Native, TypeScript
- Expo Router (file-based navigation)
- Supabase (Auth, PostgreSQL, Storage)
- AsyncStorage, react-native-signature-canvas, expo-image-picker, expo-print
- Poppins font, custom theme system (`constants/theme.ts`)

### What Was Done
- Cloned repository and verified the app builds successfully
- Created context management files for AI-assisted development:
  - `CLAUDE.md` — project rules, conventions, and session protocol
  - `DEVLOG.md` — this file
  - `ai/docs/` — directory for additional AI context documents
- Added `.env` to `.gitignore` to prevent future credential leaks

### Known Issues
1. **Wrong Supabase project** — app currently points at the previous developer's Supabase project via `.env`. A new project with the updated schema needs to be created before active development begins.
2. **`.env` previously committed** — the `.env` file containing Supabase credentials was committed to the repo at some point. This is a security concern. The previous developer's credentials should be considered exposed. Addressed by adding `.env` to `.gitignore`; the repo history still contains the old credentials (consider a history scrub or key rotation if this repo is ever made public).

### Next Session
**Slice 1 — New Supabase Project**
- Create a new Supabase project
- Define and apply the updated database schema
- Update `.env` with new project credentials
- Verify the app connects and authenticates correctly against the new project

---
