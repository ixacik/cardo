# Study Scheduler Parity Spec

## Goal
Implement Anki-style queue semantics on top of `ts-fsrs` while keeping one primary `Study Now` flow.

## Queue lanes and priority
Queue is deterministic and composed per deck scope (`all` or specific deck):
1. `learning_intraday` (learning/relearning cards due now, due timestamp on local day)
2. `learning_interday` (learning/relearning cards due now, due before local day start)
3. `review` (review cards due now)
4. `new` (new cards)

Custom Study can add:
1. `forgotten` (cards with lapses > 0)
2. `ahead` (review cards not yet due)

Custom lanes are appended after due learning, before `new`.

## Candidate filtering
A card is eligible only if:
- in selected deck scope
- not suspended
- not buried for current local day (`buriedUntilDay` >= current local day means excluded)

## Daily limits
Per deck and local day:
- `newPerDay`
- `reviewPerDay`
- plus today-only deltas (`customNewDelta`, `customReviewDelta`)

Effective limits:
- `effectiveNewLimit = max(0, newPerDay + customNewDelta)`
- `effectiveReviewLimit = max(0, reviewPerDay + customReviewDelta)`

Counters are persisted in `DailyDeckState`:
- `newShown`
- `reviewShown`

Admission rule:
- learning lanes ignore daily limits
- `review` and `ahead` consume review budget
- `new` consumes new budget

## Bury siblings
If `burySiblings` is true:
- when a note is admitted in `review`/`new`/`forgotten`/`ahead`, siblings from same note are skipped for this queue build
- learning lanes are not blocked by sibling burying

## Session behavior
- `Study Now` has no explicit mode selection.
- Queue is rebuilt after each grade using current cards + current daily counters.
- Grading increments daily counters based on served lane:
  - `new` lane -> `newShown += 1`
  - `review`/`forgotten`/`ahead` lane -> `reviewShown += 1`
- Pending learning cards are promoted automatically when due (timer-driven refresh).
- Session ends when queue empty and no pending learning cards have future due timestamps.

## Day rollover
Local-day key is `YYYY-MM-DD` in device local time.
At rollover, a new `DailyDeckState` row is used (counters reset).

## Defaults (Anki-aligned baseline)
- `newPerDay = 20`
- `reviewPerDay = 200`
- `newOrder = insertion`
- `reviewOrder = due`
- `burySiblings = true`
- `learningSteps = [1, 10]` (minutes)
- `relearningSteps = [10]` (minutes)
- `maxInterval = 36500`
- `desiredRetention = 0.9`
- `easyBonus = 1.3`
- `intervalModifier = 1.0`

## Invariants
- queue output is deterministic for same input state and time
- limit counters are monotonic within a day
- cards never appear if suspended/buried
- no card id duplication inside one queue build
