export type FrameHandler = (deltaSeconds: number, elapsedSeconds: number) => void;

export function createGameLoop(frame: FrameHandler) {
  let frameId = 0;
  let running = false;
  let previous = 0;

  const tick = (now: number) => {
    if (!running) return;
    const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
    previous = now;
    frame(delta, now / 1000);
    frameId = requestAnimationFrame(tick);
  };

  return {
    start() { if (!running) { running = true; previous = 0; frameId = requestAnimationFrame(tick); } },
    stop() { running = false; cancelAnimationFrame(frameId); },
    get running() { return running; },
  };
}
