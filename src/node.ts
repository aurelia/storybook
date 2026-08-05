import type {
  CompatibleString,
  StorybookConfig as StorybookConfigBase,
} from 'storybook/internal/types';

export type FrameworkName = CompatibleString<'@aurelia/storybook'>;
export type BuilderName = CompatibleString<
  | '@storybook/builder-vite'
  | '@storybook/builder-webpack5'
  | 'storybook-builder-rsbuild'
>;

export type FrameworkOptions = Record<string, never>;

type StorybookConfigFramework = {
  framework:
    | FrameworkName
    | {
        name: FrameworkName;
        options?: FrameworkOptions;
      };
  core?: Omit<NonNullable<StorybookConfigBase['core']>, 'builder'> & {
    builder?:
      | BuilderName
      | {
          name: BuilderName;
          options?: Record<string, unknown>;
        };
  };
};

/** Storybook main configuration for the Aurelia framework and supported builders. */
export type StorybookConfig = Omit<
  StorybookConfigBase,
  keyof StorybookConfigFramework
> &
  StorybookConfigFramework;

/** Defines a type-safe Storybook main configuration. */
export function defineMain(config: StorybookConfig): StorybookConfig {
  return config;
}
