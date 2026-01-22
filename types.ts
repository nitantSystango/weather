export interface WeatherCondition {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  cloudCover: number;
  precipitationProbability: number;
  description: string;
  riskScore: number; // 0.0 to 1.0
}

export interface ForecastHour extends WeatherCondition {
  hourOffset: number; // 0 to 23
  timestamp: string;
}

export interface WeatherLocation {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  current: WeatherCondition;
  forecast: ForecastHour[];
}

export interface AppState {
  selectedHour: number;
  selectedLocationId: string | null;
  isPlaying: boolean;
  isHoveringTimeline: boolean;
}