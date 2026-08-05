import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const targets = [
  ['Vite', 'apps/hello-world/storybook-static'],
  ['Webpack 5', 'apps/hello-world-webpack/storybook-static'],
  ['Rsbuild/Rspack', 'apps/hello-world-rsbuild/storybook-static'],
];

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2',
};

async function existingFile(pathname) {
  try {
    const details = await stat(pathname);
    return details.isDirectory() ? join(pathname, 'index.html') : pathname;
  } catch {
    return undefined;
  }
}

async function startStaticServer(directory) {
  const root = resolve(repositoryRoot, directory);
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url ?? '/', 'http://127.0.0.1').pathname
      );
      const requestedPath = resolve(root, `.${pathname}`);
      const outsideRoot =
        requestedPath !== root && !requestedPath.startsWith(`${root}${sep}`);
      if (outsideRoot) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const file =
        (await existingFile(requestedPath)) ??
        (extname(requestedPath) ? undefined : join(root, 'index.html'));
      if (!file) {
        response.writeHead(404).end('Not found');
        return;
      }

      const body = await readFile(file);
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type':
          contentTypes[extname(file)] ?? 'application/octet-stream',
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });

  await new Promise((resolveListening, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListening);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error(`Unable to start a static server for ${directory}`);
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
    root,
  };
}

async function verifyIndex(root, builder) {
  const index = JSON.parse(await readFile(join(root, 'index.json'), 'utf8'));
  const entries = index.entries ?? {};
  const requiredEntries = [
    'integration-csffactories--factory-story',
    'integration-csffactories--extended-factory-story',
    'integration-frameworkfeatures--docs',
  ];

  for (const id of requiredEntries) {
    if (!entries[id]) {
      throw new Error(`${builder} is missing ${id} from its static index`);
    }
  }
  if (entries['integration-frameworkfeatures--docs'].type !== 'docs') {
    throw new Error(`${builder} did not index the MDX entry as documentation`);
  }
}

async function verifyBuilder(browser, builder, directory) {
  const staticServer = await startStaticServer(directory);
  const page = await browser.newPage();
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      browserErrors.push(message.text());
    }
  });

  try {
    await verifyIndex(staticServer.root, builder);

    await page.goto(
      `${staticServer.baseUrl}/iframe.html?id=integration-csffactories--factory-story&viewMode=story`,
      { waitUntil: 'networkidle' }
    );
    await page
      .getByRole('heading', { name: 'Created with preview.meta' })
      .waitFor({ state: 'visible' });
    await page.getByText('Counter: 1').waitFor({ state: 'visible' });

    await page.goto(
      `${staticServer.baseUrl}/iframe.html?id=integration-frameworkfeatures--loader-globals-and-decorator&viewMode=story`,
      { waitUntil: 'networkidle' }
    );
    await page
      .getByLabel('Decorated story')
      .waitFor({ state: 'visible' });
    await page
      .getByText('Loader finished before the story rendered')
      .waitFor({ state: 'visible' });
    await page.getByText('Toolbar theme: light').waitFor({ state: 'visible' });

    await page.goto(
      `${staticServer.baseUrl}/iframe.html?id=integration-frameworkfeatures--docs&viewMode=docs`,
      { waitUntil: 'networkidle' }
    );
    await page
      .getByText(
        'Aurelia stories use the same CSF, docs, controls, loaders, globals, decorators, and play functions as other Storybook renderers.'
      )
      .waitFor({ state: 'visible' });
    await page
      .getByText('Rendered without a custom render function')
      .first()
      .waitFor({ state: 'visible' });

    if (browserErrors.length > 0) {
      throw new Error(`${builder} browser errors:\n${browserErrors.join('\n')}`);
    }

    process.stdout.write(
      `${builder}: factory story, interaction, Aurelia loader/global/decorator flow, and MDX docs passed (${relative(repositoryRoot, staticServer.root)})\n`
    );
  } finally {
    await page.close();
    await staticServer.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  for (const [builder, directory] of targets) {
    await verifyBuilder(browser, builder, directory);
  }
} finally {
  await browser.close();
}
