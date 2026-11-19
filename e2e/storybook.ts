import { expect, test as base, type Page } from '@playwright/test';

export interface IndexEntry {
  id: string;
  type: 'story' | 'docs';
  title: string;
  name: string;
}

export interface StoryFinished {
  storyId: string;
  status: 'success' | 'error';
  reporters: { type: string; status: string }[];
}

type StorybookWindow = Window & {
  __finishedStories: StoryFinished[];
  __STORYBOOK_ADDONS_CHANNEL__: {
    emit: (event: string, ...args: unknown[]) => void;
    on: (event: string, listener: (payload: never) => void) => void;
  };
};

/**
 * Records every `storyFinished` event the preview emits. Storybook reports the
 * outcome of the whole render there: loaders, mount, play function and addon
 * reports such as accessibility checks.
 */
async function recordFinishedStories(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as unknown as StorybookWindow;
    let channel: StorybookWindow['__STORYBOOK_ADDONS_CHANNEL__'] | undefined;
    target.__finishedStories = [];
    Object.defineProperty(target, '__STORYBOOK_ADDONS_CHANNEL__', {
      configurable: true,
      get: () => channel,
      set: (next: StorybookWindow['__STORYBOOK_ADDONS_CHANNEL__']) => {
        channel = next;
        next.on('storyFinished', (payload: StoryFinished) => {
          target.__finishedStories.push(payload);
        });
      },
    });
  });
}

export class StoryPage {
  readonly errors: string[] = [];

  constructor(readonly page: Page) {
    page.on('pageerror', (error) => this.errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        this.errors.push(message.text());
      }
    });
  }

  /** Opens a story in the preview iframe and waits for it to finish. */
  async open(storyId: string): Promise<StoryFinished> {
    await this.page.goto(`iframe.html?viewMode=story&id=${storyId}`);
    return this.finished(storyId);
  }

  async openDocs(docsId: string): Promise<void> {
    await this.page.goto(`iframe.html?viewMode=docs&id=${docsId}`);
    await expect(this.page.locator('#storybook-docs')).toBeVisible();
  }

  /** Waits for the given story's render, including its play function, to finish. */
  async finished(storyId: string): Promise<StoryFinished> {
    const handle = await this.page.waitForFunction(
      (id) =>
        (window as unknown as StorybookWindow).__finishedStories?.find(
          (story) => story.storyId === id
        ),
      storyId
    );
    return (await handle.jsonValue()) as StoryFinished;
  }

  /** Sends an event over Storybook's channel, as the manager UI would. */
  async emit(event: string, payload: unknown): Promise<void> {
    await this.page.evaluate(
      ([name, data]) =>
        (window as unknown as StorybookWindow).__STORYBOOK_ADDONS_CHANNEL__.emit(
          name as string,
          data
        ),
      [event, payload] as const
    );
  }

  async updateArgs(storyId: string, updatedArgs: Record<string, unknown>) {
    await this.emit('updateStoryArgs', { storyId, updatedArgs });
  }

  /** Whether Storybook is showing its error overlay instead of the story. */
  async showsError(): Promise<boolean> {
    return this.page.evaluate(
      () =>
        document.body.classList.contains('sb-show-errordisplay') ||
        document.body.classList.contains('sb-show-nopreview')
    );
  }

  async index(): Promise<IndexEntry[]> {
    const response = await this.page.request.get('index.json');
    expect(response.ok()).toBe(true);
    const { entries } = (await response.json()) as {
      entries: Record<string, IndexEntry>;
    };
    return Object.values(entries);
  }
}

export const test = base.extend<{ storybook: StoryPage }>({
  storybook: async ({ page }, use) => {
    await recordFinishedStories(page);
    const storybook = new StoryPage(page);
    await use(storybook);
    expect(storybook.errors, 'browser errors').toEqual([]);
  },
});

export { expect };
