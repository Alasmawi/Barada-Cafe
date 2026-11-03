# Audit

How Collab Board compares with everything it was asked to do, as of 2 Nov 2026.

**40 requirements: 37 met, 1 partly met, 2 waiting on a design judgement.**

## Original brief

| # | Requirement | Status | Evidence |
|---|---|---|---|
| B1 | Two journeys in one small app: businesses and creators | Met | Full loop run on two simulated iPhones in Safari’s engine: post, apply, accept, code, link, complete |
| B2 | Post a collab: title, what’s offered, what to post, spots, end date | Met | test/collabs.test.ts; post form |
| B3 | See who applied, then accept or decline | Met | Applicants screen; test/transitions.test.ts |
| B4 | Creators browse on their phone | Met | Browse tab, checked at 320 to 390px |
| B5 | Apply with a one-line pitch | Met | 140 characters; test/collabs.test.ts |
| B6 | Creator gets accepted | Met | Status changes with a badge on Applications |
| B7 | Creator visits | Met | Accepted screen shows a code to show the business |
| B8 | Creator submits the link to their post | Met | https links only; Instagram and TikTok recognised |
| B9 | Business marks it done | Met | Mark complete on the Posted tab |
| R1 | Runs on Cloudflare’s free tier | Met | Workers, D1 and Workers AI only; limits checked on 1 Nov 2026 |
| R2 | Works on the live link, on reviewers’ own phones | Partial | Live since 2 Nov 2026. On 3 Nov the live site passed 33 checks in Safari’s engine (WebKit) on iPhone SE, 15 and 15 Pro Max. The sticker design isn’t deployed yet, and no real phone has opened it |
| R3 | Mobile first, feels good on an iPhone at 360px | Met | 300 screen checks with no sideways scroll, plus 36 WebKit iPhone checks with touch: no iOS input zoom, tap targets of 40px or more, bottom bars in view, and a tap-through apply flow (npm run test:webkit) |
| R4 | Login can be faked | Exceeded | Real accounts replaced the fake login |
| R5 | Never more creators than spots, with a test | Met | One-statement guard; tests fail when the guard is deliberately broken |
| R6 | Every screen has empty, loading and error states | Met | Shared state component; checked per screen in test-ui/smoke.mjs |
| R7 | Looks like its own product | Review | A design judgement, for Design to sign off |
| X1 | Bonus: one sentence fills the post form, edited before publishing | Met | Tested against the real model on the live site |
| X2 | If AI fails, the business is never stuck | Met | 8-second timeout, Skip always visible; test/ai-draft.test.ts |
| V1 | Reads like a pull request: structure, tests, handover | Met | README, DECISIONS and docs/ in place. CI ran green on GitHub on 3 Nov 2026: install, check and build |

## Added during the build

| # | Requirement | Status | Evidence |
|---|---|---|---|
| U1 | For any business, not only cafés | Met | A business is a name and a colour, so any kind can sign up; five in the demo data |
| U2 | Sign-up for businesses and creators | Met | Separate paths; test/auth.test.ts |
| U3 | A different home for each side | Met | Separate tabs and home screens |
| U4 | Each brand and creator has an identity | Met | Square brand marks; round rings |
| U5 | Rings are symmetrical, one per tag, same speed | Met | test/shared.test.ts; a single spin of 18 seconds |
| U6 | Businesses can search creators | Met | test/creators.test.ts |
| U7 | AI summaries of creators | Met | Real model checked live; plain facts if AI is unavailable |
| U8 | Invites that creators accept | Met | test/invites.test.ts, including the last-spot race |
| U9 | A clear difference between collabs and offers | Met | Offers removed by decision on 2 Nov 2026, so every post is a collab |
| U10 | Cream and red, no coffee theme | Met | Theme and brand assets removed |
| U11 | Creators can add their socials | Met | test/socials.test.ts |
| U12 | Posts hold more information | Met | Three optional fields and larger text boxes |
| U13 | AI is an icon | Met | Sparkle icon on the post form and creator cards |
| U14 | Shadows, animation and response to touch | Met | Reduce Motion turns the motion off |
| U15 | Responsive across sizes | Met | Checked at 320, 360, 390, 768 and 1280px |
| U16 | Clear login and account switching | Met | New welcome screen; one-tap switching from the account sheet |
| U17 | One account per business | Met | Unique database index; test/auth.test.ts |
| U18 | A font that doesn’t feel generic | Review | Ultra titles chosen by the owner, with Archivo text. For Design to confirm |
| U19 | Use the empty space | Met | Fuller Overview and Profile; two columns on wide screens |
| U20 | A pattern that gives the board character | Met | Neo-brutalist sticker cards tinted in each business’s colour, tilted cards, status chips and a profile wall, chosen by the owner |
| U21 | AI recommendations for creators | Met | Picked for you: code picks collabs by tag, AI rewords the reason once a day; test/picks.test.ts and the real model checked locally. Waits on the next deploy |

## Problems the audit found and fixed

| Problem | Fix |
|---|---|
| Switching accounts kept the last person’s data in memory | The cache now clears on every change of user |
| Reset demo logged every reviewer out | Demo accounts now stay logged in |
| Signed-in users could reach the login page | They now go straight to their home |
| A failed demo login did nothing | It now explains what happened |
| Form errors could sit off-screen | The screen now scrolls to the first problem |
| A preview state could look like a real outage | A banner now says so, with a Turn off button |
| No security headers | Added to the API and to every page |
| A blank screen while checking login | A loading screen now shows instead |
| Tablet and desktop were a stretched phone | They now have their own layouts |
| A business button still said Mark served, and summaries said Served | Both now say complete, the word used everywhere else |
| Creator sign-up started with Coffee selected | It now starts with Food |
| Ended posts still showed new applicants | The badge now shows only on live posts |
| Suggestion chips were cut off at the edge of the Apply sheet | The row now fades out, so it reads as scrollable |
| Demo codes still started FJ-, from the old Finjan name | They now start CB-, like every new code |

## Each department’s view

### Product

Does it do what was asked?

- Run the two-minute demo in the README
- Answer the three open questions in DECISIONS.md

### Design

Is it clear, and does it feel like its own product?

- Check that squares and circles tell the two sides apart
- Check the board: sticker cards, tilt, status chips and the profile wall
- Open Preview in the account sheet to see empty, slow and error states
- Sign off R7, which is a judgement call

### Engineering

Could someone else pick this up?

- Read docs/ for the product, architecture, API and operations, then DECISIONS.md for the reasons
- Run npm run check (265 tests) and npm run test:ui
- Start with test/concurrency.test.ts and the spot guard

### QA

Can it be broken?

- Accept the last spot on one account from two phones at once
- Double-tap every primary button
- Try the app offline, and on a real iPhone and Android phone

### Security

Is it safe for what it is?

- Passwords are hashed, sessions are HttpOnly cookies, and only hashes of tokens are stored
- Every action is checked on the server, by role and ownership
- Review the accepted risks below before any real use

### Legal and privacy

Is it fit to hold people’s details?

- It stores usernames, names, socials and pitches
- Creator names, tags and bios, and businesses’ draft sentences, go to Cloudflare’s AI service
- There’s no privacy policy, terms, or account deletion yet

## Missing

Not in any requirement, but expected by people using it.

| Gap | Why it matters |
|---|---|
| Tested on a real phone | Every check so far ran in Chrome and WebKit on one Mac. Reviewers will open it on their own phones, where safe areas and installing to the home screen can only be checked by hand. |
| Deploying from CI | CI runs the checks, but deploys are still run by hand until CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN are set in the repository. |
| Businesses can see a creator’s wall | Before inviting or accepting, a business sees only the ring, tags and a summary, not the creator’s completed collabs. |
| Editing a profile after sign-up | A business can’t change its name or colour. A creator can change socials, but not tags or their line. |
| Closing a post early | A business can only move the end date. There’s no Close or Delete. |
| Withdrawing an application | A creator who applied by mistake can’t take it back. |
| Checking the visit code | Staff compare the code by eye. The app doesn’t confirm it. |
| Account deletion, privacy policy and terms | Needed before real people’s details are stored. |
| An accessibility review | Tilted sticker cards and status chips are new, and need a contrast and screen reader pass. |
| Answers to the three open questions | Releasing a no-show’s spot, re-applying after a decline, and showing full posts. The defaults are built. |

## Reviewed and kept

The owner reviewed these on 2 Nov 2026 and kept them.

| Feature | What it does | Note |
|---|---|---|
| Preview states | The account sheet can fake slow, empty and failing screens, with a banner. | A reviewer’s tool; remove before real use |
| Demo accounts and switching | One-tap logins as any demo business or creator. | For the demo |
| Visit code | A code like CB-7K3Q shown at the business. | How a business knows the person at the counter was accepted |
| Four-step tracker | Applied, Accepted, Posted, Completed on the Application screen. | Overlaps the stamp and the next-step line |
| Creator handle | A separate @handle at sign-up. | Overlaps the socials usernames |
| Creator style | Calm, Playful or Bold, which only sets the ring’s line weight. | Gives each ring its line weight |
| AI creator summaries | A sparkle on each creator writes a short summary. | You asked for this. The plain fact line already covers the basics |
| Spinning rings | Rings turn slowly on Profile and creator cards. | Decorative; stops with Reduce Motion |
| Pull to refresh | Drag down to reload a list. | Lists also refresh on their own |
| Offline banner | A bar when the phone loses connection. | Cheap and helpful |
| Install to home screen | Icons and a manifest so it opens like an app. | Cheap |
| Touch ripple | A ripple under the finger on buttons and rows. | Stops with Reduce Motion |
| Editing the post link | A creator can fix the link until it’s marked complete. | Typos happen |

## Removed by decision

Chosen by the owner on 2 Nov 2026.

| Feature | What changed |
|---|---|
| Reset demo for everyone | The button is gone. Resetting needs the secret DEMO_RESET_TOKEN, and without it the endpoint answers 404 |
| Business type and area | Gone from sign-up, cards and banners. Migration 0004 drops both columns |
| Old Finjan material | PLAN.md deleted, DECISIONS.md rewritten to what’s still true, scripts no longer name the old database |

## How it’s built

[docs/](docs/README.md) has the product, architecture, API, design and operations, with diagrams.

## Still open

### Must do before review

- Try it on a real iPhone and an Android phone. Nothing has been tested on a physical device.
- Push to GitHub so CI runs for the first time. Until then, automated checks have only run on one Mac.

### Accepted for a demo, not for real users

- Password hashing is deliberately light, to fit the free plan’s CPU limit.
- There’s no password reset, email, or limit on login attempts.
- Whoever holds the reset secret can remove everyone who signed up.
- On a vague sentence, AI can guess spots or a date. The business reviews every field before publishing.

### Not built, by design

- Notifications, image uploads, payments and an Arabic interface. The layout is ready for right-to-left text.
