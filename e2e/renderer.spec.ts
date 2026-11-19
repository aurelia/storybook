import { expect, test } from './storybook';

const defaultStory = 'example-helloworld--default-hello-world';
const noArgsStory = 'example-helloworld--no-args';
const globalsStory = 'integration-frameworkfeatures--loader-globals-and-decorator';

test('renders the component inside the story container with args bound', async ({
  storybook,
}) => {
  await storybook.open(defaultStory);
  const { page } = storybook;

  const container = page.locator('#storybook-root > .aurelia-story-container');
  await expect(container).toHaveCount(1);
  await expect(container.locator('> hello-world')).toHaveCount(1);
  await expect(
    page.getByRole('heading', { name: 'Hello from Aurelia Storybook' })
  ).toBeVisible();
});

test('updates args on the running app without remounting it', async ({
  storybook,
}) => {
  await storybook.open(defaultStory);
  const { page } = storybook;

  // Component state and DOM identity both survive only if the app keeps running.
  await page.getByRole('button', { name: 'Increment' }).click();
  await expect(page.getByText('Counter: 1')).toBeVisible();
  await page.locator('hello-world').evaluate((element) => {
    element.setAttribute('data-e2e-marker', 'kept');
  });

  await storybook.updateArgs(defaultStory, { message: 'Updated from controls' });

  await expect(
    page.getByRole('heading', { name: 'Updated from controls' })
  ).toBeVisible();
  await expect(page.getByText('Counter: 1')).toBeVisible();
  await expect(page.locator('hello-world')).toHaveAttribute(
    'data-e2e-marker',
    'kept'
  );
});

test('keeps component defaults for omitted bindables and remounts when one is added', async ({
  storybook,
}) => {
  await storybook.open(noArgsStory);
  const { page } = storybook;

  await expect(
    page.getByRole('heading', { name: 'Hello from Aurelia!' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Increment' }).click();
  await expect(page.getByText('Counter: 1')).toBeVisible();

  // A newly bound bindable changes the generated template, so the app restarts.
  await storybook.updateArgs(noArgsStory, { message: 'Now bound' });

  await expect(page.getByRole('heading', { name: 'Now bound' })).toBeVisible();
  await expect(page.getByText('Counter: 0')).toBeVisible();
  await expect(page.locator('hello-world')).toHaveCount(1);
});

test('restores component defaults when args are reset', async ({ storybook }) => {
  await storybook.open(noArgsStory);
  const { page } = storybook;

  await storybook.updateArgs(noArgsStory, { message: 'Temporary' });
  await expect(page.getByRole('heading', { name: 'Temporary' })).toBeVisible();

  await storybook.emit('resetStoryArgs', { storyId: noArgsStory });
  await expect(
    page.getByRole('heading', { name: 'Hello from Aurelia!' })
  ).toBeVisible();
});

test('re-renders when a toolbar global changes', async ({ storybook }) => {
  await storybook.open(globalsStory);
  const { page } = storybook;

  await expect(page.getByLabel('Decorated story')).toBeVisible();
  await expect(
    page.getByText('Loader finished before the story rendered')
  ).toBeVisible();
  await expect(page.getByText('Toolbar theme: light')).toBeVisible();

  await storybook.emit('updateGlobals', { globals: { theme: 'dark' } });
  await expect(page.getByText('Toolbar theme: dark')).toBeVisible();
});

test('tears the previous app down when switching stories', async ({ storybook }) => {
  await storybook.open(defaultStory);
  const { page } = storybook;

  const nextStory = 'dashboard-statcard--default-card';
  await storybook.emit('setCurrentStory', { storyId: nextStory, viewMode: 'story' });
  await storybook.finished(nextStory);

  await expect(page.locator('stat-card')).toHaveCount(1);
  await expect(page.locator('hello-world')).toHaveCount(0);
  await expect(page.locator('.aurelia-story-container > *')).toHaveCount(1);

  // And back again: the first story mounts fresh, with no leftover state.
  await storybook.emit('setCurrentStory', { storyId: noArgsStory, viewMode: 'story' });
  await storybook.finished(noArgsStory);
  await expect(page.locator('hello-world')).toHaveCount(1);
  await expect(page.locator('stat-card')).toHaveCount(0);
  await expect(page.getByText('Counter: 0')).toBeVisible();
});

test('calls action args from component events', async ({ storybook }) => {
  const finished = await storybook.open('example-helloworld--interactive-hello-world');
  // The play function clicks three times and asserts on the spy.
  expect(finished.status).toBe('success');
  await expect(storybook.page.getByText('Counter: 3')).toBeVisible();
});

test('mounts from a play function', async ({ storybook }) => {
  const finished = await storybook.open(
    'integration-frameworkfeatures--mounted-from-play-function'
  );
  expect(finished.status).toBe('success');
  await expect(
    storybook.page.getByRole('heading', { name: 'Mounted from the play function' })
  ).toBeVisible();
});

test('projects innerHtml into the component slot', async ({ storybook }) => {
  await storybook.open('integration-frameworkfeatures--component-with-slot-content');
  await expect(
    storybook.page.locator('hello-world strong', {
      hasText: 'Projected through <au-slot>',
    })
  ).toBeVisible();
});
