import { DI } from 'aurelia';

export interface WeatherSummary {
  location: string;
  condition: string;
  temperature: number;
  high: number;
  low: number;
}

export interface WeatherService {
  getWeather(location: string): Promise<WeatherSummary>;
}

export const IWeatherService = DI.createInterface<WeatherService>('IWeatherService');
