export interface SaveData {
  stamps: string[];
  stars: Record<string, Record<string, number>>;
  points: number;
  bests: Record<string, number>;
  pins: number[];
  tips: Record<string, boolean>;
  goal: boolean;
  dayT?: number;
}

const defaults = (): SaveData => ({ stamps: [], stars: {}, points: 0, bests: {}, pins: [], tips: {}, goal: false });

export function createSaveSystem(key = 'c26save') {
  const data = defaults();
  try { Object.assign(data, JSON.parse(localStorage.getItem(key) || '{}')); } catch { /* session-only fallback */ }
  return {
    data,
    write() { try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* session-only fallback */ } },
    reset() { try { localStorage.removeItem(key); } catch { /* session-only fallback */ } },
  };
}
