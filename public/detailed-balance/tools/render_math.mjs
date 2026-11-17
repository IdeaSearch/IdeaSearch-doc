// Render the TeX in index.src.html to static KaTeX HTML -> index.html.
// Inline math is written \( ... \), display math \[ ... \].  Run from the site root:
//   node tools/render_math.mjs
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const katex = require('../assets/katex/katex.min.js');
const src = readFileSync(new URL('../index.src.html', import.meta.url), 'utf8');
let n = 0;
const render = (tex, displayMode) => {
  n++;
  return katex.renderToString(tex.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'),
    { displayMode, throwOnError: true, strict: 'error', output: 'htmlAndMathml' });
};
const out = src
  .replace(/\\\[([\s\S]+?)\\\]/g, (_, t) => render(t, true))
  .replace(/\\\(([\s\S]+?)\\\)/g, (_, t) => render(t, false));
writeFileSync(new URL('../index.html', import.meta.url), out);
const manifest = new URL('../MANIFEST.sha256', import.meta.url);
if (existsSync(manifest)) {
  const checksums = readFileSync(manifest, 'utf8').trim().split('\n').map(line => {
    const path = line.match(/^[a-f0-9]{64} {2}(.+)$/)?.[1];
    if (!path) throw new Error('Invalid SHA-256 manifest entry');
    const digest = createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex');
    return `${digest}  ${path}`;
  });
  writeFileSync(manifest, checksums.join('\n') + '\n');
}
console.log(`rendered ${n} formulas`);
