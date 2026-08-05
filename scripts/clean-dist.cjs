const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '..');
const outputDirectory = path.join(repositoryRoot, 'dist');

if (
  path.dirname(outputDirectory) !== repositoryRoot ||
  path.basename(outputDirectory) !== 'dist'
) {
  throw new Error(`Refusing to clean unexpected path: ${outputDirectory}`);
}

fs.rmSync(outputDirectory, { recursive: true, force: true });
