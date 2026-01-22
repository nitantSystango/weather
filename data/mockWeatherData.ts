import { WeatherLocation, ForecastHour } from '../types';

const LOCATIONS = [
  { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
  { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { name: "Reykjavik", country: "Iceland", lat: 64.1466, lng: -21.9426 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241 },
  { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.9068, lng: -43.1729 },
  { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
  { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Moscow", country: "Russia", lat: 55.7558, lng: 37.6173 },
  { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
];

const DESCRIPTIONS = ["Clear Sky", "Partly Cloudy", "Overcast", "Light Rain", "Heavy Rain", "Thunderstorm", "Snow Showers", "Mist"];
const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

// Deterministic pseudo-random helper
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const generateForecast = (lat: number, lng: number): ForecastHour[] => {
  const forecast: ForecastHour[] = [];
  const baseTemp = 20 - (Math.abs(lat) / 90) * 30; // Rough temp based on latitude
  
  for (let i = 0; i < 24; i++) {
    const timeSeed = i * 0.1;
    const volatility = seededRandom(lat + i);
    
    // Simulate diurnal cycle
    const hourOfDay = (i % 24);
    const dayCycle = Math.sin((hourOfDay - 6) * Math.PI / 12); // Peak at 12pm, low at 12am

    const temp = baseTemp + (dayCycle * 5) + (volatility * 2);
    const wind = 5 + (volatility * 25);
    const precip = volatility > 0.7 ? volatility * 100 : 0;
    
    // Risk Calculation (Simplified)
    // 0-0.2 Low, 0.2-0.4 Mod, 0.4-0.7 High, 0.7-1.0 Extreme
    let risk = 0;
    if (wind > 40) risk += 0.3;
    if (precip > 50) risk += 0.3;
    if (temp > 35 || temp < -10) risk += 0.2;
    if (volatility > 0.9) risk += 0.2;

    forecast.push({
      hourOffset: i,
      timestamp: new Date(Date.now() + i * 3600000).toISOString(),
      temperature: Math.round(temp),
      humidity: Math.round(50 + volatility * 40),
      windSpeed: Math.round(wind),
      windDirection: DIRECTIONS[Math.floor(volatility * 8)],
      cloudCover: Math.round(volatility * 100),
      precipitationProbability: Math.round(precip),
      description: DESCRIPTIONS[Math.floor(volatility * DESCRIPTIONS.length)],
      riskScore: Math.min(risk, 1.0)
    });
  }
  return forecast;
};

export const generateMockData = (): WeatherLocation[] => {
  return LOCATIONS.map((loc, idx) => ({
    id: `loc-${idx}`,
    name: loc.name,
    country: loc.country,
    latitude: loc.lat,
    longitude: loc.lng,
    current: generateForecast(loc.lat, loc.lng)[0], // current is hour 0
    forecast: generateForecast(loc.lat, loc.lng)
  }));
};

// Generate mock data for any given coordinates
export const generateMockDataForCoordinates = (latitude: number, longitude: number): WeatherLocation => {
  const forecast = generateForecast(latitude, longitude);
  return {
    id: `coord-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
    name: `${latitude >= 0 ? latitude.toFixed(2) + '°N' : Math.abs(latitude).toFixed(2) + '°S'}, ${longitude >= 0 ? longitude.toFixed(2) + '°E' : Math.abs(longitude).toFixed(2) + '°W'}`,
    country: 'Unknown',
    latitude,
    longitude,
    current: forecast[0],
    forecast
  };
};

export const MOCK_DATA = generateMockData();