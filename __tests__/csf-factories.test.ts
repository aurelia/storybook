import type { Decorator } from '../src/preview/types';
import { definePreview } from '../src/preview/csf-factories';

class FactoryComponent {
  label = '';
  disabled = false;
}

const preview = definePreview({
  addons: [],
  parameters: { layout: 'centered' },
});

describe('CSF Factories', () => {
  it('composes Aurelia renderer annotations with factory stories', () => {
    const meta = preview.meta({
      component: FactoryComponent,
      args: { label: 'From metadata' },
    });
    const Primary = meta.story({
      args: { label: 'From the story', disabled: false },
    });

    expect(Primary.input.args).toEqual({
      label: 'From the story',
      disabled: false,
    });
    expect(Primary.composed.parameters).toMatchObject({
      layout: 'centered',
      renderer: 'aurelia',
      docs: {
        source: { language: 'html' },
      },
    });
  });

  it('infers args supplied by decorators and explicit preview types', () => {
    const withFeatureFlag: Decorator<{ featureEnabled: boolean }> = (
      Story
    ) => Story();
    const typedPreview = preview.type<{ args: { requiredCopy: string } }>();
    const meta = typedPreview.meta({
      component: FactoryComponent,
      decorators: [withFeatureFlag],
    });
    const Typed = meta.story({
      args: {
        label: 'Typed',
        requiredCopy: 'Required',
        featureEnabled: true,
      },
    });

    expect(Typed.input.args).toMatchObject({
      requiredCopy: 'Required',
      featureEnabled: true,
    });
  });

  it('supports factory story extension', () => {
    const meta = preview.meta({ component: FactoryComponent });
    const Enabled = meta.story({ args: { label: 'Enabled', disabled: false } });
    const Disabled = Enabled.extend({ args: { disabled: true } });

    expect(Disabled.input.args).toEqual({
      label: 'Enabled',
      disabled: true,
    });
  });
});
