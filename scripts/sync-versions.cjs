// Keeps the example apps aligned with the root package: same version, the local
// `file:../..` framework link, and the same range for every shared dependency.
// Run with `--check` to report drift without writing.
const fs = require('node:fs');
const path = require('node:path');

const checkOnly = process.argv.includes('--check');
const rootPath = path.resolve(__dirname, '..');
const rootPkg = readJson(path.join(rootPath, 'package.json'));
const frameworkName = rootPkg.name;
const frameworkLink = 'file:../..';
const rootRanges = { ...rootPkg.dependencies, ...rootPkg.devDependencies };
const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies'];

const exampleDirs = fs
  .readdirSync(path.join(rootPath, 'apps'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join('apps', entry.name))
  .filter((dir) => fs.existsSync(path.join(rootPath, dir, 'package.json')));

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const problems = [];

for (const dir of exampleDirs) {
  const pkgPath = path.join(rootPath, dir, 'package.json');
  const pkg = readJson(pkgPath);
  let changed = false;

  const align = (owner, key, desired, label) => {
    if (owner[key] === desired) {
      return;
    }
    problems.push(`${dir}: ${label} is ${owner[key]}, expected ${desired}`);
    if (!checkOnly) {
      owner[key] = desired;
      changed = true;
    }
  };

  align(pkg, 'version', rootPkg.version, 'version');

  for (const field of dependencyFields) {
    for (const name of Object.keys(pkg[field] ?? {})) {
      if (name === frameworkName) {
        align(pkg[field], name, frameworkLink, name);
      } else if (rootRanges[name]) {
        align(pkg[field], name, rootRanges[name], name);
      }
    }
  }

  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

if (problems.length > 0) {
  const log = checkOnly ? console.error : console.log;
  log(problems.join('\n'));
  if (checkOnly) {
    console.error('Example apps are out of sync with the root package.json. Run `npm run sync:versions`.');
    process.exit(1);
  }
  console.log('Example apps updated. Run `npm install` to refresh the lockfile.');
}
