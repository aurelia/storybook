import { expect, test } from './storybook';

test('autodocs lists bindables and shows Aurelia source', async ({ storybook }) => {
  await storybook.openDocs('example-helloworld--docs');
  const { page } = storybook;

  // Stories render inline inside the docs page.
  await expect(
    page.getByRole('heading', { name: 'Hello from Aurelia Storybook' }).first()
  ).toBeVisible();

  // Bindables become rows of the args table, grouped under "bindables".
  const argsTable = page.locator('.docblock-argstable').first();
  await expect(argsTable.getByText('bindables', { exact: true })).toBeVisible();
  await expect(argsTable.getByRole('row', { name: /message/ })).toBeVisible();
  await expect(argsTable.getByRole('row', { name: /onIncrement/ })).toBeVisible();

  // The dynamic source block shows the generated Aurelia markup.
  await page.getByRole('switch', { name: 'Show code' }).first().click();
  await expect(page.locator('#storybook-docs')).toContainText(
    '<hello-world message.bind="message" on-increment.bind="onIncrement">'
  );
});

test('MDX pages render stories and controls', async ({ storybook }) => {
  await storybook.openDocs('integration-frameworkfeatures--docs');
  const { page } = storybook;

  await expect(
    page.getByText(
      'Aurelia stories use the same CSF, docs, controls, loaders, globals, decorators, and play functions as other Storybook renderers.'
    )
  ).toBeVisible();
  await expect(
    page.getByText('Rendered without a custom render function').first()
  ).toBeVisible();
  await expect(page.locator('.docblock-argstable').first()).toBeVisible();
});
