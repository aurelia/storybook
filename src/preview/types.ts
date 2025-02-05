import type { Renderer } from '@storybook/types';

export interface AureliaRenderer extends Renderer {
    /** The DOM element in which the story is rendered */
    canvasElement: HTMLElement;
  }
  