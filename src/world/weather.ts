export interface WeatherState { cloudCover: number; rain: number; fog: number; wind: number; }
export const defaultWeather: WeatherState = { cloudCover: 0.35, rain: 0, fog: 0, wind: 0.25 };
