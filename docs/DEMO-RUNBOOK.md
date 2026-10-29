# VELNEST contest demonstration

Target: 100–120 seconds, in English. This is a recording plan, not a completed video. The existing 12-second Blender/HyperFrames study is optional presentation material and does not replace actual Twitch footage.

Official requirements: https://twitchcon-codex.devpost.com/rules. The demonstration must show the project functioning on Twitch and how Codex was used, and remain under three minutes for complete review.

## Before recording

1. The developer application and broadcaster OAuth flow were verified October 28. Start the configured app and check the returned identity before recording; credentials stay in the ignored `.env`. Open admission is enabled, so viewers do not need a subscription.
2. If demonstrating subscriber admission, use a real subscriber to an affiliate/partner channel and verify the result. The Twitch Check User Subscription endpoint requires an affiliate/partner broadcaster. Do not stage a simulated response as real entitlement.
3. Open the controller, a second authorized controller if available, and the OBS Browser Source. Use 1920×1080 for the source; copy the URL shown by the controller.
4. In OBS, capture the room and the selected application windows only. Keep developer-secret fields, account settings and unrelated personal pages out of the capture. Use no unlicensed music.
5. Record a local rehearsal first. The owner decides when to go live; no stream or video has been published by this plan.

## Shot order and narration

| Time | Actual footage | English narration draft |
|---|---|---|
| 0–10 s | Working room visible in the Twitch broadcast/player | “VELNEST gives a Twitch community a shared place in the stream: a small 3D lounge where familiar names become characters.” |
| 10–25 s | Real Twitch sign-in and returned identity; no token/secret screens | “Viewers use their Twitch identity. The server checks access for the configured channel, while the broadcaster can enter their own room.” Only say this over verified footage. |
| 25–50 s | Character choice, accessory change, walking around furniture, Wave/Cheer/Dance | “Riff, Arc and Muse share one accessory system. Movement and reactions are synchronized between the controllers and the OBS view.” |
| 50–65 s | Reserve chair, walk to it, sit, stand | “Seats are reserved on the server, so two viewers cannot claim the same chair. The character walks into the authored sitting pose.” |
| 65–80 s | Broadcaster removal with confirmation, observer state updating | “The broadcaster can remove a participant for five minutes. The room timeout follows their verified identity across reconnects.” Use only an authorized test account. |
| 80–105 s | Codex prompt, actual implementation/diff and test output; Blender source and pose board | “Codex helped build the React and Three.js client, the realtime server and the Blender asset scripts. The editable sources include six animation clips and reusable props, with automated checks for movement, access, seating and cosmetic attachment.” |
| 105–120 s | Return to Twitch footage; show source repository | “The project includes a labeled demo mode for judging. Source code, assets and setup instructions are available in the repository.” |

## Acceptance before upload

- The Twitch segment is an actual broadcast/player, not only the local overlay page.
- Real-mode claims match the accounts and checks actually demonstrated. State any unverified feature honestly.
- The Codex segment shows real project work, not only a logo or title card.
- No private credentials or unrelated personal information appear.
- Exported video duration is below three minutes and the English explanation is legible/audible.
- Upload to the owner's YouTube account as publicly visible, verify playback, and use that genuine URL in Devpost. The official rules require public visibility; unlisted is not the documented requirement.

No YouTube URL should be inserted until that recording exists and has been checked. The Devpost project remains a draft until the owner reviews eligibility declarations and the final submission.
