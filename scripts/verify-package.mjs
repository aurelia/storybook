// Checks the tarball npm would publish: every entry point in package.json exists
// in it, nothing unexpected ships, and the Node-side entry points load.
// Run after `npm run build`.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

const [pack] = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    cwd: root,
    encoding: 'utf8',
  })
);
const packed = new Set(pack.files.map((file) => file.path));
const problems = [];

function collectTargets(value, targets = []) {
  if (typeof value === 'string') {
    targets.push(value);
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectTargets(entry, targets));
  }
  return targets;
}

for (const target of new Set([pkg.main, pkg.types, ...collectTargets(pkg.exports)])) {
  if (!packed.has(target.replace(/^\.\//, ''))) {
    problems.push(`package.json points at ${target}, which is not in the tarball`);
  }
}

const allowed = /^(dist\/|package\.json$|README\.md$|CHANGELOG\.md$|LICENSE$)/;
for (const file of packed) {
  if (!allowed.test(file)) {
    problems.push(`unexpected file in the tarball: ${file}`);
  }
}

// Storybook loads these in Node, so they must import cleanly without a browser.
const nodeEntries = {
  './preset': ['previewAnnotations', 'viteFinal', 'webpackFinal', 'rsbuildFinal'],
  './node': ['defineMain'],
};
for (const [subpath, names] of Object.entries(nodeEntries)) {
  try {
    const module = await import(`${pkg.name}/${subpath.slice(2)}`);
    for (const name of names) {
      if (typeof module[name] !== 'function') {
        problems.push(`${pkg.name}/${subpath.slice(2)} does not export ${name}()`);
      }
    }
  } catch (error) {
    problems.push(`${pkg.name}/${subpath.slice(2)} failed to load: ${error.message}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`${pack.id}: ${packed.size} files, all entry points present.`);
