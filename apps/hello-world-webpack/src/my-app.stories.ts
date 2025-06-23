import { MyApp } from './my-app';

export default {
  title: 'My-App',
  component: MyApp,
};

export const Default = () => ({
  Component: MyApp,
  template: '<my-app></my-app>',
  props: {}
}); 