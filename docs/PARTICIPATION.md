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
- Twitch Developer login currently displays the username/password screen. The owner must restore the session and complete 2FA; do not assume the prior `meemokiller` session remains active.
- Devpost: authenticated as `MarZss03`; an existing project draft is now named **VELNEST** with its elevator pitch saved. A fresh overview load confirms **DRAFT, 2/5 steps done**. Submission ID `1268408`, project preview slug `velnest`.
- Twitch two-factor authentication: enabled
- Twitch Developer Console: requires a fresh login after 2FA logged out the previous developer session; application form can then be recreated

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

1. The Devpost name and pitch are saved. Project story, repository link, TypeScript/React tags and technical additional-info answers have been entered in the open forms, with a durable copy in [SUBMISSION.md](SUBMISSION.md). Those later steps are **not confirmed saved**: the details form requires a genuine demo video URL, and additional info still needs personal answers and eligibility declarations.
2. The owner must supply country of residence and personal learning/Codex-reuse survey answers. Do not infer these from language, timezone or project activity. The owner must review eligibility declarations and any binding agreement at the actual submission step.
3. Restore the Twitch Developer session, create/configure the confidential website application and complete live account authorization. A login handoff page is open in Chrome.
4. Record the actual project working on Twitch and the Codex workflow, upload the maximum-three-minute demonstration to YouTube, then complete the Devpost video field. The existing 12-second motion study is not a substitute.
5. Upload project thumbnail/gallery images. An attempted Chrome file-chooser flow timed out before any files were selected; no media upload is claimed complete.
6. Review and finalize the entry. No final submission, eligibility declaration or binding agreement was submitted in this pass.

Draft editor: https://devpost.com/submit-to/31742-codex-x-twitchcon-hackathon/manage/submissions/1268408-velnest/project-overview

## Submission strategy

Use a browser-based overlay and Twitch OAuth/API path. Do not build a Twitch Extension for this deadline: the official FAQ warns Extension review can take 5–14 days, while overlays, API, chat, and EventSub are faster.

