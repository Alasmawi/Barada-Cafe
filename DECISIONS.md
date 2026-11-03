# Decisions

Choices that aren't obvious from the code, and why they were made. [AUDIT.md](AUDIT.md) compares the
app with its requirements, and [docs/](docs/README.md) explains how it's built.

## Product

- **For any business.** Cafés, shops, gyms and so on post collabs; creators apply. A business is
  just a name and a colour: its type and area were removed on 2 Nov 2026.
- **One account per business,** named after it. A unique index enforces this, and migration 0003
  handed anything a second account had done to the first.
- **Collabs only.** Offers were removed because they behaved exactly like collabs and the two labels
  confused people. The `offer` field on a collab is still what the creator gets.
- **Plain statuses:** Applied, Invited, Accepted, Posted, Completed and Declined. In the code a
  `request` is an application or an invite, because "application" doesn't fit an invite.
- **Invites hold no spot.** Accepting one goes through the same guard as a business accepting, so
  more invites can go out than there are spots, and the first to accept get them.
- **Posts can say more.** About, who they're looking for and location are optional. AI doesn't fill
  them.
- **Socials are usernames, not links.** The app builds each link, so one can only go to the real
  site over https. There are five platforms, all optional.
- **The visit code stays.** It's how a business knows the person at the counter was accepted. Staff
  compare it by eye.

## Design

- **Cream and red, native on a phone.** Large titles, grouped lists, a tab bar with icons, sheets with
  a grabber, and installable to the home screen.
- **Ultra for titles, Archivo for text, JetBrains Mono for codes,** bundled so they need no network.
  The owner chose Ultra; the earlier font read as generic.
- **Squares are businesses, circles are creators.** That rule runs through every screen, so the two
  sides can't be confused. Each side has its own sign-up, tabs and words.
- **The board, as stickers.** Cards are neo-brutalist stickers: rounded, tinted in the business's
  colour, with an ink outline and a hard shadow that drops away when pressed. Live cards lean a
  little, and statuses are pill chips. Ended posts sit straight. A creator's completed collabs are
  pinned to a wall on their profile. The owner chose stickers over a hard-edged board (which kept the
  awnings) and a square raw poster; awnings and rubber stamps were dropped with it.
- **A card's lean comes from its id,** so the board looks pinned up but never moves on reload. With
  Reduce Motion on, everything sits straight.
- **Business identity is a colour and a mark.** Five curated colours, picked at sign-up, chosen so
  text on them stays readable.
- **A ring is drawn from tags, and nothing else.** One circle per tag, up to six. Formats carry evenly
  spaced dots, and the style sets the line weight. It all turns as one group, so the speed is the same,
  and the dots are what make the turning visible. Two creators with the same tags get the same ring.
- **AI is a sparkle icon.** It opens a sheet, so the form stays clear for people who don't use it.
  Skip is always there and cancels the request.
- **Motion stays quiet.** Screens ease in, lists arrive in sequence and controls answer touch. Only
  the rings loop, and Reduce Motion turns it all off.
- **The empty space is used.** Overview has stats, Ending soon and creators to invite; Profile has
  stats and the wall; wide screens use two columns.

## Accounts and the demo

- **Real accounts.** Sessions are random tokens, stored as hashes, in an `HttpOnly` cookie. Password
  hashing is deliberately light to fit the free plan's CPU limit, which is fine for a demo only.
- **Changing user clears the app's cached data,** so one person's screens can't appear for the next.
- **Signed-in people skip the login and sign-up screens.**
- **Accounts live in one sheet:** switching between demo accounts, preview states and log out.
- **Preview states show a banner,** so a simulated failure can't pass for a real one.
- **Reset is not for everyone.** It restores the sample data and removes every sign-up, so it needs
  the secret `DEMO_RESET_TOKEN` and isn't on any screen. Without the secret the endpoint answers 404.
- **Demo data is TypeScript, not a migration,** so its dates are written relative to today in Bahrain
  and the collabs never go stale. It seeds itself when the database is empty.

## API

- **`PUT /collabs/:id` replaces the whole collab.** The edit form always sends every field.
- **Validation errors are 422 `VALIDATION_FAILED`,** with a `fields` map for inline form errors.
- **An ended collab can be edited without moving its date,** so a typo can be fixed. A changed end
  date can't be in the past.
- **Accepting after the end date is blocked** with 409 `COLLAB_ENDED`, because the visit window has
  closed. Decline still works.
- **The same action twice is harmless.** A double tap on Apply or Accept returns the existing result.
- **The post link can be fixed** until the business marks it complete.
- **Security headers are set twice:** by Hono for the API and by `public/_headers` for static files.

## AI

- **The AI binding is local-only by default.** Remote bindings need a Cloudflare login, which would
  break the first run on a clean clone. `npm run dev:ai` opts in.
- **"This month" is resolved in code,** because models are unreliable at date arithmetic.
- **Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`,** which Cloudflare lists for JSON mode. Output
  can arrive as an object or a string, so both are handled.
- **The limits are in code:** 300-character sentence, 300 output tokens, 8-second timeout,
  businesses only. Fields containing `<` or `>` are dropped.
- **Summaries start as plain facts** from the database, so search costs no AI allowance. Only the
  facts reach the model, and answers with markup or links are dropped.
- **Picked for you: code chooses, AI explains.** Picks are open collabs matching the creator's tags,
  ranked by how many match, then the last spot, then the soonest end. The model only rewords the reason,
  once a day per creator. Answers under 20 characters, with links or markup are dropped, and failures
  are saved so the model isn't asked again that day. Collab text is written by businesses, so it reaches
  the model as data.
- **Vague sentences can still get a guessed spot count.** The business reviews every field before
  publishing.

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
| Accept: SELECT, then UPDATE | 5-of-2, two phones on the last spot, 20 repeated races |
| Spots edit: SELECT, then UPDATE | Spots reduction against accept |

Production doesn't depend on this timing, because the guard is a single statement.

## Tooling

- **`@cloudflare/vitest-plugin`,** the renamed successor of `vitest-pool-workers`, which supports
  Vitest 5.
- **TypeScript 5.9, not 7.** `typescript-eslint` doesn't support TypeScript 7 yet.
- **`CLOUDFLARE_ACCOUNT_ID` is a repository variable, not a secret.** GitHub can't read secrets in a
  job's `if`, and the id isn't sensitive. This lets CI skip the deploy cleanly until Cloudflare is set
  up.
- **Scripts name the database by its binding, `DB`,** not its Cloudflare name, so the database can
  be replaced without touching them.

## Open questions

The defaults in brackets are what's built.

1. Should a business be able to release a no-show's spot? (No)
2. Can a declined creator apply again? (No, one request per creator per collab)
3. Should creators see collabs that are already full? (Yes, marked Full)

## Next steps

- Per-device demo spaces, if several reviewers at once get in each other's way.
- A per-user limit on the AI draft, if the free daily allowance runs out during reviews.
