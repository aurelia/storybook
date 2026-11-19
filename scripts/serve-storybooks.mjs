// Serves the three built example Storybooks from one static server, each under
// its own path prefix (see e2e/builders.ts). Used by the Playwright e2e suite.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT ?? 6100);
const roots = {
  vite: 'apps/hello-world/storybook-static',
  webpack: 'apps/hello-world-webpack/storybook-static',
  rsbuild: 'apps/hello-world-rsbuild/storybook-static',
};

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

async function resolveFile(root, pathname) {
  const requested = resolve(root, `.${pathname}`);
  if (requested !== root && !requested.startsWith(`${root}${sep}`)) {
    return undefined;
  }
  try {
    const details = await stat(requested);
    return details.isDirectory() ? join(requested, 'index.html') : requested;
  } catch {
    return undefined;
  }
}

for (const [name, directory] of Object.entries(roots)) {
  try {
    await stat(resolve(repositoryRoot, directory, 'index.json'));
  } catch {
    console.error(
      `Missing ${directory} (${name}). Run \`npm run build && npm run build:storybooks\` first.`
    );
    process.exit(1);
  }
}

const server = createServer(async (request, response) => {
  try {
    const { pathname } = new URL(request.url ?? '/', 'http://127.0.0.1');
    const [, prefix, ...rest] = decodeURIComponent(pathname).split('/');
    const directory = Object.hasOwn(roots, prefix) ? roots[prefix] : undefined;
    const file =
      directory &&
      (await resolveFile(resolve(repositoryRoot, directory), `/${rest.join('/')}`));
    if (!file) {
      response.writeHead(404).end('Not found');
      return;
    }

    const body = await readFile(file);
    response.writeHead(200, {
      'cache-control': 'no-store',
      'content-type': contentTypes[extname(file)] ?? 'application/octet-stream',
    });
    response.end(body);
  } catch (error) {
    response.writeHead(500).end(String(error));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving example Storybooks at http://127.0.0.1:${port}/{${Object.keys(roots).join(',')}}/`);
});
