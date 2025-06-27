import { MyApp } from './my-app';

const meta = {
  title: 'Example/MyApp',
  component: MyApp,
  render: () => ({
    template: `<my-app></my-app>`,
  }),
};

export default meta;

export const Default = {
  args: {}
}; 