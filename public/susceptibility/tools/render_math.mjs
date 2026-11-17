// Render the TeX in index.src.html to static KaTeX HTML -> index.html.
// Inline math is written \( ... \), display math \[ ... \].  Run from the site root:
//   node tools/render_math.mjs
import { readFileSync, writeFileSync } from 'node:fs';
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
console.log(`rendered ${n} formulas`);
