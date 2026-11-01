# Decisions

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

## Next steps

- Per-device demo spaces (⚑4) if global reset gets in the way of several reviewers at once.
- `POST /demo/reset` is open to anyone by design, so a page with no users can recover. That's fine
  for a demo and would have to go before real data exists.
