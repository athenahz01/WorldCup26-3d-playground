export interface CityDefinition {
  id: string; name: string; stadium: string; x: number; z: number; py: number; rot: number;
  hero: boolean; biome: string; ko: string | null; [key: string]: unknown;
}

export function createCityRegistry(cities: CityDefinition[]) {
  const byId = new Map(cities.map(city => [city.id, city]));
  return { all: cities, get: (id: string) => byId.get(id), require: (id: string) => { const city = byId.get(id); if (!city) throw new Error(`Unknown city: ${id}`); return city; } };
}
