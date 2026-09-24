// Build and archive only. No dependency installation, transpiler, or test runner.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = file => fs.readFileSync(path.join(dir, file), 'utf8');
const write = (file, text) => fs.writeFileSync(path.join(dir, file), text);
const manifest = JSON.parse(read('package.json'));
fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
fs.mkdirSync(path.join(dir, 'downloads'), { recursive: true });
const modules = [
  ['src/engine.js', 'CatMotion'],
  ['src/cat-catalog.js', 'CatCatalog'],
  ['src/cat-coats.js', 'CatCoatShader'],
  ['src/cat-3d.js', 'Cat3D'],
  ['src/avatar-runtime.js', 'MimiAvatars']
].map(([file, symbol]) => read(file)
  .replace(`window.${symbol} =`, `const ${symbol} =`)
  .replaceAll('window.CatCoatShader', 'CatCoatShader'));
const banner = `/*! Mimi Cat Avatars ${manifest.version}\nMotion engine attribution and license:\n${read('LICENSE')}\n*/\n`;
const body = modules.join('\n\n');
write('dist/mimi-cat-avatars.js', `${banner}(function (root) {\n'use strict';\n${body}\nroot.MimiAvatars = MimiAvatars;\n})(globalThis);\n`);
write('dist/mimi-cat-avatars.mjs', `${banner}${body}\nconst { createAvatar, cats } = MimiAvatars;\nexport { createAvatar, cats };\nexport default MimiAvatars;\n`);
write('dist/react.mjs', `${banner}${read('src/react-adapter.js')}`);
write('dist/mimi-cat-avatars.d.mts', read('src/index.d.ts'));
write('dist/react.d.mts', read('src/react.d.ts'));

// A normal npm tarball has one top-level package/ directory. The archive is
// locally installable without claiming an existing remote npm publication.
const stage = path.join(dir, 'work/mimi-distribution-stage');
const packageDir = path.join(stage, 'package');
fs.rmSync(stage, { recursive: true, force: true });
fs.mkdirSync(packageDir, { recursive: true });
for (const name of ['dist', 'examples', 'LICENSE', 'NOTICE.md']) {
  fs.cpSync(path.join(dir, name), path.join(packageDir, name), { recursive: true });
}
fs.copyFileSync(path.join(dir, 'DISTRIBUTION.md'), path.join(packageDir, 'README.md'));
const { scripts, ...publishedManifest } = manifest;
fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify(publishedManifest, null, 2) + '\n');
execFileSync('python3', ['-c', `
import pathlib, sys, tarfile, zipfile
package_dir, destination, version = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]
with tarfile.open(destination / ('mimi-cat-avatars-' + version + '.tgz'), 'w:gz') as archive:
    archive.add(package_dir, arcname='package')
with zipfile.ZipFile(destination / 'mimi-distribution.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for item in sorted(package_dir.rglob('*')):
        if item.is_file():
            archive.write(item, pathlib.Path('mimi-cat-avatars') / item.relative_to(package_dir))
`, packageDir, path.join(dir, 'downloads'), manifest.version], { stdio: 'inherit' });
console.log('Created browser JS, ESM, React adapter, type declarations, local npm tarball, and ZIP.');
