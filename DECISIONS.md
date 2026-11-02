# Decisions

## Collab Board: the current design

This replaces the Finjan theme described in the older sections below.

- **Finjan is gone.** The name, cups, coffee wording, gold on night, animations and brand assets are
  all removed. It's now Collab Board, in cream and red.
- **Native on a phone.** Plus Jakarta Sans, bundled so it needs no network, with large titles, grouped lists, a tab bar with icons, sheets with
  a grabber, and installable to the home screen. No tilt, handwriting or decorative motion.
- **Squares are businesses, circles are creators.** That rule runs through every screen, so the two
  sides can't be confused. Each also has its own sign-up path, tabs and vocabulary.
- **Collabs and offers.** A post has a kind, and both follow the same flow: creators apply, and the
  business accepts. What separates them is only the label and the Browse filter, so far.
- **Word changes.** Collabs replaced briefs again, in the code too. Statuses are plain: Applied,
  Accepted, Posted, Completed and Declined.
- **Business identity is a colour and a mark.** Five curated pairs, picked at sign-up. Per-brand
  typefaces were dropped because mixed fonts were what made the app feel unlike a phone app.
- **Socials are usernames, not links.** The app builds each link, so one can only ever go to the
  real site over https. There are five platforms, all optional.
- **AI is a sparkle icon.** It opens a sheet, so the form stays clear for people who don't use it.
  Skip is still always there and cancels the request.
- **Posts can say more.** About, who they're looking for and location are optional, with higher
  limits on the offer and what to post. AI doesn't fill the new fields.
- **Motion stays quiet.** Screens ease in, lists arrive in sequence, and controls answer touch.
  Nothing loops except the rings, and Reduce Motion turns it all off.
- **Rings stay as specified,** with colours retuned for cream and heavier lines for small sizes.
- **The accepted animation, served animation and tilting pass are gone,** replaced by a code card
  and a plain confirmation.


Changes from [PLAN.md](PLAN.md), and choices it left open. The flags in PLAN §2.2 were built with
their listed defaults unless this file says otherwise.

## Tooling

- **`@cloudflare/vitest-plugin` instead of `@cloudflare/vitest-pool-workers`.** The plan named the
  older package, which is now deprecated and renamed. The new one also supports Vitest 5, so the
  plan's risk about being held on Vitest 4.1 no longer applies.
- **TypeScript 5.9, not 7.** `typescript-eslint` doesn't support TypeScript 7 yet.
- **`CLOUDFLARE_ACCOUNT_ID` is a repository variable, not a secret** (the plan said secret). GitHub
  can't read secrets in a job's `if`, and the id isn't sensitive. This lets CI skip the deploy
  cleanly until Cloudflare is set up.

## API

- **`PUT /collabs/:id` replaces the whole collab.** The edit form always sends every field.
- **Validation errors are 422 `VALIDATION_FAILED`,** with a `fields` map for inline form errors.
- **An ended collab can be edited without moving its date,** so a typo can be fixed. A changed end
  date can't be in the past.
- **`demo_meta` table added** to hold the "last reset" note from flag ⚑4.
- **Extra database check:** every status from accepted onwards must have a pass code.

## Creator screens

- **Pitch chips start a sentence** ("I film slow pours for…") instead of filling in a whole pitch
  as PLAN §6 suggested. A canned pitch would give every café the same line.
- **A failed refresh keeps the data on screen.** `ScreenState` only shows its error view when there
  is nothing to show. Otherwise a dropped refetch on café Wi-Fi would wipe a screen, and an open
  pitch with it.
- **The pitch sheet sits outside the action bar's branches,** so it survives the collab filling up
  mid-pitch and can say so.
- **An error boundary was added** so a crash shows a reload button, not a blank page.

## Signature moments

- **`CupStack` replaces the brand's `FinjanStack` in the app.** `FinjanStack` animates for one render
  only, so the refetch after an accept redrew the art and the cup never finished its move. `/brand`
  stays unchanged, and `CupStack` uses the same `stackSVG` art.
- **The served moment is a card over the inbox, not in place.** It doesn't block taps, so staff can
  keep working. It runs one 3.4s loop of the hazz, which repeats on its own otherwise.
- **After sending a pitch, the Brewing chip arrives in the action bar** with a link to My collabs.
  PLAN §7.2 had it fly to the tab, but the detail screen has no tab bar.
- **With Reduce Motion on,** the accepted moment is skipped and the pass stays flat. Every moment
  that plays once is remembered per device, and Reset demo clears that.

## AI draft

- **The AI binding is local-only by default.** Remote bindings need a Cloudflare login and a
  `workers.dev` subdomain, which would break the first run on a clean clone. `npm run dev:ai` opts in.
- **"This month" is resolved in code,** because models are unreliable at date arithmetic.
- **Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`,** which Cloudflare lists for JSON mode. Output
  can arrive as an object or a string, so both are handled.
- **The limits are in code:** 300-character sentence, 300 output tokens, 8s timeout, staff only.
  There is no per-user rate limit, so a public demo can use up the free daily allowance, after which
  the box falls back to the plain form.

## Voice

Finjan is a collab board first. Screens, navigation, actions and counts use plain words: collabs,
spots, pitches. This narrows PLAN §7.4: "Your menu", "Fully poured" and "Pouring…" read like a
café's menu, not a collab board. Coffee stays in the art, the tagline and the creator's status
labels from `brand/README.md`. Café staff see plain names in the inbox (New, Accepted, Declined).

## Testing the race

The local runtime gives the first request in a parallel batch a one-step head start: its UPDATE
lands before the others run their reads. Measured with the accept guard deliberately replaced by
"SELECT, then UPDATE":

| Scenario | Spots held |
|---|---|
| 2 spots, 3 to 5 creators | All of them (overbooked, so the test catches it) |
| 1 spot, 2 to 8 creators | 1 (looks correct, so the test can't catch it) |

So any race for a last spot passed even with a broken guard. The tests now fire an unrelated
"pacer" request first to absorb the head start. Every guard was then checked by breaking it:

| Broken guard | Tests that fail |
|---|---|
| Accept: SELECT, then UPDATE | 5-of-2, two staff on the last spot, 20 repeated races |
| Spots edit: SELECT, then UPDATE | Spots reduction against accept |

Production doesn't depend on this timing, because the guard is a single statement.
The risk it closes is a test that looks like proof and isn't.

## UX review

A pass over every screen, judged as a first-time user, changed these:

- **The feed shows your status on each collab,** so nobody pitches for one twice by accident.
- **The My collabs tab shows a badge when a pass is ready.** With no notifications in v1, this is how
  a creator learns they got in.
- **Every request says what happens next,** and the pass shows a four-step journey.
- **A pass stops asking to be shown once it's used.** The code steps back after the post is in.
- **No dead ends:** declined, full and ended screens all lead back to the feed.
- **The inbox hides empty tabs and opens on the first one with work in it.**
- **Welcome picks a side first,** so every person fits on one screen, and staff show their café.

## Smaller changes from the plan

- **No toasts.** Each result shows where the person is already looking, so they weren't needed.
- **The "Served posts" list is the inbox's Served tab,** which holds each post's link.
- **The unit tests share `test/shared.test.ts`** instead of having a file each.
- **Sheets lift above the keyboard** with `visualViewport`, because iOS leaves fixed elements behind
  it. This could only be checked on a real iPhone.

## Questions for Barada

From PLAN §2.3. The defaults in brackets are what's built.

1. Should a business be able to release a no-show's spot? (No)
2. Is one request per creator per collab right, or can a declined creator try again? (One)
3. Should creators see collabs that are already full? (Yes, on the wall)

## The Wall

- **The board is for any business,** so a business gets a house: a colour, a typeface and a seal.
  Cups stay as Finjan's symbol for spots. Foil cups no longer identify anyone.
- **Briefs replaced collabs everywhere,** including the code. `requests` keeps its name, because
  "application" doesn't fit an invite, and the word never appears on screen.
- **A ring is drawn from tags, and nothing else.** One perfect circle per tag, up to six. Niches are
  plain, formats carry evenly spaced dots, and the vibe sets the line weight. It all spins as one
  group, so the speed is the same. Two creators with the same tags get the same ring.
- **The dots are what show the spin.** A perfect circle looks the same at every angle. A format is
  required, which guarantees every ring has dots.
- **Real accounts replaced the `X-User-Id` header.** The brief allowed a faked login, but sign-up
  needs real ones. Sessions are random tokens, stored as hashes, in an `HttpOnly` cookie.
- **The schema in `0001_init.sql` was rewritten rather than migrated,** since nothing is deployed.
- **Invites hold no spot.** Accepting one goes through the same guard as staff accepting, so more
  invites can go out than there are spots, and the first to accept get them.
- **AI summaries are on demand, with facts as the default.** Every result starts with a plain line
  from the database, so search costs no AI allowance. Only the facts reach the model, and answers
  with markup or links are dropped.
- **"The feel we're after" was left out of briefs.** It was in the design, but no one asked for the
  field, and it would add to the post form.

## Deployment notes

- **The product is Finjan Board,** so the name says what it is. The logo stays Finjan, and the
  database keeps the name `finjan`.
- **The real model was checked on the live site.** Five sentences gave good drafts, a partial draft,
  a clean fallback for nonsense, and a blocked injection attempt. It first returned markup in a
  title, so draft fields containing `<` or `>` are now dropped.
- **Vague sentences can still get a guessed spot count,** as the model filled in 1 when none was
  given. The business reviews every field before publishing.

## Audit pass

- **Changing user clears the app's cached data,** so one person's screens can't appear for the next.
- **Reset demo keeps demo accounts logged in.** It only removes sessions and accounts that signed up,
  so one reviewer's reset doesn't log out the others.
- **Accounts live in one sheet.** Switching, preview states, reset and logout replaced the old demo
  menu, and a switch that fails says so.
- **Signed-in people skip the login and sign-up screens.**
- **Preview states show a banner,** so a simulated failure can't pass for a real one.
- **Security headers are set twice:** by Hono for the API and by `public/_headers` for static files.
- **Tablets get a wider column and desktops get a side rail,** so neither is a stretched phone.
- **Old wording came out late.** `Mark served`, `Pass` and `Served 2 collabs` survived the rename
  because no check reached them. The code still says `servedCount` and `passCode`, as these aren't
  shown to anyone.

[AUDIT.md](AUDIT.md) has the full comparison with the requirements.

## Next steps

- Say what an offer means in practice, if it should differ from a collab. It might skip applying
  or need no post in return.

- Per-device demo spaces (⚑4) if global reset gets in the way of several reviewers at once.
- A per-user limit on the AI draft, if the free daily allowance runs out during reviews.
- `POST /demo/reset` is open to anyone by design, so a page with no users can recover. That's fine
  for a demo and would have to go before real data exists.
