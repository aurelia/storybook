import { expect, test } from './storybook';

test('indexes stories, autodocs and MDX', async ({ storybook }) => {
  const entries = await storybook.index();
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  for (const id of [
    'example-helloworld--default-hello-world',
    'integration-csffactories--factory-story',
    'integration-csffactories--extended-factory-story',
    'integration-frameworkfeatures--mounted-from-play-function',
  ]) {
    expect(byId.get(id)?.type, id).toBe('story');
  }
  // Autodocs page generated from the `autodocs` tag, and a hand-written MDX page.
  expect(byId.get('example-helloworld--docs')?.type).toBe('docs');
  expect(byId.get('integration-frameworkfeatures--docs')?.type).toBe('docs');
});

test('every story renders and passes its play function', async ({ storybook }) => {
  const stories = (await storybook.index()).filter((entry) => entry.type === 'story');
  expect(stories.length).toBeGreaterThan(20);
  test.setTimeout(stories.length * 10_000);

  for (const story of stories) {
    await test.step(`${story.title} / ${story.name}`, async () => {
      const finished = await storybook.open(story.id);
      expect.soft(finished.status, `${story.id} status`).toBe('success');
      expect.soft(await storybook.showsError(), `${story.id} error overlay`).toBe(false);
      await expect
        .soft(storybook.page.locator('#storybook-root'), `${story.id} is empty`)
        .not.toBeEmpty();
    });
  }
});
