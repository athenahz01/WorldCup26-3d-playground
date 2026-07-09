# Continental '26 — visual improvement log

Baseline (pass 0): shipped version verified on 2026-07-09. Reference views: KC opening, Mexico City aerial, LA golden hour, NY night.

## Pass 1 — 2026-07-09
Target: obvious step up in atmosphere, grounding, and life. Verdict: kept (all four reference views clearly better side by side).

- Sky: visible sun disc, warm horizon band hugging the skyline.
- Moon with soft glow rides opposite the sun, fades in at night.
- Farmland patchwork across the plains belt: hash-cell quilt of wheat, green, and fallow fields with faint section roads. Transforms the KC approach.
- Terrain slope shading baked into vertex colors: steep faces darken, flats lift. Adds depth to every hill.
- Stadium grounding: light plaza apron plus a darker contact ring under all 16 stadiums. Kills the floating look.
- Festival villages: striped market tents with pennants ringing every stadium, gate approach kept clear.
- Night light pools: warm additive discs under every plaza streetlight.
- Soft light cone over each bowl at night (dimmed after first review, it read too solid from above).
- Seven hot-air balloons drifting slow circles near Mexico City, NY, Vancouver, KC, Atlanta, LA, Dallas.

Verification notes: preview screenshots died this session (tab occluded, rAF suspended), so frames are now captured in-page via a debug tick() + frame() API and POSTed to a local capture server (scratchpad/capsrv.js), then reviewed as JPEGs. Console stays clean.
