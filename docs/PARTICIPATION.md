# Codex x TwitchCon Hackathon participation checklist

Last verified: **2026-10-27 (America/New_York)**

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
- Twitch browser session: authenticated as `meemokiller`
- Devpost: GitHub sign-in complete; required profile setup is open and waiting for owner choices
- Twitch Developer Console: waiting for authorization to view the account email before opening the console

## Local tools

- Git: installed
- Node.js: installed
- pnpm: installed; package store is on `D:\.pnpm-store`
- FFmpeg: installed
- GitHub CLI: downloaded/extracted under `D:\Apps\GitHubCLI`
- OBS Studio portable: `D:\Apps\OBS Studio Portable\bin\64bit\obs64.exe`
- downloaded installers/archives: `D:\Velnest - Twitch\downloads` (ignored by Git)

## Repository plan

The local repository is initialized in `D:\Velnest - Twitch`. Creating the remote repository is intentionally deferred until visibility is chosen:

- **public:** easiest for judging and testing;
- **private:** allowed, but `testing@devpost.com` must be granted access.

## Browser actions waiting for owner confirmation

1. Finish the Devpost profile with the owner's occupation and tech-employment answers, then join the hackathon.
2. Authorize Twitch Developer to view the email address of Twitch account `meemokiller`.
3. Create the Twitch Developer application and its persistent client credentials.
4. Create the GitHub remote after the owner chooses public or private visibility.

## Submission strategy

Use a browser-based overlay and Twitch OAuth/API path. Do not build a Twitch Extension for this deadline: the official FAQ warns Extension review can take 5–14 days, while overlays, API, chat, and EventSub are faster.

