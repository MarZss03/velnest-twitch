# Codex x TwitchCon Hackathon participation checklist

Last verified: **2026-10-28 (America/New_York)**

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
- demo video under three minutes, public or unlisted on YouTube
- video must show the project working on Twitch and how Codex was used
- Codex session ID: `01a17f64-abe4-7420-ac7d-ec774258d5a8`

## Account status

- GitHub Codex connection: authenticated as `MarZss03`
- Twitch Developer login was restored by the owner and verified in the live console as `meemokiller` on October 28. With the owner's confirmation, **VELNEST Community Room** was created successfully. Twitch rejected the original `VELNEST TwitchCon 2026` name with “Invalid client name”; the community-room name was accepted.
- Devpost: authenticated as `MarZss03`; the **VELNEST** name, elevator pitch and additional-info answers are saved. The finalization page confirms **DRAFT, 3/5 steps done**. Submission ID `1268408`, project preview slug `velnest`. Final terms remain unchecked and Submit project has not been clicked.
- Twitch two-factor authentication: enabled
- Registered application: `VELNEST Community Room`, Website Integration, Confidential, callback `http://localhost:3001/auth/twitch/callback`. The owner saved the secret locally; client credentials were verified through Twitch's official token endpoint. The broadcaster's numeric ID was resolved through Get Users, real mode was configured in ignored `.env`, and the temporary setup app token was revoked. No credential was printed or committed. Creation proof: [screenshot](previews/twitch-app-created.png).
- Get Users reports the configured channel as standard (neither affiliate nor partner). The subscriber-check path cannot be verified against this channel's subscriptions. The broadcaster's own-entry path remains available; the owner has been asked whether to keep subscriber-only admission or allow all signed-in Twitch viewers. No admission policy has been changed yet.

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
3. The confidential Twitch application and local real-mode credentials are configured. Await owner startup, complete live user authorization and verify the broadcaster's entry. The latest local API probe still returned connection refused. The registered callback and server credentials must be handled without exposing the secret in chat or Git history.
4. Record the actual project working on Twitch and the Codex workflow, upload the maximum-three-minute demonstration to YouTube, then complete the Devpost video field. The existing 12-second motion study is not a substitute.
5. Upload project thumbnail/gallery images. The visible Choose files button successfully opened a chooser, but the extension rejected setFiles because local-file URL access was disabled. A native fallback was then stopped by the computer-use tool because it could not confidently determine the browser URL. No media upload is claimed complete. The owner can instead select the prepared screenshots manually in Devpost.
6. Review and finalize the entry. No final submission, eligibility declaration or binding agreement was submitted in this pass.

Draft editor: https://devpost.com/submit-to/31742-codex-x-twitchcon-hackathon/manage/submissions/1268408-velnest/project-overview

## Packaging and recording preparation

The single-host startup path and three automated hosting tests are implemented; see DEPLOYMENT.md. Standalone runtime/browser smoke attempts were rejected by automatic approval, including the loopback-only attempt, with the sole reason `blocked by policy`. The previous local API was also not listening when checked, so a running local service is not currently assumed. START-VELNEST.cmd provides an owner-run development launcher and preserves existing .env configuration.

The 100–120-second English recording plan is in DEMO-RUNBOOK.md. It requires actual Twitch footage and Codex usage, with any unverified feature disclosed. No livestream or YouTube upload has been started.

## Submission strategy

Use a browser-based overlay and Twitch OAuth/API path. Do not build a Twitch Extension for this deadline: the official FAQ warns Extension review can take 5–14 days, while overlays, API, chat, and EventSub are faster.

