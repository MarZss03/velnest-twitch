# Day 1 — foundation and vertical slice

Date: **2026-10-27**

## Goal

Prove the product's core feeling before integrating Twitch credentials: multiple subscribers represented by distinct characters in one live world, controllable from desktop or phone, visible through an OBS-friendly page.

## Checklist

- [x] Recover source-chat product decisions
- [x] Freeze hackathon MVP and non-goals
- [x] Choose a low-risk architecture
- [x] Create web, realtime server, and shared-contract workspaces
- [x] Define three modular, non-furry identity bases and shared cosmetic slots
- [x] Add realtime join/move/leave protocol
- [x] Add keyboard and touch controller UI
- [x] Add realtime wave, cheer, and dance actions
- [x] Add OBS overlay mode
- [x] Run the app and verify two controllers plus one overlay
- [x] Sign in to Devpost and create the hackathon project draft (the final entry is not submitted)
- [ ] Register a Twitch developer application (2FA and developer login are complete; the prepared application awaits confirmation)
- [ ] Record a 15–30 second proof clip once the vertical slice is verified

## End-of-day evidence

- `pnpm typecheck` passes
- `pnpm build` passes
- three-tab demo works, including late overlay joins and server reconnects
- one screenshot or short screen recording exists for the submission diary

## Day 2 entry condition

Do not begin cosmetics, world editing, or Channel Points until the vertical slice passes. Day 2 replaces mock identity with Twitch OAuth and subscriber entitlement while preserving mock mode as a demo fallback.

## Six-day runway

1. **Day 1:** realtime vertical slice and OBS view
2. **Day 2:** Twitch OAuth, session, subscription gate
3. **Day 3:** polish movement, reaction, reconnect, mobile control
4. **Day 4:** streamer admin basics, moderation, visual identity
5. **Day 5:** deployment, failure paths, demo script, metrics
6. **Day 6:** bug-only freeze, submission copy, 60–90 second video

