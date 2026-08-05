import { CustomElement } from 'aurelia';
import { enhanceArgTypes } from 'storybook/internal/docs-tools';
import type { ArgTypes } from 'storybook/internal/types';
import type { AureliaComponent, AureliaRenderer } from './types';

export function extractArgTypes(
  component: AureliaRenderer['component']
): ArgTypes | null {
  if (!component || !CustomElement.isType(component)) {
    return null;
  }

  const definition = CustomElement.getDefinition(component);
  return Object.fromEntries(
    Object.values(definition.bindables ?? {}).map((bindable) => [
      bindable.name,
      {
        name: bindable.name,
        type: { name: 'other', value: 'Aurelia bindable' },
        table: {
          category: 'bindables',
          type: { summary: bindable.attribute },
        },
      },
    ])
  );
}

export function extractComponentDescription(component: AureliaComponent): string {
  const candidate = component as AureliaComponent & {
    description?: unknown;
    __docgenInfo?: { description?: unknown };
  };
  const description =
    candidate.__docgenInfo?.description ?? candidate.description;
  return typeof description === 'string' ? description : '';
}

export const argTypesEnhancers = [enhanceArgTypes];
