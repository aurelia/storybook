const fs = require('fs');
const path = require('path');

const checkOnly = process.argv.includes('--check');

const rootPath = path.resolve(__dirname, '..');
const rootPkgPath = path.join(rootPath, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const version = rootPkg.version;
const desiredStorybookDependency = 'file:../..';

const exampleDirs = [
  'apps/hello-world',
  'apps/hello-world-webpack',
  'apps/hello-world-rsbuild',
];

let failed = false;

function markOutOfSync(message) {
  if (checkOnly) {
    console.error(message);
    failed = true;
  }
}

function verifyPackageLock(dir, pkg) {
  if (!checkOnly) {
    return;
  }

  const lockPath = path.join(rootPath, dir, 'package-lock.json');
  if (!fs.existsSync(lockPath)) {
    return;
  }

  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const rootPackage = lock.packages?.[''];

  if (!rootPackage) {
    markOutOfSync(`${dir}/package-lock.json is missing root package metadata.`);
    return;
  }

  if (rootPackage.version !== pkg.version) {
    markOutOfSync(
      `${dir}/package-lock.json version (${rootPackage.version}) does not match package.json (${pkg.version}).`
    );
  }

  const lockedStorybookDependency = rootPackage.devDependencies?.['@aurelia/storybook'];
  if (lockedStorybookDependency && lockedStorybookDependency !== desiredStorybookDependency) {
    markOutOfSync(
      `${dir}/package-lock.json uses @aurelia/storybook ${lockedStorybookDependency}; expected ${desiredStorybookDependency}.`
    );
  }
}

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
      const desired = desiredStorybookDependency;
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

  verifyPackageLock(dir, pkg);

  if (!checkOnly && changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

if (checkOnly && failed) {
  console.error('Example app versions are out of sync with root package.json.');
  process.exit(1);
}
