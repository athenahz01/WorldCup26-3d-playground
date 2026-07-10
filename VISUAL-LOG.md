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

## Pass 2 — 2026-07-09, movement feel refit
Goal: make the camera read as a real object in a real space. Content untouched.

- Cut the globe intro entirely. Title card now floats over a slow aerial drift of the diorama itself; Begin fades in from black over 1 s with the flight camera already in position.
- Input easing: key state only sets velocity targets. Flight ramps in over ~0.4 s and glides out over ~1 s; walking ramps in ~0.13 s, stops over ~0.24 s.
- Mouse look writes yaw/pitch targets; the camera converges with a ~60 ms exponential lerp, frame-rate independent.
- Delta-time: physics substepped at 50 ms, up to 6 substeps per frame. Measured walk speed 7.00 u/s at 30 Hz, 8 Hz, and 4 Hz tick rates. Below ~3 fps the 0.3 s frame clamp slows time on purpose (anti-tunneling).
- Collision slides: X and Z integrate and resolve separately with radial push-out. Walking 40 degrees into the Arrowhead shell swept 11 degrees around the wall in 2.2 s at near-full speed, no sticking.
- Walking juice: footstep bob synced to speed (off in air and at rest), lateral sway in camera-local space, strafe lean, landing dip scaled to impact speed.
- Flight camera trails its target (~14 u lag at full speed) and banks into turns (capped 0.14 rad) plus a light strafe bank.
- F to land or launch is now a 0.6-0.65 s eased glide between states; mode flips at the end, inputs locked during.
- Polish: seats fade with distance instead of popping at 640 u; camera near plane 0.3 to 0.55 (depth precision); shadow map 1024 to 2048 with a tighter 340 u box for crisp contact shadows; shadow bias retuned (normalBias 2 erased small-object shadows entirely, now 0.4); adaptive quality no longer misfires from hidden-tab frame gaps; renderer guards against zero-size windows.

Tradeoff note: the 2048 shadow map costs a bit more GPU than the old 1024; the adaptive fallback still disables shadows wholesale if FPS sags, so laptop safety is unchanged.

## Pass 3 — 2026-07-09, theme park layout, look fix, stadium life, fidelity

1. Pointer lock fixed for real users. begin() and closeMap() and the ribbon-flight ending all request lock (each sits on a valid user gesture), requests are promise-wrapped so rejections never throw, and a persistent centered "click to look around" pill appears whenever play is active, the map is closed, and lock is absent. Verified with a request spy: lock requested on Begin, hint toggles with lock state, mousemove steers immediately once locked.

2. Theme-park compaction. All 16 cities moved into a 1,640 x 1,220 footprint with geography preserved (Pacific west, Mexican southwest, Northeast east, KC and Dallas central). Neighbor spacing 200-350 units. Everything derived from coordinates moved together: mask blobs and harbor cuts, mountain and highland bands, farmland belt, biome weights, terrain and underside planes (now 3,600 x 3,000 at finer per-unit detail), water plane and tropic center, cloud field, tree bands, ribbon curve and beacon heights, balloon anchors, bird flocks, minimap bounds, teleport offsets, opening camera, flight clamps. Landmarks with oversized local offsets were re-seated: volcano, Cerro de la Silla (BBVA re-rotated so the roof mouth still frames it), Hollywood hill, Independence Hall, Manhattan and Liberty. Movement retuned: fly 55 default, 200 max, landAlt 90, fog pulled in. A ground promenade now follows the knockout route (golden pavement, lit center strip, lamps with night pools, lined trees, archway gates and stall plazas with fountains at midpoints) plus plainer spur paths linking every other city. Verified: minimap markers, click-teleport, full ribbon lap, balloons, and a sprint from the Philadelphia gate to MetLife in under 10 seconds of sim time.

3. Stadium life. Every bowl now has goals with wireframe nets, corner flags, roofed benches, ad boards ringing the pitch (lit strips at night), and a scoreboard with the city name and its rounds. One shared football: walking into it dribbles, Space or click near it shoots in the camera facing with loft. Gravity, bounce with energy loss, rolling friction and spin, rectangular wall reflection matching the boards, goal-mouth detection with net wobble, confetti burst, GOAL banner, crowd roar, and a 2 s reset. Verified end to end at Arrowhead: dribble moved the ball 9.5 units, an aimed kick scored, celebration fired, ball reset to the spot.

4. Fidelity. Terrain grain rebuilt as two low octaves (no more speckle) plus a shoreline foam ring; water gained a fine animated shimmer; dusk and dawn palettes lifted (stronger dawn sun, brighter global exposure); additive glow halos on stadium floodlights and the trophy at night. Adaptive quality is now a ladder: level 1 drops glow halos and dims window emissives, level 2 drops pixel ratio, level 3 drops shadows. FPS caveat: the verification harness runs with rAF suspended, so real-GPU frame rates could not be measured this session; the ladder plus the additions' small budget (about 40 sprites, 32 net meshes, 16 scoreboards, one promenade batch) are the guardrails.

Zero console errors through the full pass-3 playtest: begin with instant look, map open and close, promenade walk, stadium entry, dribble and goal, ribbon lap, dawn, dusk, and night captures.

## Pass 4 — 2026-07-09, life pass
Verdict: kept. Side by side against pass 3 the interiors and night views are obviously richer.

- Crowds: roughly half of every stadium's seats now hold a low-poly fan (torso plus head, instanced, per-fan color mixing team shirts with neutrals). About 1,400 fans per stadium, sharing the seat fade so nothing pops. The interiors stop feeling abandoned; from outside, open bowls read as full.
- Night fireworks: a pool of three burst systems fires every 3.5 to 7.5 s over a random knockout city while it is dark. Radial sphere bursts with gravity and 2.3 s fade, five festival colors.
- Sailboats: six boats with colored sails drifting slow circles in the harbors (Vancouver inlet, SF bay, Miami shore, Boston harbor, NY harbor). Bob and heel animation. Caveat: registered and error-free, but I could not conclusively spot one in the verification frames; flagged for a look next pass.
- Flower beds: soil discs with clustered color blooms and hedge blobs between the plaza streetlights at every stadium.
- Confirmed in frames: crowded Arrowhead interior vs the empty pass-3 shot, a firework mid-burst at night over the northeast, shoreline foam and water shimmer reading well off the Boston coast, Levi's bowl visibly full from outside with the Golden Gate behind.

Console clean through the whole pass.

## Pass 5 — 2026-07-09, Houston fix, the Grand Circuit, living landmarks

0. Houston bug fixed: the compaction pass had missed its row, leaving it on an islet at (-100, 1150). Moved to (-80, 500) between Dallas and the Mexican cluster; separations 201 to 393 from its four neighbors, merged with the mainland (walked Houston to Dallas on dry land to prove it). All dependents move automatically since they derive from the CITY row. Footprint from real extremes: city grid 1,640 x 1,220, land about 2,040 x 1,620 with coastal garnish.

1. The Grand Circuit: a closed Catmull-Rom coaster through all 16 cities in perimeter-then-center tour order (van sea sf la gdl mex mty hou mia atl phi ny bos tor kc dal). Ten stadiums are true bowl pass-throughs, in over the rim and low across the pitch: KC, NY, Boston, Philadelphia, Toronto, SF, Seattle (through the roof gap), Mexico City (through the Azteca roof ring's central opening), Miami (through the canopy hole), Guadalajara (through the Akron ring). Six arc over the roof instead: LA (SoFi canopy), Vancouver (dome), Dallas, Houston, Atlanta, Monterrey. Rendered as real infrastructure: instanced twin rails (gold where the line overlaps the knockout ribbon, silver elsewhere), ties every third sample, support columns to the ground, faint emissive at night that dims at adaptive level 1. Sixteen boarding stations with platforms and glowing signs; E boards, gravity physics (slow up, fast down, 8 to 56 u/s), free mouse look, banked turns, speed-scaled rumble and wind, city banners fire as a tour, E dismounts at the next station, holding E for a second bails to a landing. The old scripted ribbon flyover now boards the coaster at LA.

Verification: rode a full circuit myself at 6x sim speed (9,785-unit lap, real-time pace about 4.4 minutes after retuning the chain-lift constant, which initially left the car crawling at minimum speed). Captured in-car frames of the bowl pass-throughs at Kansas City, MetLife, and the Azteca. Found and fixed a dismount deadlock: stations sit at track low points where the car is fastest, so the old speed gate could never open; dismount now brakes hard and lands (verified to ground mode). Wheel ride verified to its exact apex (y 64) and back; balloon tour to apex 165 and back; rocket launch, bell, Golden Gate deck (deck height 46), and four Tier 2 interactions all fired with correct labels; photo capture produced a 17.6 KB JPEG and exercised the download path. The goal mechanic re-check was interrupted by repeated headless-tab WebGL context losses (browser GPU eviction, app recovered each time); the mechanic itself was verified end to end earlier in this same code lineage and its code is untouched by this pass.

2. Living landmarks on a shared interaction system (proximity, E prompt, cooldowns). Tier 1: Saturn V launch with countdown beeps, engine rumble, pad smoke, shake, and a 30 s replacement descent; Golden Gate deck walk with railings and a mid-span photo plaque (access is an E lift at the shore rather than 26 stair platforms, noted as the one simplification); SkyView wheel ride (45 s rotation on the shared path-ride rig); Azteca balloon tour (60 s loop over the Mexican cluster, same rig); Liberty Bell ring with a decaying triangle-partial bell tone and a visible yoke swing. Tier 2 one-touch interactions at all thirteen remaining landmarks (sparkle bursts, bells, horn, surf, chimes). Tier 3: P toggles photo mode anywhere (HUD hidden, saturation lift, deeper vignette, slowed look), Space captures and downloads a JPEG named for the nearest city.

## Pass 6 — 2026-07-10, motion pass
- A roaming three-car train (red engine, white cars) now rides the Grand Circuit whenever the player is not aboard, hidden while riding. The track reads as a living ride from anywhere in the park.
- Even-numbered clouds gained invisible shadow casters, so real cloud shadows drift across the ground near the player at zero material cost. Wired and error-free; visually subtle in the aerial check, flagged for a ground-level confirmation next pass.
- Console clean through reload and aerial capture.

## Pass 7 — 2026-07-10, make it feel like a real park (Phase A complete, Phase B deferred)

Phase A, all five items landed and verified:
- A1 seat-relative ride camera: base yaw and pitch derive from the smoothed track tangent (turns swing the view, drops aim downhill), mouse is a clamped offset (about ±120°/±60°) that eases home after 1.2 s idle, banking kept, FOV eases 62→70 with speed, chain-lift click-clack ticks on slow climbs, wind now scales with speed squared, and the car glides to ~6 u/s into platforms for boarding and dismount instead of detaching at speed. Verified riding: yaw trail follows the track with the mouse untouched; dismount eased to a stop at a station.
- A2 scale: walking eye height 1.7→2.7, on-foot FOV 68 (flight stays 62, set on every mode transition), landing tween settles the pitch a couple of degrees up, dribble and kick reach retuned for the taller camera.
- A3 traversal: platform grab is now feet-relative (max step 0.95) with a smooth lift instead of a snap, every boarding station gained a walkable platform plus generated stairs to the lawn. Stadium entries and all interaction points sit on plateau ground; no extra ramps were needed beyond the station stairs and the Golden Gate lift.
- A4 ball: 256 px Telstar-style panel texture with seam lines, 24×18 sphere, tracking contact-shadow disc that fades with height, squash-and-recover on kicks and hard bounces, rolling spin direction corrected (it was spinning backward). Kick and roll verified numerically; the close-up beauty capture missed its aim twice and is the one visual left for a human glance.
- A5 Golden Gate and water: shore teleport replaced with a 2.5 s eased lift ride (path-ride rig), descend prompts at both deck ends, railings raised to 1.5 with collision. Universal water rule: feet under the sea splashes, banners "fished out", and tweens you to the nearest station — verified end to end off the Miami shore, landing on dry ground at a station.

Phase B, deferred entirely on budget (in rank order, untouched): B1 wayfinding totems and map legend, B2 passport stamps, B3 ride photo, B4 park population, B5 fireworks finale, B6 hi-fi odds and ends. Console clean through every Phase A test.
