# VELNEST submission copy

Draft prepared October 28, 2026. Live Twitch authorization and the required YouTube demonstration are not yet complete. Do not treat this document as a submitted entry.

## Project name

VELNEST

## Elevator pitch

A shared 3D lounge for Twitch communities. Subscribers choose a modular character, hang out and react together, while the streamer brings their activity into OBS.

## Project story

### Inspiration

A Twitch community has familiar names, recurring jokes and shared moments. VELNEST gives those names a small place in the broadcast: a shared lounge where viewers can see one another, move around and react together.

### What it does

Subscribers choose one of three simple humanoid characters, Riff, Arc or Muse, and add headphones, a backpack or a lightstick. They can walk around furniture, wave, cheer, dance and reserve a sofa cushion. Reactions combine authored character animation with brief floor rings and confetti. The streamer displays the same room through an OBS Browser Source.

The room server owns movement, reactions and seat reservations. A broadcaster can remove a participant for five minutes; the timeout follows the verified Twitch identity across tabs, reconnects and fresh logins. Other viewers can continue watching.

### How it was built with Codex

Codex helped develop the TypeScript application, React controller, Three.js room, Fastify/Socket.IO server and shared interaction contracts. It also wrote Blender Python scripts for the lounge, three rigged characters, interchangeable props and six animation clips per character. The repository includes the editable Blender files and exported assets.

Design skills guided the visual direction, interaction details and browser review. HyperFrames was used for an editable 12-second motion study built from the actual 3D assets. That study is separate from the required live Twitch demonstration.

The Twitch integration uses server-side authorization-code OAuth, token validation and the Check User Subscription API. Browser cookies contain an opaque session identifier; tokens remain on the server. The broadcaster can enter without subscribing to their own channel.

### Challenges and lessons

Character motion needed to remain consistent with a shared room. Walking routes avoid furniture, seat claims are resolved on the server, and a late OBS connection receives the current room snapshot. Sitting uses an authored pose rather than a visual shortcut. Reduced-motion settings preserve meaningful state while suppressing celebration movement.

Separating the initial interface from the 3D renderer, self-hosting fonts and making offline status explicit improved the reliability of the experience. Tests cover actual exported animation clips, pathfinding, concurrent seat claims, authentication and moderation. Browser review also exposed and corrected confusing connection messages and mobile layout issues.

### Current status and next steps

The public repository runs locally in an explicitly labeled demo mode. OAuth and moderation have been exercised against a simulated Twitch provider; real Twitch authorization, subscriber verification and a live broadcast walkthrough remain to be completed. The final demonstration will show the room working on Twitch and how Codex was used. There is no claim that simulated tests establish live Twitch integration.

## Built with

TypeScript, React, Three.js, Blender, Node.js, Fastify, Socket.IO, Twitch API, OpenAI Codex, HyperFrames.

## Repository

https://github.com/MarZss03/velnest-twitch

## Codex session ID

01a17f64-abe4-7420-ac7d-ec774258d5a8

## Technology requirement

OpenAI Codex was used to build and revise the TypeScript application, React interface, Three.js renderer, Fastify/Socket.IO realtime server, Blender Python asset pipeline and automated verification. Blender supplies the editable 3D lounge, humanoid characters, modular props and animation clips. HyperFrames supplies a separate editable motion study. Twitch authorization uses server-side OAuth, token validation and the Check User Subscription API; an OBS Browser Source displays the shared room during a stream. Live Twitch authorization and the required broadcast demonstration are still pending; current authentication and moderation evidence uses a simulated Twitch provider.

## Streamer and community use

The streamer opens the room's OBS Browser Source and shares the controller link. A viewer signs in with Twitch, passes the configured channel's subscription check, chooses a character and accessory, then moves, reacts or sits with the community. The shared room appears in the broadcast. The broadcaster can manage participants without entering an avatar and can impose a five-minute room timeout. Non-subscribers can watch. A separate labeled demo mode lets judges inspect the shared interactions without supplying Twitch credentials.

## Still needed from the owner

Country of residence, personal learning/reuse survey answers, confirmation of the eligibility declarations, restored Twitch Developer login and final review of the completed entry. A genuine YouTube URL must be supplied after recording the project working on Twitch; no placeholder video URL should be entered.
