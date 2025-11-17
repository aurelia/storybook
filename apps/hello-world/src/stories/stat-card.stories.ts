import { fn, userEvent, within } from 'storybook/test';
import { StatCard } from '../components/stat-card';

const meta = {
  title: 'Dashboard/StatCard',
  component: StatCard,
  parameters: {
    layout: 'centered',
  },
  render: (args) => ({
    components: [StatCard],
    template: `<stat-card title.bind="title"
                          value.bind="value"
                          unit.bind="unit"
                          change.bind="change"
                          change-copy.bind="changeCopy"
                          description.bind="description"
                          on-refresh.bind="onRefresh"></stat-card>`,
    props: args,
  }),
};

export default meta;

type Story = typeof meta;

export const DefaultCard = {
  args: {
    title: 'Active users',
    value: 1284,
    unit: '',
    change: 12.5,
    changeCopy: 'vs last week',
    description: 'Rolling 7-day average of unique user sessions.',
    onRefresh: fn(),
  },
};

export const NegativeTrend = {
  args: {
    title: 'NPS score',
    value: 42,
    change: -6.3,
    changeCopy: 'vs previous survey',
    description: 'Direct feedback collected from in-app survey responses.',
    onRefresh: fn(),
  },
};

export const ManualRefreshDemo = {
  args: {
    title: 'Deploy success rate',
    value: '99.2',
    unit: '%',
    change: 1.1,
    changeCopy: 'vs last 24h',
    description: 'Completed deploys without rollbacks.',
    onRefresh: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const refreshButton = await canvas.findByRole('button', { name: /refresh metric/i });
    await userEvent.click(refreshButton);
  },
};
