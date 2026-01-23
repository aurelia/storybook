import { defineAureliaStory, render, renderToCanvas } from '../src/preview';
import * as renderUtils from '../src/preview/render';

describe('preview', () => {
  it('re-exports render', () => {
    expect(render).toBe(renderUtils.render);
  });

  it('re-exports renderToCanvas', () => {
    expect(renderToCanvas).toBe(renderUtils.renderToCanvas);
  });

  it('returns the provided story result from defineAureliaStory', () => {
    const story = { template: '<div></div>' };
    expect(defineAureliaStory(story)).toBe(story);
  });
}); 
