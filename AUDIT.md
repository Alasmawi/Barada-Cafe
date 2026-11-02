# Audit

How Collab Board compares with everything it was asked to do, as of 2 Nov 2026.

**38 requirements: 33 met, 3 partly met, 2 waiting on a design judgement.**

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
| R2 | Works on the live link, on reviewers’ own phones | Partial | Deployed on 2 Nov 2026. Accounts, offers and font changes wait on the next deploy. Not yet tried on a real phone |
| R3 | Mobile first, feels good on an iPhone at 360px | Partial | 300 screen checks with no sideways scroll. Real iPhone still needed |
| R4 | Login can be faked | Exceeded | Real accounts replaced the fake login |
| R5 | Never more creators than spots, with a test | Met | One-statement guard; tests fail when the guard is deliberately broken |
| R6 | Every screen has empty, loading and error states | Met | Shared state component; checked per screen in test-ui/smoke.mjs |
| R7 | Looks like its own product | Review | A design judgement, for Design to sign off |
| X1 | Bonus: one sentence fills the post form, edited before publishing | Met | Tested against the real model on the live site |
| X2 | If AI fails, the business is never stuck | Met | 8-second timeout, Skip always visible; test/ai-draft.test.ts |
| V1 | Reads like a pull request: structure, tests, handover | Partial | README and DECISIONS are in place. CI has never run, because nothing is pushed |

## Added during the build

| # | Requirement | Status | Evidence |
|---|---|---|---|
| U1 | For any business, not only cafés | Met | Six business types at sign-up; four in the demo data |
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

## Each department’s view

### Product

Does it do what was asked?

- Run the two-minute demo in the README
- Answer the three open questions in DECISIONS.md

### Design

Is it clear, and does it feel like its own product?

- Check that squares and circles tell the two sides apart
- Open Preview in the account sheet to see empty, slow and error states
- Sign off R7, which is a judgement call

### Engineering

Could someone else pick this up?

- Read PLAN.md, then DECISIONS.md, which overrides it
- Run npm run check (249 tests) and npm run test:ui
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

## Still open

### Must do before review

- Try it on a real iPhone and an Android phone. Nothing has been tested on a physical device.
- Push to GitHub so CI runs for the first time. Until then, automated checks have only run on one Mac.

### Accepted for a demo, not for real users

- Password hashing is deliberately light, to fit the free plan’s CPU limit.
- There’s no password reset, email, or limit on login attempts.
- Anyone can use Reset demo, which removes everyone who signed up.
- On a vague sentence, AI can guess spots or a date. The business reviews every field before publishing.

### Not built, by design

- Notifications, image uploads, payments and an Arabic interface. The layout is ready for right-to-left text.
