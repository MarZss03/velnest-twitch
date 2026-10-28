# VELNEST product brief

## One sentence

VELNEST turns a Twitch subscription into a visible place in the stream: subscribers enter a small shared world, choose a character, move and emote, while the streamer displays the world in OBS.

## MVP promise

During a live stream, a verified subscriber can open a link on desktop or phone, enter one channel room, pick one of three fixed avatars, move and trigger a small interaction; the same action appears in the OBS browser source with low perceived latency.

## Hackathon MVP

### In

- Twitch sign-in
- verification that the signed-in viewer subscribes to one configured broadcaster
- one Blender-built 3D lounge and one shared room
- three safe, modular humanoid identity bases: Riff, Arc, and Muse
- keyboard and touch movement
- presence, name label, movement, Wave/Cheer/Dance animations and event-driven 3D effects
- OBS-specific display mode
- reconnect and basic rate limiting
- broadcaster-only participant removal with a five-minute room timeout
- mock mode for judging without live Twitch credentials

### Out

- voice chat, physics, combat, trading, or persistent economy
- user-uploaded models or textures
- general-purpose world editor
- arbitrary public rooms
- purchases or paid items
- full Channel Points integration
- milestone-driven slot administration

Those are roadmap items, not Day 1 dependencies.

The original Day 1 2D-only constraint was superseded by the owner's request for Blender 3D characters, animation and a 3D room. The current implementation and DESIGN.md reflect that direction. Twitch OAuth and broadcaster moderation are implemented and tested against a simulated provider. Live Twitch account verification and the real streamer walkthrough remain unfinished.

## Roles

- **Subscriber:** signs in, passes entitlement check, selects an avatar, and controls it.
- **Streamer/admin:** connects the Twitch channel, opens the OBS overlay, and can remove a participant.
- **Viewer:** watches the world on stream but does not control an avatar in the MVP.

## Demo success criteria

1. Two browser tabs enter the same room with different identity bases.
2. Movement in either controller appears in both tabs within a fraction of a second locally.
3. A third tab using `?view=overlay` shows the world without controller UI.
4. The demo still works in mock mode if Twitch credentials fail or internet access is unavailable.

