export type InputState = ReturnType<typeof createInputState>;

export function createInputState(target: Window = window) {
  const keys = new Set<string>();
  const onDown = (event: KeyboardEvent) => keys.add(event.code);
  const onUp = (event: KeyboardEvent) => keys.delete(event.code);
  target.addEventListener('keydown', onDown);
  target.addEventListener('keyup', onUp);
  return {
    keys,
    pressed: (code: string) => keys.has(code),
    dispose() { target.removeEventListener('keydown', onDown); target.removeEventListener('keyup', onUp); keys.clear(); },
  };
}
