export const clamp = (value: number, min: number, max: number) => value < min ? min : value > max ? max : value;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, value: number) => { const t = clamp((value - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function hash2(x: number, y: number) { const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return value - Math.floor(value); }
