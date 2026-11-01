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
- **Signature moments wait for Phase 5:** the pass tilt, the accepted and hazz animations, and the
  pitch folding into a chip. The screens use the static art until then.

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
