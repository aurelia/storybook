import {
  argTypesEnhancers,
  defineAureliaStory,
  parameters,
  render,
  renderToCanvas,
} from '../src/preview';
import * as renderModule from '../src/preview/render';

describe('preview annotations', () => {
  it('exports the renderer functions Storybook loads automatically', () => {
    expect(render).toBe(renderModule.render);
    expect(renderToCanvas).toBe(renderModule.renderToCanvas);
    expect(parameters.renderer).toBe('aurelia');
    expect(argTypesEnhancers).toHaveLength(1);
  });

  it('returns the original object from defineAureliaStory', () => {
    const story = { template: '<div></div>' };
    expect(defineAureliaStory(story)).toBe(story);
  });
});
