export interface WeatherData {
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
}

export interface WeatherResponse {
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    humidity: number;
  };
  wind: {
    speed: number;
  };
  name: string;
}

class WeatherApiService {
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not found. Weather data will use mock data.');
    }
  }

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    if (!this.apiKey) {
      // Return mock data if no API key
      return this.getMockWeatherData();
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=ja`
      );

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('OpenWeatherMap API key is invalid or unauthorized. Using mock data.');
        } else {
          console.warn(`Weather API error: ${response.status}. Using mock data.`);
        }
        return this.getMockWeatherData();
      }

      const data: WeatherResponse = await response.json();
      
      return {
        condition: data.weather[0].main.toLowerCase(),
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        description: data.weather[0].description,
        icon: data.weather[0].icon,
      };
    } catch (error) {
      console.warn('Weather API request failed:', error);
      // Return mock data on error
      return this.getMockWeatherData();
    }
  }

  private getMockWeatherData(): WeatherData {
    return {
      condition: 'clear',
      temperature: 22,
      humidity: 60,
      windSpeed: 5,
      description: '晴れ',
      icon: '01d',
    };
  }

  getWeatherEmoji(condition: string): string {
    const emojiMap: Record<string, string> = {
      clear: '☀️',
      clouds: '☁️',
      rain: '🌧️',
      drizzle: '🌦️',
      thunderstorm: '⛈️',
      snow: '❄️',
      mist: '🌫️',
      fog: '🌫️',
      haze: '🌫️',
    };
    
    return emojiMap[condition.toLowerCase()] || '🌤️';
  }
}

export const weatherApi = new WeatherApiService();