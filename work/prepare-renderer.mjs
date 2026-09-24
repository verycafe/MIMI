import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

// Historical Canvas experiment. Keep generated files separate from the current SDK.
const work = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(work, 'previous-canvas-version/generated');
fs.mkdirSync(`${out}/src`, { recursive: true });
const license = fs.readFileSync(path.join(work, 'upstream/LICENSE'), 'utf8');
fs.writeFileSync(`${out}/LICENSE`, license);
const modules = { color: 'CatColor', plastic: 'CatPlastic', engine: 'CatMotion', draw: 'CatRenderer' };
for (const [name, global] of Object.entries(modules)) {
  let source = fs.readFileSync(path.join(work, 'upstream', `${name}.ts`), 'utf8');
  if (name === 'plastic') {
    source = source.replace('const M = 64;', 'const M = 96;');
    source = source.replace('return devicePx <= 100 ? 64 : devicePx <= 224 ? 96 : 128;', 'return devicePx <= 100 ? 64 : devicePx <= 224 ? 128 : 256;');
    // A dielectric satin finish: broad softbox sheen, restrained white specular,
    // warm diffuse colour and a very small environmental rim.
    source = source.replace('const ks1 = 0.45 * p.highlight, ks2 = 0.10 * p.highlight, winK = 0.11 * p.highlight, rimK = 0.30 * p.rim;', 'const ks1 = 0.32 * p.highlight, ks2 = 0.10 * p.highlight, winK = 0.018 * p.highlight, rimK = 0.095 * p.rim;');
    source = source.replace('0.30 - 0.15 * p.shadow', '0.57 - 0.08 * p.shadow');
    source = source.replace('const kd = 0.85;', 'const kd = 0.62;');
    source = source.replace('const ambT: V3 = [amb * tint[0], amb * tint[1], amb * tint[2]];', 'const ambT: V3 = [amb, amb, amb];');
    source = source.replace('(1 + 3 * f5)', '(1 + 0.5 * f5)');
    source = source.replace('if (st.version === 0) {', 'if (st.version === 0 || rig.still) {');
  }
  if (name === 'draw') {
    source = source.replace('ctx.clip(cfg.path);\n      ctx.setTransform', 'ctx.clip(cfg.path);\n      if (facing > 0.18) drawInnerEars(ctx, cfg);\n      ctx.setTransform');
    source = source.slice(0, source.indexOf('function drawFace(')) + fs.readFileSync(path.join(work, 'cat-face.js'), 'utf8');
  }
  let js = stripTypeScriptTypes(source, { mode: 'transform' });
  const names = [...js.matchAll(/^export (?:const|function|class) (\w+)/gm)].map(m => m[1]);
  js = js.replace(/^import \{([^}]+)\} from '\.\/(\w+)';$/gm, (_, members, mod) => `const {${members}} = window.${modules[mod]};`);
  js = js.replace(/^export /gm, '');
  fs.writeFileSync(`${out}/src/${name}.js`, `/*\nDerived from bot-avatars, MIT © Jakub Antalik.\nAdapted for Mimi: custom cat face, satin plastic, higher-resolution shading.\nFull license: ../LICENSE\n*/\nwindow.${global} = (() => {\n'use strict';\n${js}\nreturn { ${names.join(', ')} };\n})();\n`);
}
console.log('Prepared four dependency-free Canvas modules.');
