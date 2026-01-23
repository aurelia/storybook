import { defineAureliaStory } from '@aurelia/storybook';
import { MyApp } from './my-app';

const meta = {
  title: 'Example/MyApp',
  component: MyApp,
  render: () =>
    defineAureliaStory({
      template: `<my-app></my-app>`,
    }),
};

export default meta;

export const Default = {
  args: {}
}; 
