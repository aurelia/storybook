import { bindable } from 'aurelia';
import { IWeatherService, WeatherSummary, WeatherService } from '../services/weather-service';

export class WeatherWidget {
  static inject = [IWeatherService];

  constructor(private readonly service: WeatherService) {}

  @bindable() location = 'Seattle, WA';

  report: WeatherSummary | null = null;
  state: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  error = '';

  binding() {
    void this.refresh();
  }

  async refresh() {
    try {
      this.state = 'loading';
      this.error = '';
      const location = this.location ?? 'Seattle, WA';
      this.report = await this.service.getWeather(location);
      this.state = 'ready';
    } catch (err) {
      this.state = 'error';
      this.error = err instanceof Error ? err.message : 'Unable to load weather data.';
    }
  }
}
