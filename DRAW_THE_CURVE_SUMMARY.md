# Draw the Curve — project summary

A daily browser game: players sketch how they think a real-world statistic
changed over time, then reveal the actual data and get scored on how close
their shape and levels were. Built standalone first, then ported into an
existing Next.js arcade (`songless_bois`) as a first-party game.

This doc is a portable record of what was built and why, meant to be dropped
into a new project's context rather than re-deriving decisions from scratch.

---

## 1. The core idea and scoring model

**The problem with naive scoring**: averaging the distance between the
player's guessed line and the real data at each point over-rewards a flat,
hedged line drawn through the middle of the range. It doesn't distinguish
someone who understood the trend from someone who guessed the average and
stayed there.

**The fix — a blended, two-component score (50/50)**:

- **Magnitude (50%)** — at every real data point, take the normalized
  vertical distance between the guess and the truth (`|Δ| / axis range`),
  average it, then invert through a softened curve
  (`1 − (err × 2.4)^1.35`) so a 10%-off guess scores meaningfully better
  than a 30%-off one, without being linear.
- **Shape (50%)** — ignore height entirely. For each interval between
  consecutive real data points, check whether the guess moved the same
  direction (up/down/flat, with a small dead zone for "flat"). Full credit
  for a match, half credit if one side is flat, zero for a reversal. Each
  segment's credit is weighted by how steep the *real* segment was, so a
  dramatic real move matters more than noise — but every segment keeps a
  small floor weight so a genuine plateau still counts for something.

Verified with unit tests (a perfect trace scores ~100; a flat hedge through
the middle scores ~40; a right-shaped-but-20-points-low guess beats the flat
hedge decisively; an inverted curve scores near 0).

**Verdict generator**: rather than generic praise, it picks the single most
informative true thing to say — a reversed segment if one exists (named with
the year range and direction), otherwise a systematic bias (consistently too
high/low) or the worst third of the curve (start/middle/end) — so feedback
reads as specific, not templated.

## 2. The reveal — what it shows and why it changed

Went through three iterations based on feedback:

1. **Staged mathematical audit** (v1): four steps the player clicks through
   — real curve draws in, then residual bars + a shaded error ribbon appear
   with the arithmetic printed beside it, then a green/red direction-match
   bar strip under the axis, then the final score breakdown. This matched an
   early request for something "quite mathematical."
2. **Simplified** (v2): the user found the staged walkthrough and math panel
   too descriptive. Replaced with: a score count-up animation immediately
   after Reveal, then a single view showing the real curve drawing in over
   the chart — no stages, no math panel, no residual table.
3. **Removed the direction-match bar entirely** (v3): the user found the
   green/red bar strip under the axis confusing. Replaced with **per-segment
   mismatch shading**: the region between the guess and real lines is filled
   with small colored quads — blue-tinted (matching the guess line's color)
   where the guess sat above the real value, orange-tinted (matching the
   real line's color) where it sat below — with opacity scaling by how large
   the error was at that stretch. This reuses the two colors already in the
   chart's legend, so there's no new color language to learn, and it
   visually answers both "which way did I miss" and "how badly" at once.

## 3. Data pipeline — curation over automation

Explicit design position: **curation is a human-in-the-loop step, not a
fully automated pipeline.** The brief called for this directly ("plan for a
human-in-the-loop step before a question goes live, not a fully automatic
pipeline").

- `tools/catalog.mjs` — a hand-maintained list of ~20 Our World in Data
  chart slugs, each with a hand-written prompt, unit, category, difficulty,
  and an editorial note on why the shape is interesting. This file is meant
  to be edited by a person, not generated.
- `tools/fetch-owid.mjs` — pulls each catalog entry's CSV from OWID
  (`https://ourworldindata.org/grapher/<slug>.csv`), normalizes it into the
  question schema, and flags weak candidates (`LOW TRAVEL`, `NO TURNS`,
  `FEW POINTS`) for a human to judge. Two real data bugs were caught and
  fixed here:
  - OWID appends metadata columns (`Population`, `World region according
    to OWID`) *after* the value column — naively taking "the last column"
    silently grabs a population count or region name instead of the real
    value. Fixed by explicitly excluding known metadata column names.
  - Some series carry projections past the current year (e.g. poverty data
    running to 2026) — asking a player to sketch a forecast is a different
    game, so the fetcher truncates at the real current year.
- `tools/review.mjs` — renders each candidate as an ASCII sparkline with its
  diagnostics, lets a human `--approve <id>` or `--reject <id> --reason
  "..."`, and only `--build`s the live queue once every candidate has been
  reviewed (refuses to run otherwise). Approved puzzles are ordered for
  variety: no two of the same category back-to-back, difficulty cycling
  easy → medium → hard → medium.
- Final queue: 18 approved puzzles (2 of the ~20 fetched were rejected —
  one for too few data points to score shape meaningfully, one for having
  no real turn in the curve).

## 4. Two build phases

### Phase 1 — standalone prototype
Vanilla TypeScript + Vite, SVG-based drawing surface, zero backend. Chosen
because the brief allowed "static SPA, deterministic date index" — no
server needed for a same-puzzle-for-everyone daily game; the day's puzzle is
just `floor((now − epoch) / 86400000) % queue.length` computed identically
on every client. Puzzle data ships XOR+base64 obfuscated in the client
bundle (not real security — just stops casual devtools spoiler-peeking).

Key engineering points:
- **Drawing capture**: the sketch is stored as one y-value per x-slot on a
  fixed-resolution grid (not raw pointer events), so a fast drag naturally
  overwrites earlier points if the player draws back over an x they've
  already covered, and interpolation fills every slot a fast flick skips
  over — the line is always a true function of x.
- **Validation before reveal**: requires ~92% x-axis coverage and no gap
  larger than ~6% of the width, with a specific inline message (not a
  silent block) telling the player what's missing.
- **Replay protection**: first score for a calendar day is permanent
  (localStorage), and the exact drawn line is compressed (64 samples, one
  base64 char each) so a reload redraws the same sketch rather than
  offering a fresh attempt — the *stored* score is authoritative on
  revisit, since re-scoring the lossy compressed line can drift a point or
  two from what was actually shown.
- **Copy-to-clipboard reliability** (a real bug, twice): the first
  implementation gated the clipboard write behind an `await navigator.share
  (...)` call — in strict browsers, awaiting anything before
  `clipboard.writeText()` can silently consume the click's "user
  activation," turning the copy into a no-op even though the button claims
  success. Fixed by trying a synchronous `execCommand('copy')` off a
  *visible* textarea first (no permission prompt, no activation-timing
  issue), falling back to the async Clipboard API, then a detached
  textarea — and always leaving the text visibly selected afterward so a
  worst-case browser still gives the player something to Ctrl/Cmd+C
  themselves. Verified by a test that deliberately makes the Clipboard API
  reject and confirms the fallback still delivers a correct copy, plus a
  test that reads the real clipboard back and byte-compares it.
- **Admin/testing mode**: a `⚙` button in the header toggles a panel to jump
  to any puzzle in the queue by index and reset saved results, so testing
  doesn't require waiting for the real daily rollover.
- Verified end-to-end with Playwright: real pointer-drag drawing, validation
  gating, the reveal animation, share-text non-spoiling, clipboard
  round-trip, reload persistence, and no console errors — across desktop
  and mobile viewports, light and dark mode.

### Phase 2 — port into an existing Next.js app
The user wanted the game merged into `songless_bois`, an existing private
Next.js 16 / React 19 / Tailwind 4 multi-game arcade ("Jimsengdle") already
deployed on Vercel, with its own established conventions:
- Per-game route at `src/app/<game>/page.tsx`
- Per-game logic at `src/lib/<game>/{types,game,puzzles,scoring,storage}.ts`
- Per-game components at `src/components/<game>/*`
- **Signed localStorage** via a shared `src/lib/integrity.ts` (FNV-1a hash
  + salt) so hand-edited scores/streaks in devtools get rejected on load —
  explicitly documented as "obfuscation, not cryptography," which is the
  right amount of effort for this context.
- Daily reset at **midnight AEST (UTC+10)**, not UTC, matching every other
  game in the arcade.
- Dark-only theme (`zinc`/accent-color Tailwind palette), no light-mode
  toggle — the standalone prototype's own theme toggle was dropped in the
  port to match.
- A landing page listing games as cards (emoji, accent color, live/locked
  status), with a hidden PIN-gated admin panel and a locked-games unlock
  code for some games — Draw the Curve was added as its own always-unlocked
  card, explicitly **not** wired into the arcade's shared "Case Open"
  scoring multiplier (kept as a standalone daily cycle per the user's
  choice), since that's a product/balance decision, not a technical one.

Everything was rewritten as proper React components rather than a thin
imperative wrapper — full native port, matching the codebase's idioms
(functional components, hooks, no direct DOM manipulation) so it reads as a
first-party game, not a bolted-on iframe.

**Bugs found and fixed during the port** (all caught by an actual browser
test run against a production build, not just typecheck/lint):

1. **React Compiler ref-read violations** — reading `padRef.current`
   directly during render (to derive `isEmpty`, `guessSegments`, etc.) is
   flagged as unsafe under the React Compiler this app's ESLint config
   enforces. Fixed by moving sketch-pad state into real React state
   (`useState`), updated via an explicit sync callback after every mutation,
   and exposing the pad's imperative actions (`clear`, `toPoints`) through a
   `useImperativeHandle`-based `ChartHandle` ref instead of leaking the raw
   pad instance to the parent.
2. **A genuine hydration mismatch (React error #418)** — surfaced only in
   the production build, only on a page *reload* after completing a puzzle.
   Root cause: whether today's puzzle was already played is only knowable
   client-side (`localStorage`), but that value was being computed eagerly
   during the component's first render pass — which runs identically during
   SSR (no `localStorage`, so "not played") and during client hydration
   (`localStorage` exists, so "already played"), producing two different
   rendered strings for the same DOM node ("Drag left to right..." vs.
   "Here is how your sketch compares."). Confirmed by first trying a
   client-only lazy `useState` initializer (still runs during the hydrate
   pass, so it didn't fix it — verified by testing, not assumed) before
   landing on the correct fix: start the restored-puzzle state at `null`
   unconditionally (matching what the server always renders) and fill it in
   via a `useEffect` that only runs after hydration completes. This is a
   deliberate, documented exception to the "don't setState in an effect"
   lint rule — syncing in state that's genuinely unavailable during SSR is
   exactly what that pattern is for.
3. **Admin panel's puzzle picker closed the whole panel on selection** —
   made the reset buttons unreachable immediately after jumping to a
   puzzle to test it. Fixed by not auto-closing on selection; the admin
   closes the panel explicitly via its own ✕ button.
4. **A live countdown string rendered eagerly** (`"Next curve in {h}h
   {m}m"`) — same class of bug as #2: a value that changes every render and
   will always differ between server-render time and client-hydrate time.
   Fixed by starting it as `null` and computing it only inside a
   `useEffect` (ticking every 30s), never as part of the initial render.

**Verification for the port**: `tsc --noEmit` clean, `next lint` clean in
every new file (pre-existing lint issues elsewhere in the base app were left
alone — not in scope), a full production build (`next build && next start`),
and a real Playwright run covering the landing page card, the full draw →
validate → reveal → share → copy → reload → replay-blocked sequence, and the
admin jump/reset flow — with zero console or hydration errors on the final
pass.

## 5. Process notes worth carrying forward

- **When a user pushes back on a design choice twice, take the second
  pushback as final** and move on rather than re-litigating — the reveal
  went through three real redesigns based on direct feedback ("too
  descriptive" → simplified; "bars are confusing" → removed and replaced
  with shading).
- **Test claims, don't just assert them.** Several fixes in this project
  looked correct on inspection but failed when actually run in a browser
  (the lazy-`useState` hydration attempt; the original clipboard
  implementation). The fix each time was to write a test that would have
  caught the bug, watch it fail, then fix the code and watch the same test
  pass — not to reason abstractly about whether something "should" work.
- **Match the target codebase's conventions exactly when merging into an
  existing project**, rather than importing your own patterns wholesale —
  this meant re-deriving the daily-epoch logic to use AEST instead of UTC,
  routing storage through the existing signed-localStorage helper instead
  of a new one, dropping the standalone app's own light/dark toggle to
  match the target's dark-only theme, and matching file/folder naming
  exactly (`src/lib/<game>/`, `src/components/<game>/`).
- **No push/PR credentials were available in the working environment.**
  The full port was built, tested, and committed locally; the user
  generated a short-lived fine-grained GitHub PAT (repo-scoped, Contents +
  Pull requests: read/write) for the push, but the coding agent's own
  auto-mode permission classifier blocked using that token programmatically
  (both a direct authenticated push and configuring a git credential helper
  were refused as too risky to execute autonomously). The user pushed the
  branch and opened the PR themselves using the token, then merged and
  revoked it. Worth planning for this class of hand-off (commit locally,
  hand the user the exact push/PR commands) rather than assuming an agent
  session will have write access to a real GitHub repo.

## 6. File map (as merged into `songless_bois`)

```
src/app/draw-the-curve/page.tsx              route: daily puzzle + admin preview
src/components/draw-the-curve/
  Chart.tsx                                  SVG drawing surface + reveal rendering
  ShareResult.tsx                            share modal, guaranteed-copyable textarea
  AdminPanel.tsx                             puzzle picker + reset controls
src/lib/draw-the-curve/
  types.ts                                   Puzzle, Residual, SegmentMatch, ScoreBreakdown
  scoring.ts                                 the magnitude+shape scoring engine
  codec.ts                                   XOR+base64 obfuscation for the puzzle queue
  puzzles.ts                                 AEST daily rotation, admin index lookup
  queue.json                                 18 obfuscated puzzles (OWID-sourced)
  storage.ts                                 signed localStorage progress + sketch compression
  chart.ts                                   axis/plot geometry, formatting
  reveal.ts                                  mismatch-shading patch geometry
  sketch-pad.ts                              function-of-x drawing capture
  share.ts                                   share text builder, robust clipboard copy
```

The original standalone prototype (Vite + vanilla TS) lived at
`C:\Claude Dev\human` during development; the merged, production version is
the React port above.
