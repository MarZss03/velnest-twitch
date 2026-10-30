# VELNEST submission copy

Draft updated October 30, 2026. Real Twitch broadcaster authorization, OBS synchronization and the public Twitch demonstration are verified. A video is public on YouTube; a shorter, 179-second submission copy is prepared after the rules audit. Devpost final agreement and submission remain pending. See FINAL-SUBMISSION.md for the current video and entry status.

## Project name

VELNEST

## Elevator pitch

A shared 3D lounge for Twitch communities. Viewers sign in, choose a modular character, hang out and react together, while the streamer brings their activity into OBS.

## Project story

### Inspiration

A Twitch community has familiar names, recurring jokes and shared moments. VELNEST gives those names a small place in the broadcast: a shared lounge where viewers can see one another, move around and react together.

### What it does

Signed-in viewers choose one of three simple humanoid characters, Riff, Arc or Muse, and add headphones, a backpack or a lightstick. They can walk around furniture, wave, cheer, dance and reserve a lounge chair. Reactions combine authored character animation with brief floor rings and confetti. The streamer displays the same room through an OBS Browser Source.

The dark esports lounge combines violet/cyan neon, leather seating, plants and gaming equipment. Four CC0 furniture sources from Poly Haven have recorded licenses and checksums. Codex-authored Blender scripts assemble the editable set; the browser uses a 2.38 MB compressed model, self-hosted decoders, material reflections and restrained bloom.

The room server owns movement, reactions and seat reservations. A broadcaster can remove a participant for five minutes; the timeout follows the verified Twitch identity across tabs, reconnects and fresh logins. Other viewers can continue watching.

### How it was built with Codex

Codex helped develop the TypeScript application, React controller, Three.js room, Fastify/Socket.IO server and shared interaction contracts. It also wrote Blender Python scripts for the lounge, three rigged characters, interchangeable props and six animation clips per character. The repository includes the editable Blender files and exported assets.

Design skills guided the visual direction, interaction details and browser review. HyperFrames was used for an editable 12-second motion study built from the actual 3D assets. That study is separate from the required live Twitch demonstration.

The Twitch integration uses server-side authorization-code OAuth, token validation and the Get Users API. Open admission requests no additional scopes and lets every authenticated Twitch viewer join. Browser cookies contain an opaque session identifier; tokens remain on the server. Only the configured broadcaster can manage the room. An optional subscriber-only mode uses Check User Subscription for affiliate/partner channels.

### Challenges and lessons

Character motion needed to remain consistent with a shared room. Walking routes avoid furniture, seat claims are resolved on the server, and a late OBS connection receives the current room snapshot. Sitting uses an authored pose rather than a visual shortcut. Reduced-motion settings preserve meaningful state while suppressing celebration movement.

Separating the initial interface from the 3D renderer, self-hosting fonts and making offline status explicit improved the reliability of the experience. Tests cover actual exported animation clips, pathfinding, concurrent seat claims, authentication and moderation. Browser review also exposed and corrected confusing connection messages and mobile layout issues.

### Current status and next steps

The public repository offers an explicitly labeled demo mode. The broadcaster completed real Twitch authorization and demonstrated character entry, accessory changes, movement, reactions and lounge seating through OBS. An authorized public demonstration ran on meemokiller on October 29, 2026; the Twitch player visibly received the room and its live title. A 188-second local recording of that broadcast was saved and decoded successfully. All twelve QA suites pass locally and on Windows/Linux CI. Viewer admission and moderation also have simulated-provider coverage. A second real viewer account and a physical-phone walkthrough remain unverified.

## Built with

TypeScript, React, Three.js, Blender, Node.js, Fastify, Socket.IO, Twitch API, OpenAI Codex, HyperFrames.

## Repository

https://github.com/MarZss03/velnest-twitch

## Codex session ID

01a17f64-abe4-7420-ac7d-ec774258d5a8

## Technology requirement

OpenAI Codex was used to build and revise the TypeScript application, React interface, Three.js renderer, Fastify/Socket.IO realtime server, Blender Python asset pipeline and automated verification. Blender supplies the editable 3D lounge, humanoid characters, modular props and animation clips. HyperFrames supplies a separate editable motion study. Twitch authorization uses server-side OAuth, token validation and Get Users, with no additional scopes required for open viewer admission. Live broadcaster authorization and room interaction synchronized to the actual OBS Browser Source have been verified and locally recorded. An authorized public Twitch demonstration was completed on October 29, 2026, with the room verified in the actual Twitch player; viewer admission and moderation also have simulated-provider test coverage.

## Streamer and community use

The streamer opens the room's OBS Browser Source and shares the controller link. Any viewer signs in with Twitch, chooses a character and accessory, then moves, reacts or sits with the community; no channel subscription is required. The shared room appears in the broadcast. The broadcaster can manage participants without entering an avatar and can impose a five-minute room timeout. Anonymous viewers can watch. A separate labeled demo mode lets judges inspect the shared interactions without supplying Twitch credentials.

## Still needed from the owner

Personal answers and eligibility declarations, project description, gallery, source URL and Codex session ID are saved. The genuine YouTube URL is embedded in the project. Remaining: confirm publication of the 179-second submission copy, replace the embedded URL, and accept the final official-rules/Devpost agreement before clicking Submit project. No draft is described as submitted.
