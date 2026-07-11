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

## Pass 8 — 2026-07-10, debts cleared and Phase B shipped

Debts:
- Ball beauty shot captured at last: round 24x18 silhouette, pentagon panels with seams, contact shadow grounding it on the center spot. Reads as a football.
- Sailboats exist and float correctly (confirmed from directly above the SF bay); they were simply too small to read, so all six scaled 1.9x. No ghost feature.
- Cloud shadows confirmed clearly visible at surface level (mottled drift across the bay water and shorelines). Kept as is.

Phase B, B1 through B5 shipped and verified; B6 (star band, paving texture, lens flare, tree variants, heat shimmer) deferred on budget:
- B1 wayfinding: additive light beams over all 16 stations (cool blue, tall) and the five signature experiences (gold, shorter), pulsing, brighter at night, dimmed to 25 percent at adaptive level 1. Bobbing gold marker sprites over every interaction point (dropped at level 1). Four first-run tips wired to first station approach, first landing, first stadium entry, and first nightfall, each once per session. Map legend added with station squares, experience triangles, the live roaming-train dot, the player arrow, and gold rings on stamped cities. Verified: beams visible across the park in one frame; legend and markers all present on the map capture.
- B2 passport: entering a pitch stamps the city; HUD shows "PASSPORT n / 16"; 16 of 16 fires a champion banner, golden burst, and a permanent star on the HUD line. Verified 0 to 3 across three cities with matching gold rings on the map.
- B3 ride photo: auto-captured at the track's biggest drop (computed from the spline), offered at dismount ("your ride photo, press Enter to save"), Enter downloads, one per lap. Verified through a full boosted lap: capture fired, offer appeared, Enter saved.
- B4 population: thirty instanced two-tone visitors bob-walking the promenade legs with lateral offsets; no collision; first thing dropped at adaptive level 1.
- B5 finale: at night every 4 minutes, a 20 second multi-volley show over MetLife with crackle ticks, banner cue on first firing. Verified: "THE FINALE" banner fired on schedule at night.

Console clean through the entire pass.

## Pass 9 — 2026-07-10, B6 hi-fi odds and ends (all five, in order)

- Galactic band: 2,400 extra faint stars concentrated along a tilted great-circle lane, folded to the upper sky, fading with dawn alongside the main field. Confirmed dense layered stars in the night look-up frame (band shape is subtle at JPEG scale).
- Paving texture: 128 px tiling canvas (joint grid plus speckle) on a dedicated promenade batch so lamps, tents, and arches keep their flat colors. Reads clearly underfoot at the archway gate.
- Sun lens flare: main bloom plus a ghost sprite, driven by view-sun alignment to the tenth power and off at night. The golden-hour sunward frame with the ribbon crossing the flare is poster material.
- Two tree variants: columnar poplars (24 percent of temperate broadleaf spawns) and low twin-blob shrubs (35 percent of dry-land agave spawns), both instanced like the rest.
- Texan heat shimmer: two wide low additive strips over the Dallas and Houston flats, opacity peaking at midday, gently pulsing scale and height, dropped at adaptive level 1. Decorative by design and honestly subtle.

Regression caught and fixed during verification: plaza fountain particles blew out into huge white blobs at close range once ground-level framing improved; particle size and opacity roughly halved, now reads as water jets.

Console clean through night, day, golden hour, and noon checks.

## Pass 10 — 2026-07-10, art direction

Bugs first:
- Empty-banner black box: the banner is now visibility-hidden unless active, and empty text nodes display:none. Nothing paints when there is no content.
- Shadow banding: shadow camera depth range tightened from 200-2200 to 400-1500 (4x better depth precision at the current map size), bias -0.0005 with normalBias 0.6; PCFSoft was already active. Side effect accepted: the very highest cloud shadow casters can clip at exact noon.

1. Map redrawn as a designed artifact (before: p8-map, after: p10-map). Smooth ray-marched island silhouette with a two-step shore glow over two-tone water; painterly elevation tints (highland gold, three mountain masses, darker evergreen north) clipped to the island; the full Grand Circuit as a continuous silver line with the knockout road in solid gold over it; thin continuous spur lines; city dots with drop shadows and name pills; stations and experiences baked in; legend rebuilt as a footer bar. Click-to-travel, stamped rings, live train dot, and the player arrow all still work on top.

2. Sky rebuilt (before: p3-dusk, after: p10-dusk). Four-stop ramp (below-horizon fade, fog-matched haze band, mid sky, zenith) so terrain melts into sky at every hour; dusk shows a smooth orange-to-plum blend with no hard boundary. Sun glow now swells near the horizon. Clouds are lobed composites with lighter tops and flat shaded bottoms in three variants, tinted white at noon, sun-warm at dusk, slate at night. Star band and lens flare confirmed alive under the new gradient.

3. Ground composition. Every city gained a designed avenue from its boarding station to the plaza: paved with the B6 texture, alternating poplar pairs and banner-pole pairs with lamps and flags. Plaza edges defined by hedge rings (gaps kept clear at the gate and avenue). Landing pitch still settles at +0.03. The hero-plaza foot view now has hedges, trees, and buildings in frame instead of open lawn, though the mex outward view remains the least dense angle.

4. Landscape. Wild trees rebuilt as 5-12 tree groves with clearings (same ~1,050 budget), biome per grove so regions read distinct from the air; avenue rows come out of the same budget. Decorative furniture was already plaza-bound, no scatter to cut. Wayfinding totems now fade to 7 percent by day (the white glitch-strips are gone from daylight frames) and rise through dusk into night.

Sweep: console clean; begin, look, map open/travel/close, walk, fly, stadium entry and a kick all pass. The ride-leg dismount sample returned still-riding inside the harness polling window; the dismount mechanic itself is untouched since its pass-7 verification.

## Pass 11 — 2026-07-10, from park to game: framework plus the first two games

1. Framework. localStorage save (try/catch wrapped, silently session-only if unavailable) persisting stamps, stars, points, per-challenge bests, pins, tips, and goal state; a two-click "reset progress" on the title screen. Fan points and a 3-star-per-city system (stamp, bronze-or-better, gold) with the tally, points, and pin count on the HUD and per-city stars under the map labels. The goal arc reads "ROAD TO THE FINAL, earn 24 stars"; at 24 the banner fires, the MetLife totem turns gold, and the map marks "THE FINAL AWAITS" (the Final itself is a future pass). One reusable challenge shell: title card with rules and medal thresholds, run state with HUD, result card with score/medal/points/best, Space to start, R to retry, Esc to quit. Verified: stamping a city granted a star and 50 points, and stars, points, and bests survived a full page reload.

2. Penalty shootout at every stadium (E at the penalty spot). Articulated keeper who idles, winds, and dives with difficulty scaled by the city's tournament round (read chance .28 to .76 by round); mouse-aimed reticle projected onto the goal mouth; hold-release Space power bar where soft shots get saved and over .92 clears the bar; keeper commits on release, honest, no rubber-banding. 3/4/5 goals for bronze/silver/gold, gold requiring a top-corner finish; medals grant points and the city's challenge stars; bests persist. Verified by playing: a 5/5 gold with top corners (result card, 400 points, bronze and gold stars), a deliberate 0/5 loss (every shot over the bar), a mid-run Esc quit that cleaned up, and best-of-5 surviving reload.

3. Golden pin hunt: 30 pins - one near every city landmark, the Golden Gate mid-span, a station platform, the coaster's big drop, Liberty point, the Boston lighthouse walk, the volcano rim and the saddle (flight rewards), the seaplane dock, and the golden-road rest plazas. Bob, spin, glint material, proximity chime within 20 units, collect on touch for points, milestones at 10/20/30, all 30 a star and a badge. Placement audit found five spawns hovering over water where the wading rescue would block collection; the placer now walks shoreline spawns inland until dry. Final audit: 30 total, 25 foot-reachable, 5 flight rewards, none wet. Verified collecting five on foot including the bridge and platform pins, counter and save confirmed.

Console clean through every test. Future passes 12 to 15 intentionally untouched.

## Pass 12 — 2026-07-10, three pitch games

All three plug into the Pass 11 challenge shell and reuse the ball physics; the shootout, pins, and framework are untouched apart from shared guards. The four games sit at spaced pitch spots - penalty spot, halfway line, corner, center circle - and all four prompts were confirmed individually reachable at Arrowhead with no overlap. Bronze/gold feed the SAME two per-city challenge stars (verified: a crossbar gold at KC did not duplicate the stars the shootout had already earned). Each game keeps its own best (pk_/cb_/sl_/ku_ keys) and the Pass 11 save loaded unbroken with the new fields merging in.

1. Crossbar challenge: five strikes from 12/16/20/25/30, shared reticle and power bar, no keeper. Bar detection is a generous band at the crossing plane (bar radius plus a half ball width); posts count half; a strike pings (new metallic partials sound) and visibly wobbles an overlay bar. Soft shots fall short, overcooked sail. Verified: a 5-hit gold run (aim pitch asin(1.52/1.1d), power .6 - deterministic), a 0-hit fail with everything short, and clean Esc handling.

2. Dribble slalom: five S-pattern gates plus a finish, glowing next-gate markers, timer from first ball touch, +2 s missed gate (flashes red, stays checked), +1 s toppled cone with a physics flop. Course spawns per run and despawns on quit or finish. Balance: my clean scripted run was 17.3 s, so gold 19 / silver 22 / bronze 26 (+10/25/50 percent). Verified: a full run finishing at 17.3 s with every gate logged in order, result card, best saved.

3. Keepy-uppy: click or Space pops the ball with a home-nudge plus drift that grows .14 per touch; streak ends on ground contact. 10/25/50 medals, 5 points per touch with a +1 multiplier step per 10 streak. Verified: a 12-touch bronze run with result card and best saved, an accidental-but-valid 1-touch drop proving the ground-end path, and a genuine mid-air Esc quit that cleaned up with the player still on the pitch.

Regression: a full 5/5 shootout round after all three games, bests intact (pk 5, cb 5, sl 17.3, ku 12). Console clean through every test.

Balance numbers for the owner: crossbar points = distance x10 per bar hit (x5 posts) + 150/75/40 medal bonus; slalom 300/160/90/20; keepy 5/touch with streak multiplier + 200/100/50; all tuned around the 17.3 s slalom reference run.

## Pass 13 — 2026-07-11, the beauty pass

0. Tone mapping: ACESFilmic confirmed, deliberate exposures per hour lerped through the stops - noon 1.11, golden hour 1.18, dusk 1.10, night 1.00. No materials were compensating with baked brightness.

1. Bloom: EffectComposer + UnrealBloomPass (matching r160 addons) on a HalfFloat HDR target with threshold 1.0, so only genuine emitters bloom - daytime diffuse stays clean. Strength .22 day to .77 night, plus a day-only altitude lift for the aerial. OutputPass handles tone mapping and color space. First retune of the pass: the night aerial initially nuked the island (ribbon boost x night boost multiplied); boosts are now additive and capped at 2.4.

2. Reflections: a PMREM environment captured from the procedural sky dome, refreshed when dayT moves .02 (never per frame). Hero surfaces only: the trophy gold and all glass (canopies, windows, bench roofs) converted to MeshStandardMaterial, coaster rails to metal Standard. Terrain, trees, tents stay Lambert.

3. Water 2.0: per-vertex shore proximity from the island mask drives a turquoise shallow band grading to navy offshore around every coastline; a sun-direction glitter streak that stretches at low sun; foam ring tightened to hug the waterline. The dusk coastline frame (shallows + glitter + bloom sun) is a poster on its own. Note: Miami's deco strip now visibly stands in the shallows - reads as a stylized stilt strip, kept.

4. God view: fog density fades 93 percent above 250 to 650 altitude so the island renders crisp from height and hazy from the ground, blended smoothly; a full sand beach band rings the island into the turquoise; biome palette harmonized warm (pnw 40694c, ca b2a562, mex ac9a60, tex c6a878, plains 8fae5f, se 619455, tropic 7cb56a, ne 639659, lawn 74a85e, sand e2cfa2/e8d5a6, paths d9c9a2, plaza cfc4ac, water 16537a to 2fd4c4 shallows, gold e8b84b); the golden road gets an altitude emissive boost (capped) making it the island's strongest line; flight ceiling raised 900 to 1400 - the whole island fits one frame with margin at 1250.

5. Finishers: a 14-ray sun-shaft sprite at dawn/dusk fading with view angle; new sessions start at golden hour (dayT .60) with the cycle position persisted in the save for returning players; 120 golden-hour dust motes drifting within 40 units of the ground camera, faded in and out.

Adaptive ladder, new order: level 1 drops bloom, level 2 drops glow sprites, markers, visitors, shimmer, level 3 drops pixel ratio, level 4 drops shadows. FPS statement: real-GPU rates remain unmeasurable in the harness (rAF-suspended tab); bloom is half-res and first to drop, and everything else added this pass is sprites, uniforms, or one 128-sphere PMREM capture every few sim-minutes.

Verified: the four money shots captured (island golden hour at 1250 altitude - THE shot; island at night with balanced bloom jewelry; dusk coastline; golden plaza with the gate framing the stadium); a ride leg under the post chain with a 103 KB photo-mode bloom capture and a clean dismount; console clean through everything.
