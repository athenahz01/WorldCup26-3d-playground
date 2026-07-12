# Continental '26 architecture

The original experience grew as one browser module. The first migration phase preserves the authoritative Pass 21 runtime in `src/legacy/main.js` while moving delivery to Vite and defining stable subsystem boundaries under `src/`.

New work should not add cross-city systems to the legacy module. Extract one vertical slice at a time, starting with city data and save state, then terrain/weather/lighting, renderer/game loop/input, and finally stadium, ride, game, character, audio, and UI controllers. The authored Mexico City, Los Angeles, and New York slices should move into their matching city directories as their shared dependencies are extracted. Each extraction should keep the `window.__wc` verification API working until equivalent automated tests replace it.

Static authored assets belong in `public/`; generated procedural assets remain in their owning source module. `server/` is intentionally empty until a feature needs an authoritative backend.
