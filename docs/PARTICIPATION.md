# Codex x TwitchCon Hackathon participation checklist

Last project QA: **2026-10-29 (America/New_York)**. Account/form status below was last inspected October 28.

October 29 update: the night lounge renders in OBS and has a verified 27.5-second local recording on D:. Software x264 output was inspected after a missing-NVIDIA-encoder startup notice. OBS was later closed to release idle QA resources. The earlier Settings-page handoff below is historical. The complete twelve-suite QA passes; see [QA report](QA-2026-10-29.md). No public stream or final contest submission was made.

Current follow-up: OBS is connected to meemokiller. Devpost cover and three gallery images uploaded successfully; captions and project details are prepared in the open form. The required YouTube URL is still missing, so the details step is not confirmed saved. Graphics recovery passes a browser fixture test and twelve local QA suites; sustained recording and the public demonstration are next.

Official page: https://twitchcon-codex.devpost.com/  
Official rules: https://twitchcon-codex.devpost.com/rules  
Official resources: https://twitchcon-codex.devpost.com/resources

## Deadline

**2026-11-02 at 5:00 PM ET** (2:00 PM PT).

## Eligibility to confirm personally

- individual or team of individuals
- at least 18 or local age of majority, whichever is older
- not entering as a company/organization
- legal residence is not in an excluded jurisdiction; the rules specifically list Brazil, Quebec, Russia, Crimea, Cuba, Iran, North Korea, and other sanctioned/excluded jurisdictions

## Required submission package

- repository URL with all source, assets, and setup instructions
- English project description covering features and Codex use
- demo video under three minutes, publicly visible on YouTube (official rule rechecked October 29; the earlier unlisted option was incorrect)
- video must show the project working on Twitch and how Codex was used
- Codex session ID: `01a17f64-abe4-7420-ac7d-ec774258d5a8`

## Account status

- GitHub Codex connection: authenticated as `MarZss03`
- Twitch Developer login was restored by the owner and verified in the live console as `meemokiller` on October 28. With the owner's confirmation, **VELNEST Community Room** was created successfully. Twitch rejected the original `VELNEST TwitchCon 2026` name with “Invalid client name”; the community-room name was accepted.
- Devpost: authenticated as `MarZss03`; the **VELNEST** name, elevator pitch and additional-info answers are saved. The finalization page confirms **DRAFT, 3/5 steps done**. Submission ID `1268408`, project preview slug `velnest`. Final terms remain unchecked and Submit project has not been clicked.
- Twitch two-factor authentication: enabled
- Registered application: `VELNEST Community Room`, Website Integration, Confidential, callback `http://localhost:3001/auth/twitch/callback`. The owner saved the secret locally; client credentials were verified through Twitch's official token endpoint. The broadcaster's numeric ID was resolved through Get Users, real mode was configured in ignored `.env`, and the temporary setup app token was revoked. No credential was printed or committed. Creation proof: [screenshot](previews/twitch-app-created.png).
- Get Users reports the configured channel as standard (neither affiliate nor partner). The owner chose open admission: all authenticated Twitch viewers can join, with no subscription-data scope requested. Optional subscriber mode is retained for eligible channels. Thirteen authentication/moderation tests pass, including scope-free viewer entry, no subscription API calls, broadcaster-only moderation, timeout expiry and token revocation. The Windows launcher now resolves the existing bundled Node/pnpm after the owner reported pnpm missing from the desktop terminal PATH.

## Local tools

- Git: installed
- Node.js: installed
- pnpm: installed; package store is on `D:\.pnpm-store`
- FFmpeg: installed
- GitHub CLI: `D:\Apps\GitHubCLI\Program Files\GitHub CLI\gh.exe` (CLI itself is not signed in; Git Credential Manager successfully authenticated the repository push)
- OBS Studio portable: `D:\Apps\OBS Studio Portable\bin\64bit\obs64.exe`
- downloaded installers/archives: `D:\Velnest - Twitch\downloads` (ignored by Git)

## Repository

The existing public repository [MarZss03/velnest-twitch](https://github.com/MarZss03/velnest-twitch) was empty when inspected. The local `main` branch was pushed successfully and now tracks `origin/main`. GitHub's rendered page confirms the source folders, assets, README and the broadcaster-moderation commit `dde88a9`. No replacement repository was created.

Before the first push, tracked-file history names were checked for private configuration files and current tracked text was checked for common credential signatures: no matches. This limited check is not a comprehensive secret audit. `.env` remains ignored, and no live Twitch credentials were present in the project.

## Submission progress and remaining work

1. The Devpost name, pitch and additional-info step are saved. Project story and TypeScript/React tags have been entered in the details form, with a durable copy in [SUBMISSION.md](SUBMISSION.md), but that step is **not confirmed saved** because it requires a genuine demo video URL.
2. The owner supplied the country and both survey answers and confirmed all three eligibility declarations. These were saved with additional info; the resulting finalization page shows 3/5 steps complete. Personal answer backups and the progress screenshot remain under ignored downloads/private.
3. The confidential Twitch application and local real-mode credentials are configured. After the launcher PATH fix, owner startup succeeded: the frontend returns HTTP 200 and `/api/config` reports real mode, configured OAuth and signed-in admission. The owner approved Authorize and the live flow completed for `meemokiller`. Verified broadcaster entry, management controls, reactions, accessory changes and sofa seating were observed in the controller, separate overlay and actual OBS Browser Source. A second real viewer account remains untested. Credentials remain private.
4. Record the actual project working on Twitch and the Codex workflow, upload the maximum-three-minute demonstration to YouTube, then complete the Devpost video field. The existing 12-second motion study is not a substitute.
5. Upload project thumbnail/gallery images. The visible Choose files button successfully opened a chooser, but the extension rejected setFiles because local-file URL access was disabled. A native fallback was then stopped by the computer-use tool because it could not confidently determine the browser URL. No media upload is claimed complete. The owner can instead select the prepared screenshots manually in Devpost.
6. Review and finalize the entry. No final submission, eligibility declaration or binding agreement was submitted in this pass.

Draft editor: https://devpost.com/submit-to/31742-codex-x-twitchcon-hackathon/manage/submissions/1268408-velnest/project-overview

## Packaging and recording preparation

The single-host startup path and three automated hosting tests are implemented; see DEPLOYMENT.md. Standalone compiled-runtime smoke attempts were rejected by automatic approval, including the loopback-only attempt, with the sole reason `blocked by policy`. The owner has now started the separate two-port development workflow successfully after a launcher PATH fix; API and frontend responses were verified. This does not establish a standalone compiled-runtime walkthrough. START-VELNEST.cmd preserves existing .env configuration.

The 100–120-second English recording plan is in DEMO-RUNBOOK.md. It requires actual Twitch footage and Codex usage, with any unverified feature disclosed. A 57.2-second local rehearsal is saved at ignored downloads/recordings/2026-10-28 19-32-14.mp4 (1280×720, H.264, 30 fps; 42,978,125 bytes). The full clip decoded without errors and a sampled frame was visually reviewed; a private SHA-256 manifest is beside the clip. Desktop and microphone audio were muted. OBS has a 1920×1080 Browser Source named VELNEST Live Room and the recording folder is on D:. A D-drive launch shortcut explicitly sets the working directory and preserves the configured normal profile; a separate blank portable instance was closed. OBS is left on Settings → Stream → Twitch for owner account connection. No livestream or YouTube upload has been started.

## Submission strategy

Use a browser-based overlay and Twitch OAuth/API path. Do not build a Twitch Extension for this deadline: the official FAQ warns Extension review can take 5–14 days, while overlays, API, chat, and EventSub are faster.

