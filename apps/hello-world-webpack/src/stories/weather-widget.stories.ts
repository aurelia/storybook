import { Registration } from 'aurelia';
import { fn, userEvent, within } from 'storybook/test';
import { WeatherWidget } from '../components/weather-widget';
import { IWeatherService, WeatherService, WeatherSummary } from '../services/weather-service';

const mockService: WeatherService = {
  async getWeather(location: string): Promise<WeatherSummary> {
    return {
      location,
      condition: location.includes('Berlin') ? 'Cloudy' : 'Sunny',
      temperature: location.includes('Berlin') ? 16 : 24,
      high: location.includes('Berlin') ? 18 : 27,
      low: location.includes('Berlin') ? 11 : 19,
    };
  },
};

const meta = {
  title: 'Dashboard/WeatherWidget',
  component: WeatherWidget,
  parameters: {
    layout: 'centered',
  },
  render: (args) => ({
    template: `<weather-widget location.bind="location"></weather-widget>`,
    props: args,
    components: [WeatherWidget],
    items: [Registration.instance(IWeatherService, mockService)],
  }),
};

export default meta;

type Story = typeof meta;

export const DefaultWeather = {
  args: {
    location: 'Seattle, WA',
  },
};

export const EuropeanCity = {
  args: {
    location: 'Berlin, Germany',
  },
};

export const RefreshInteraction = {
  args: {
    location: 'Lisbon, Portugal',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const refreshButton = await canvas.findByRole('button', { name: /refresh/i });
    await userEvent.click(refreshButton);
  },
};
