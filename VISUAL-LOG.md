# Continental '26 — Pass 21: New York Final Night

## City completed
**New York / New Jersey — MetLife Stadium**

This is the third city-level vertical slice after Mexico City and Los Angeles.

## Visual refinement

- Rebuilt MetLife's exterior silhouette with substantial corner towers, facade datum bands, diagonal bracing, layered aluminum louvers, and dual championship crown rings.
- Added a dedicated physically shaded MetLife pitch with tighter mowing, damp match-night sheen, fine grass grain, cool broadcast highlights, and a restrained center-circle Final medallion.
- Added six authored championship spotlights with slow, coordinated motion.
- Added spectator camera flashes around the bowl.
- Added a suspended Final scoreboard and a fully authored Final Night color grade.
- Added a physical Final arch at the real stadium entrance.
- Added Champions Avenue: paired blue-and-gold illuminated bollards lead toward the gate without requiring a UI instruction panel.

## Interaction refinement

- New York's penalty event is now **Final Pressure**, a city-specific flagship presentation.
- The player enters through the tunnel into a dedicated Final Night lighting state.
- New York uses a unique gold Final game disc and a physical pitch-side instruction board.
- The existing realistic ball, curve, charge, goalkeeper dive, post/crossbar response, medals, points, and saved best score remain intact.
- Goals trigger Final-specific camera flashes and blue-and-gold firework volleys.
- A gold-medal finish triggers a larger championship celebration.
- Context guidance remains a small, unboxed `E` cue. No large hint or instruction cards were added.

## Technical checks

- JavaScript module syntax validated with Node.
- HTML parsed successfully.
- Duplicate HTML IDs checked.
- Existing Azteca, Los Angeles, coaster, park guide, save data, and challenge systems retained.

## Pass 22 — Dallas Event Night

### City completed

**Dallas — AT&T Stadium**

This is the fourth flagship city-level vertical slice after Mexico City, Los Angeles, and New York / New Jersey.

### Visual refinement

- Reworked AT&T Stadium as a truly massive enclosed-event building: layered silver facade ribs, deep navy end portals, glass end walls, strengthened roof arches, crown lighting, and structure readable from the Grand Circuit.
- Added a dedicated physically shaded indoor broadcast pitch with a cooler roof reflection, tighter roughness, and restrained clearcoat.
- Added six authored moving broadcast spotlights and a dedicated Dallas event-night exposure state.
- Added the four-sided suspended Texas Halo screen, deliberately oversized to sell the interior scale.
- Added a monumental entrance portal and paired low blue floor studs that guide arrival without a floating instruction panel.

### Interaction refinement

- Dallas's penalty event is now **Power Play**, a city-specific five-shot presentation.
- The compact nearby prompt reads `E Power Play`; longer control guidance remains limited to the active challenge HUD.
- Goals pulse the Texas Halo, shake the building lightly, and trigger electric-blue exterior fireworks.
- Gold retains the shared medal, star, points, best-score, and save progression systems and triggers an amplified Dallas celebration.
- Entering and exiting correctly applies and restores the Dallas-specific lighting state.

### Technical checks

- Vite production build passes.
- Existing Azteca, Los Angeles, New York, coaster, save, reward, and shared pitch-game systems remain connected.

## Pass 23 — Miami Tropical Festival

### City completed

**Miami — Hard Rock Stadium**

This begins Phase 2 and is the fifth city-level vertical slice.

### Visual refinement

- Strengthened Hard Rock Stadium's floating canopy with layered aqua and coral edge light, exterior fins, illuminated end structure, and an open-air silhouette that remains legible from the coaster.
- Added a dedicated physically shaded pitch with cooler canopy reflections and humid-night sheen.
- Added four coordinated tropical spotlights and a sunset-specific exposure state.
- Added a palm-scale arrival portal and paired aqua/coral ground lights that lead to the entrance without floating directions.
- Turned the four canopy edges into one restrained music visualizer that responds to the flagship game.

### Interaction refinement

- Miami's crossbar event is now **Neon Crossbar**.
- The nearby prompt is only `E Neon Crossbar`; the physical pitch-side sign names the attraction without explaining it at length.
- Crossbar hits pulse the canopy; a gold finish drives a larger synchronized response while retaining shared medals, stars, points, best scores, and saves.
- Entry and exit apply and restore the authored Tropical Night state.

### Technical checks

- Vite production build passes.
- The four completed flagship slices and all shared traversal, game, save, and reward systems remain connected.

## Interface correction — result ribbon removed

- Removed the full-width Retry / Explore result ribbon after owner review.
- Challenges now return directly to exploration and report the score through the existing short banner and compact feedback line.
- Removed the dormant result-card HTML, CSS, and keyboard state rather than merely hiding it.

## Pass 24 — Seattle Rain City

### City completed

**Seattle — Lumen Field**

This is the sixth city-level vertical slice and the second Phase 2 destination.

### Visual refinement

- Strengthened Lumen Field's twin roof silhouette with exposed steel rhythm, glass end concourses, supporter-color structural light, and brighter roof crowns.
- Added a dedicated wet broadcast pitch with stronger clearcoat and tighter reflected light.
- Added four coordinated cool-white and supporter-green spotlights with a restrained overcast exposure state.
- Added a steel arrival gate and reflective blue/green pavement strips that lead to the entrance without floating directions.
- Existing localized rain now works with the authored wet materials rather than reading as an isolated particle effect.

### Interaction refinement

- Seattle's dribble event is now **Rain Run**.
- The nearby prompt is only `E Rain Run`, backed by a physical pitch-side sign.
- Each cleared gate pulses the wet approach lighting; gold triggers the stronger supporter response while retaining shared medals, stars, points, best times, and saves.
- Entry and exit apply and restore the Rain City presentation state.

### Technical checks

- Production build passes after deleting the result-card system.
- Existing city slices, traversal, coaster, shared games, rewards, and saves remain connected.

## Grand Circuit pacing and route correction

- Reduced global light-bar output, bloom, wayfinding-beam opacity, ribbon boost, glow sprites, and Miami canopy intensity so luminous elements guide without washing out architecture.
- Removed every roof-flyover profile: all sixteen Grand Circuit city segments now enter and cross the stadium bowl.
- Re-authored Guadalajara, Mexico City, Monterrey, and Kansas City on safer stadium axes to avoid landmarks and plaza objects while retaining interior passes.
- Replaced random connector bends with collider-aware route selection.
- Lowered ordinary connector cruise height from a 126-unit minimum to 74, reduced terrain clearance padding from 58 to 26, shortened lift runout, reduced lateral wandering, and nearly removed randomized connector height.
- Increased chain-lift regulation from 36 to 52 units per second, doubled starting speed, and raised minimum ride speed from 5 to 9.
- Runtime track audit: 16/16 bowl passes, zero corridor misses, zero collider contacts, zero roof-overflight intrusions, and zero inverted-frame samples.
