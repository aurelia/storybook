import { defineAureliaStory } from '@aurelia/storybook';
import { fn, userEvent, within } from 'storybook/test';
import { FeedbackForm } from '../components/feedback-form';

type FeedbackFormArgs = {
  topics: string[];
  submitting?: boolean;
  onSubmit?: (payload: unknown) => void;
};

const meta = {
  title: 'Dashboard/FeedbackForm',
  component: FeedbackForm,
  parameters: {
    layout: 'centered',
  },
  render: (args: FeedbackFormArgs) =>
    defineAureliaStory({
      template: `<feedback-form topics.bind="topics"
                                submitting.bind="submitting"
                                on-submit.bind="onSubmit"></feedback-form>`,
      props: args,
      components: [FeedbackForm],
    }),
};

export default meta;

export const DefaultForm = {
  args: {
    topics: ['Bug report', 'Feature request', 'General question'],
    onSubmit: fn(),
    submitting: false,
  },
};

export const SubmittingState = {
  args: {
    topics: ['Design review', 'Accessibility', 'Performance'],
    submitting: true,
    onSubmit: fn(),
  },
};

export const FillAndSubmit = {
  args: {
    topics: ['Beta feedback', 'Success story'],
    onSubmit: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText('Name'), 'Jordan');
    await userEvent.type(canvas.getByLabelText('Email'), 'jordan@example.com');
    await userEvent.selectOptions(canvas.getByLabelText('Topic'), 'Success story');
    await userEvent.type(canvas.getByLabelText('Message'), 'The new timeline view is great');
    await userEvent.click(canvas.getByRole('button', { name: /send feedback/i }));
  },
};
