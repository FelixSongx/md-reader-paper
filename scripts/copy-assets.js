// Copy KaTeX CSS and fonts from node_modules into media/katex
// so the webview can load them as local resources.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'katex', 'dist');
const dest = path.join(__dirname, '..', 'media', 'katex');

if (!fs.existsSync(src)) {
  console.error('katex not found in node_modules — run `npm install` first.');
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

fs.copyFileSync(path.join(src, 'katex.min.css'), path.join(dest, 'katex.min.css'));
fs.cpSync(path.join(src, 'fonts'), path.join(dest, 'fonts'), { recursive: true });

console.log('katex assets copied to media/katex');
