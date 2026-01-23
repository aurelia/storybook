import { defineAureliaStory } from '@aurelia/storybook';
import { fn, userEvent, within } from 'storybook/test';
import { NotificationCenter, NotificationItem } from '../components/notification-center';

type NotificationCenterArgs = {
  notifications: NotificationItem[];
  maxVisible?: number;
  showTimestamp?: boolean;
  onDismiss?: (item: NotificationItem) => void;
};

const baseNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'Build succeeded',
    message: 'Main pipeline finished in 4m 12s.',
    level: 'success',
    timestamp: 'Today - 09:24',
  },
  {
    id: 2,
    title: 'New comment',
    message: 'Samira replied to your review on PR #512.',
    level: 'info',
    timestamp: 'Today - 08:51',
  },
  {
    id: 3,
    title: 'Usage warning',
    message: 'API quota is at 85% of the monthly allocation.',
    level: 'warning',
    timestamp: 'Yesterday - 17:05',
  },
  {
    id: 4,
    title: 'Error spike',
    message: 'Synthetic tests detected an uptick in 500s.',
    level: 'error',
    timestamp: 'Yesterday - 15:33',
  },
];

const meta = {
  title: 'Dashboard/NotificationCenter',
  component: NotificationCenter,
  render: (args: NotificationCenterArgs) =>
    defineAureliaStory({
      template: `<notification-center notifications.bind="notifications"
                                       max-visible.bind="maxVisible"
                                       on-dismiss.bind="onDismiss"
                                       show-timestamp.bind="showTimestamp"></notification-center>`,
      props: args,
      components: [NotificationCenter],
    }),
};

export default meta;

export const DefaultNotifications = {
  args: {
    notifications: baseNotifications,
    maxVisible: 3,
    showTimestamp: true,
    onDismiss: fn(),
  },
};

export const CompactList = {
  args: {
    notifications: baseNotifications.slice(0, 2),
    maxVisible: 2,
    onDismiss: fn(),
    showTimestamp: false,
  },
};

export const Interactions = {
  args: {
    notifications: baseNotifications,
    maxVisible: 4,
    onDismiss: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dismissButtons = await canvas.findAllByRole('button', { name: /dismiss/i });
    await userEvent.click(dismissButtons[0]);
  },
};
