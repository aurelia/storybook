import { expect, test } from '@playwright/test';

// These go through the full Storybook UI: sidebar, preview iframe and addon panel.
test('editing a control updates the running story', async ({ page }) => {
  await page.goto('?path=/story/example-helloworld--default-hello-world');
  const preview = page.frameLocator('#storybook-preview-iframe');

  await expect(
    preview.getByRole('heading', { name: 'Hello from Aurelia Storybook' })
  ).toBeVisible();
  await preview.getByRole('button', { name: 'Increment' }).click();
  await expect(preview.getByText('Counter: 1')).toBeVisible();

  await page.locator('#control-message').fill('Edited in the controls panel');

  await expect(
    preview.getByRole('heading', { name: 'Edited in the controls panel' })
  ).toBeVisible();
  // The counter survives, so the Aurelia app was updated rather than restarted.
  await expect(preview.getByText('Counter: 1')).toBeVisible();
});

test('navigating the sidebar swaps stories', async ({ page }) => {
  await page.goto('?path=/story/example-helloworld--default-hello-world');
  const preview = page.frameLocator('#storybook-preview-iframe');
  await expect(preview.locator('hello-world')).toHaveCount(1);

  await page.locator('#example-helloworld--no-args').click();

  await expect(page).toHaveURL(/example-helloworld--no-args/);
  await expect(
    preview.getByRole('heading', { name: 'Hello from Aurelia!' })
  ).toBeVisible();
  await expect(preview.locator('hello-world')).toHaveCount(1);
});
