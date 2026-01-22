import { MOCK_DATA, generateMockDataForCoordinates } from '../data/mockWeatherData';
import { WeatherLocation, ForecastHour } from '../types';

// Zeus API configuration - from https://www.zeussubnet.com/hackathon
const ZEUS_API_ENDPOINT = 'https://api.zeussubnet.com/forecast';
// In Vite, environment variables must be prefixed with VITE_ to be accessible
// Access via import.meta.env (Vite) or fallback to process.env (for compatibility)
const getApiKey = () => {
  // Try Vite env first (VITE_ prefix)
  if ((import.meta as any).env?.VITE_ZEUS_API_KEY) {
    return (import.meta as any).env.VITE_ZEUS_API_KEY;
  }
  // Try React style env
  if ((import.meta as any).env?.REACT_APP_ZEUS_API_KEY) {
    return (import.meta as any).env.REACT_APP_ZEUS_API_KEY;
  }
  // Try process.env (for SSR or other contexts)
  if (typeof process !== 'undefined' && (process.env as any)?.REACT_APP_ZEUS_API_KEY) {
    return (process.env as any).REACT_APP_ZEUS_API_KEY;
  }
  // Default fallback
  return 'example123';
};

const ZEUS_API_KEY = getApiKey();

// Log API key status (for debugging - only first 4 chars for security)
console.log('Zeus API Key Status:', {
  keySet: !!ZEUS_API_KEY && ZEUS_API_KEY !== 'example123',
  keyPreview: ZEUS_API_KEY ? ZEUS_API_KEY.substring(0, 4) + '...' : 'NOT SET',
  keyLength: ZEUS_API_KEY?.length || 0
});

export interface WeatherServiceResponse {
  locations: WeatherLocation[];
  source: 'ZEUS_NODE' | 'ZEUS';
}

export interface CoordinateWeatherResponse {
  location: WeatherLocation | null;
  source: 'ZEUS_NODE' | 'ZEUS';
}

class WeatherService {
  async getAllLocations(): Promise<WeatherServiceResponse> {
    try {
      // Attempt to fetch from real API
      // Added a timeout to prevent hanging if the API is unresponsive
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(ZEUS_API_ENDPOINT, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          // 'x-api-key': process.env.REACT_APP_ZEUS_API_KEY // Add key if required
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Zeus API Error: ${response.statusText}`);
      }

      const rawData = await response.json();
      const mappedData = this.mapZeusData(rawData);

      return {
        locations: mappedData,
        source: 'ZEUS_NODE'
      };

    } catch (error) {
      console.warn('Falling back to simulation data:', error);
      
      // Simulate network latency for the fallback
      return new Promise((resolve) => {
        setTimeout(() => resolve({
          locations: MOCK_DATA,
          source: 'ZEUS'
        }), 1500);
      });
    }
  }

  // Adapter: Transform generic API response to our WeatherLocation type
  private mapZeusData(data: any): WeatherLocation[] {
    // This adapter is defensive. It assumes the API might return a list of locations.
    // If the schema differs, this logic needs to be updated.
    if (!data || !Array.isArray(data)) {
      console.error("Invalid data format from Zeus API");
      return [];
    }

    return data.map((item: any, idx: number) => ({
      id: item.id || `zeus-${idx}`,
      name: item.city || item.name || 'Unknown',
      country: item.country || 'Global',
      latitude: Number(item.lat || item.latitude),
      longitude: Number(item.lon || item.lng || item.longitude),
      current: this.mapCondition(item.current),
      forecast: (item.forecast || []).map((f: any) => ({
        ...this.mapCondition(f),
        hourOffset: f.hour_offset || 0,
        timestamp: f.timestamp || new Date().toISOString()
      }))
    })).filter(loc => loc.forecast.length > 0); // Filter out malformed locations
  }

  async getWeatherByCoordinates(latitude: number, longitude: number): Promise<CoordinateWeatherResponse> {
    try {
      // Fetch weather data from Zeus API according to documentation: https://www.zeussubnet.com/hackathon
      // We need to fetch multiple variables to calculate risk scores
      // Format time as ISO 8601 without timezone (matching sample code format: "2026-01-22T21:00:00")
      const formatISO8601 = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      const now = new Date();
      const startTime = formatISO8601(now);
      // API allows up to 24 hours from now, so request 24 hours of data
      const endTime = formatISO8601(new Date(now.getTime() + 24 * 60 * 60 * 1000));

      const variables = [
        '2m_temperature',
        '100m_u_component_of_wind',
        '100m_v_component_of_wind',
        'total_precipitation',
        'surface_pressure',
        '2m_dewpoint_temperature'
      ];

      console.log('Fetching from Zeus API:', {
        endpoint: ZEUS_API_ENDPOINT,
        latitude,
        longitude,
        startTime,
        endTime,
        apiKeySet: !!ZEUS_API_KEY && ZEUS_API_KEY !== 'example123'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Fetch all variables in parallel
      const variablePromises = variables.map(variable => {
        const params = new URLSearchParams({
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          variable: variable,
          start_time: startTime,
          end_time: endTime
        });
        
        const url = `${ZEUS_API_ENDPOINT}?${params.toString()}`;
        const authHeader = `Bearer ${ZEUS_API_KEY}`;
        
        console.log(`Fetching ${variable} from: ${url}`);
        console.log(`Auth Header:`, authHeader.substring(0, 20) + '...');
        
        return fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
          }
        });
      });

      const responses = await Promise.all(variablePromises);
      clearTimeout(timeoutId);

      // Check if all requests succeeded
      const failed = responses.find(r => !r.ok);
      if (failed) {
        let errorText = '';
        try {
          errorText = await failed.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        
        console.error('Zeus API Error:', {
          status: failed.status,
          statusText: failed.statusText,
          url: failed.url,
          error: errorText,
          // Check for CORS issues
          corsIssue: failed.status === 0 ? 'Possible CORS issue - API may not allow browser requests' : undefined
        });
        
        // Provide helpful error message
        if (failed.status === 0) {
          throw new Error('CORS Error: The Zeus API may not allow direct browser requests. Consider using a proxy or backend service.');
        }
        
        throw new Error(`Zeus API Error: ${failed.status} ${failed.statusText} - ${errorText.substring(0, 200)}`);
      }

      // Parse all responses
      const dataMap: Record<string, any> = {};
      for (let i = 0; i < variables.length; i++) {
        try {
          const data = await responses[i].json();
          dataMap[variables[i]] = data;
        } catch (parseError) {
          console.error(`Failed to parse response for ${variables[i]}:`, parseError);
          throw new Error(`Failed to parse API response for ${variables[i]}`);
        }
      }

      // Map Zeus API response to our format
      const mappedLocation = this.mapZeusApiResponseToLocation(
        dataMap,
        latitude,
        longitude
      );

      return {
        location: mappedLocation,
        source: 'ZEUS_NODE'
      };

    } catch (error) {
      console.error('Zeus API call failed, falling back to simulation data:', {
        error: error instanceof Error ? error.message : String(error),
        latitude,
        longitude,
        apiKey: ZEUS_API_KEY ? '***' + ZEUS_API_KEY.slice(-4) : 'NOT SET',
        endpoint: ZEUS_API_ENDPOINT
      });
      
      // Generate mock data for the clicked coordinates
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockLocation = generateMockDataForCoordinates(latitude, longitude);
          resolve({
            location: mockLocation,
            source: 'ZEUS'
          });
        }, 800);
      });
    }
  }

  /**
   * Maps Zeus API response format to our WeatherLocation format
   * Zeus API returns data in format:
   * {
   *   "2m_temperature": { "data": [297.87, 298.85, ...], "unit": "K" },
   *   "time": { "data": ["2026-01-23 07:00:00+10:00", ...], "unit": "ISO 8601" },
   *   ...
   * }
   */
  private mapZeusApiResponseToLocation(
    dataMap: Record<string, any>,
    lat: number,
    lng: number
  ): WeatherLocation {
    // Get time array from any variable (they all have the same time array)
    const timeData = dataMap['2m_temperature']?.time?.data || [];
    const numHours = timeData.length;

    // Extract data arrays for each variable
    const tempData = dataMap['2m_temperature']?.data || [];
    const uWindData = dataMap['100m_u_component_of_wind']?.data || [];
    const vWindData = dataMap['100m_v_component_of_wind']?.data || [];
    const precipData = dataMap['total_precipitation']?.data || [];
    const pressureData = dataMap['surface_pressure']?.data || [];
    const dewpointData = dataMap['2m_dewpoint_temperature']?.data || [];

    // Build forecast array
    const forecast: ForecastHour[] = [];
    
    for (let i = 0; i < numHours; i++) {
      // Convert temperature from Kelvin to Celsius
      const tempC = tempData[i] ? tempData[i] - 273.15 : 0;
      
      // Calculate wind speed from u and v components (m/s to km/h)
      const uWind = uWindData[i] || 0;
      const vWind = vWindData[i] || 0;
      const windSpeedMs = Math.sqrt(uWind * uWind + vWind * vWind);
      const windSpeedKmh = windSpeedMs * 3.6; // Convert m/s to km/h
      
      // Calculate wind direction
      const windDirection = this.calculateWindDirection(uWind, vWind);
      
      // Precipitation in mm
      const precipitation = precipData[i] || 0;
      
      // Pressure in Pa, convert to hPa for display
      const pressurePa = pressureData[i] || 101325;
      
      // Calculate humidity from dewpoint (approximate)
      const dewpointC = dewpointData[i] ? dewpointData[i] - 273.15 : tempC;
      const humidity = this.calculateHumidityFromDewpoint(tempC, dewpointC);
      
      // Calculate risk score based on weather conditions
      const riskScore = this.calculateRiskScore({
        temperature: tempC,
        windSpeed: windSpeedKmh,
        precipitation,
        pressure: pressurePa / 100, // Convert to hPa
        humidity
      });

      forecast.push({
        hourOffset: i,
        timestamp: timeData[i] || new Date(Date.now() + i * 3600000).toISOString(),
        temperature: Math.round(tempC),
        humidity: Math.round(humidity),
        windSpeed: Math.round(windSpeedKmh),
        windDirection,
        cloudCover: 0, // Not available in Zeus API
        precipitationProbability: precipitation > 0 ? Math.min(100, precipitation * 10) : 0,
        description: this.getWeatherDescription(tempC, precipitation, windSpeedKmh),
        riskScore: Math.min(1.0, Math.max(0.0, riskScore))
      });
    }

    return {
      id: `coord-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      name: `${lat >= 0 ? lat.toFixed(2) + '°N' : Math.abs(lat).toFixed(2) + '°S'}, ${lng >= 0 ? lng.toFixed(2) + '°E' : Math.abs(lng).toFixed(2) + '°W'}`,
      country: 'Unknown',
      latitude: lat,
      longitude: lng,
      current: forecast[0] || this.getDefaultCondition(),
      forecast: forecast
    };
  }

  private calculateWindDirection(uWind: number, vWind: number): string {
    // Convert u (eastward) and v (northward) components to direction
    const angle = Math.atan2(uWind, vWind) * 180 / Math.PI;
    const normalizedAngle = (angle + 360) % 360;
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(normalizedAngle / 45) % 8;
    return directions[index];
  }

  private calculateHumidityFromDewpoint(tempC: number, dewpointC: number): number {
    // Simplified humidity calculation using Magnus formula
    const a = 17.27;
    const b = 237.7;
    const alpha = (a * tempC) / (b + tempC);
    const alphaDew = (a * dewpointC) / (b + dewpointC);
    const humidity = 100 * Math.exp(alphaDew - alpha);
    return Math.min(100, Math.max(0, humidity));
  }

  private calculateRiskScore(conditions: {
    temperature: number;
    windSpeed: number;
    precipitation: number;
    pressure: number;
    humidity: number;
  }): number {
    let risk = 0;

    // Temperature extremes (very hot or very cold)
    if (conditions.temperature > 35) risk += 0.2;
    if (conditions.temperature < -10) risk += 0.2;
    if (conditions.temperature > 40 || conditions.temperature < -20) risk += 0.2;

    // High wind speed (storm conditions)
    if (conditions.windSpeed > 50) risk += 0.3; // 50 km/h
    if (conditions.windSpeed > 75) risk += 0.2; // 75 km/h (strong gale)
    if (conditions.windSpeed > 100) risk += 0.2; // 100 km/h (hurricane force)

    // Heavy precipitation
    if (conditions.precipitation > 10) risk += 0.2; // 10mm
    if (conditions.precipitation > 25) risk += 0.2; // 25mm (heavy rain)
    if (conditions.precipitation > 50) risk += 0.2; // 50mm (extreme)

    // Low pressure (storm systems)
    if (conditions.pressure < 1000) risk += 0.1; // Low pressure
    if (conditions.pressure < 980) risk += 0.2; // Very low pressure

    // High humidity with high temperature (heat index)
    if (conditions.humidity > 80 && conditions.temperature > 30) risk += 0.1;

    return Math.min(1.0, risk);
  }

  private getWeatherDescription(temp: number, precip: number, wind: number): string {
    if (precip > 10) return 'Heavy Rain';
    if (precip > 5) return 'Rain';
    if (precip > 0) return 'Light Rain';
    if (wind > 75) return 'Storm';
    if (wind > 50) return 'Strong Wind';
    if (wind > 30) return 'Windy';
    if (temp > 30) return 'Hot';
    if (temp < 0) return 'Cold';
    return 'Clear Sky';
  }

  private getDefaultCondition() {
    return {
      temperature: 0,
      humidity: 0,
      windSpeed: 0,
      windDirection: 'N',
      cloudCover: 0,
      precipitationProbability: 0,
      description: 'Unknown',
      riskScore: 0
    };
  }

  private mapCondition(c: any): any {
    if (!c) return {};
    return {
      temperature: c.temp || c.temperature || 0,
      humidity: c.humidity || 0,
      windSpeed: c.wind_speed || c.windSpeed || 0,
      windDirection: c.wind_dir || c.windDirection || 'N',
      cloudCover: c.cloud_cover || c.cloudCover || 0,
      precipitationProbability: c.precip_prob || c.precipitationProbability || 0,
      description: c.condition || c.description || 'Unknown',
      riskScore: c.risk_score || c.riskScore || 0
    };
  }
}

export const weatherService = new WeatherService();