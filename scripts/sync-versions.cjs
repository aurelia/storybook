const fs = require('fs');
const path = require('path');

const checkOnly = process.argv.includes('--check');

const rootPath = path.resolve(__dirname, '..');
const rootPkgPath = path.join(rootPath, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const version = rootPkg.version;

const exampleDirs = [
  'apps/hello-world',
  'apps/hello-world-webpack',
  'apps/hello-world-rsbuild',
];

let failed = false;

for (const dir of exampleDirs) {
  const pkgPath = path.join(rootPath, dir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  let changed = false;

  if (pkg.version !== version) {
    if (checkOnly) {
      failed = true;
    } else {
      pkg.version = version;
      changed = true;
    }
  }

  for (const depKey of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (pkg[depKey] && pkg[depKey]['@aurelia/storybook']) {
      const desired = `^${version}`;
      if (pkg[depKey]['@aurelia/storybook'] !== desired) {
        if (checkOnly) {
          failed = true;
        } else {
          pkg[depKey]['@aurelia/storybook'] = desired;
          changed = true;
        }
      }
    }
  }

  if (!checkOnly && changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

if (checkOnly && failed) {
  console.error('Example app versions are out of sync with root package.json.');
  process.exit(1);
}
