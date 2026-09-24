// Optional packaging helper. Run with Node.js; no dependencies to install.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');
let html = read('index.html');
html = html.replace('<link rel="stylesheet" href="styles.css">', `<style>\n${read('styles.css')}\n</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, file) => `<script>\n${read(file).replace(/<\/script/gi, '<\\/script')}\n</script>`);
// Keep the interactive showcase self-contained; project access goes to GitHub.
html = html.replace('</head>', `<!--\nIncluded bot-avatars motion engine: ${read('LICENSE')}\n-->\n</head>`);
fs.writeFileSync(path.join(dir, 'mimi.html'), html);
console.log('Created mimi.html: standalone, offline, no runtime dependencies.');
