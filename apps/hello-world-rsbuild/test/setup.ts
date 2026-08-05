import { BrowserPlatform } from '@aurelia/platform-browser';
import { setPlatform, onFixtureCreated, type IFixture } from '@aurelia/testing';
import { beforeAll, afterEach } from 'vitest';

// Sets up the Aurelia environment for testing
function bootstrapTextEnv() {
  const platform = new BrowserPlatform(window);
  setPlatform(platform);
  BrowserPlatform.set(globalThis, platform);
}

const fixtures: IFixture<object>[] = [];
beforeAll(() => {
  bootstrapTextEnv();
  onFixtureCreated(fixture => {
    fixtures.push(fixture);
  });
});

afterEach(async () => {
  await Promise.all(fixtures.map(async (fixture) => fixture.stop(true)));
  fixtures.length = 0;
});
