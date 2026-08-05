import {
  argTypesEnhancers,
  extractArgTypes,
  extractComponentDescription,
} from '../src/preview/argtypes';

const mocks = vi.hoisted(() => ({
  enhanceArgTypes: vi.fn(),
  getDefinition: vi.fn(),
  isType: vi.fn(),
}));

vi.mock('aurelia', () => ({
  CustomElement: {
    getDefinition: mocks.getDefinition,
    isType: mocks.isType,
  },
}));

vi.mock('storybook/internal/docs-tools', () => ({
  enhanceArgTypes: mocks.enhanceArgTypes,
}));

describe('Aurelia docs metadata', () => {
  it('extracts controls metadata from bindables', () => {
    mocks.isType.mockReturnValue(true);
    mocks.getDefinition.mockReturnValue({
      bindables: {
        heading: { name: 'heading', attribute: 'heading' },
        itemCount: { name: 'itemCount', attribute: 'item-count' },
      },
    });

    expect(extractArgTypes(class {})).toEqual({
      heading: {
        name: 'heading',
        type: { name: 'other', value: 'Aurelia bindable' },
        table: {
          category: 'bindables',
          type: { summary: 'heading' },
        },
      },
      itemCount: {
        name: 'itemCount',
        type: { name: 'other', value: 'Aurelia bindable' },
        table: {
          category: 'bindables',
          type: { summary: 'item-count' },
        },
      },
    });
  });

  it('ignores values that are not Aurelia custom elements', () => {
    mocks.isType.mockReturnValue(false);
    expect(extractArgTypes(class {})).toBeNull();
    expect(mocks.getDefinition).not.toHaveBeenCalled();
  });

  it('uses docgen descriptions before static descriptions', () => {
    const Component = class {} as unknown as {
      description: string;
      __docgenInfo: { description: string };
    };
    Component.description = 'Static description';
    Component.__docgenInfo = { description: 'Docgen description' };

    expect(extractComponentDescription(Component as never)).toBe(
      'Docgen description'
    );
    expect(extractComponentDescription(class {})).toBe('');
  });

  it('publishes Storybook\'s standard arg type enhancer', () => {
    expect(argTypesEnhancers).toEqual([mocks.enhanceArgTypes]);
  });
});
