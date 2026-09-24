// Build the public website with Node.js only; no dependency installation needed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.join(dir, 'site');

execFileSync(process.execPath, [path.join(dir, 'build-single-file.mjs')], {
  cwd: dir,
  stdio: 'inherit'
});

// Recreate the generated directory so only the two public HTML files are uploaded.
fs.rmSync(siteDir, { recursive: true, force: true });
fs.mkdirSync(siteDir, { recursive: true });
for (const name of ['index.html', 'mimi.html']) {
  fs.copyFileSync(path.join(dir, 'mimi.html'), path.join(siteDir, name));
  console.log(`Created site/${name}: ${fs.statSync(path.join(siteDir, name)).size} bytes.`);
}
