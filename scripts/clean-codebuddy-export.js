// Clean a CodeBuddy chat export (*.md) so it renders properly in a Markdown
// reader: CodeBuddy embeds assistant "reasoning" segments as single-line JSON
// objects like {"type":"reasoning","text":"...\n..."} whose newlines are
// literal escape sequences. This script decodes them into blockquotes.
//
// Usage: node scripts/clean-codebuddy-export.js <input.md> [output.md]
//        default output: <input>.clean.md
const fs = require('fs');
const path = require('path');

const input = process.argv[2];
if (!input) {
  console.error('Usage: node scripts/clean-codebuddy-export.js <input.md> [output.md]');
  process.exit(1);
}
const output = process.argv[3] ||
  path.join(path.dirname(input), path.basename(input, path.extname(input)) + '.clean.md');

const src = fs.readFileSync(input, 'utf-8');
const lines = src.split(/\r?\n/);

let converted = 0;
const out = lines.map((line) => {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{"type"')) return line;
  let obj;
  try {
    obj = JSON.parse(trimmed);
  } catch (e) {
    return line; // not valid JSON — leave untouched
  }
  if (typeof obj.text !== 'string') return line;

  converted++;
  const label = obj.type === 'reasoning' ? '思考过程' : obj.type;
  const body = obj.text.replace(/\r\n/g, '\n');
  const quoted = body.split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');
  return `> **${label}**\n>\n${quoted}`;
});

fs.writeFileSync(output, out.join('\n'));
console.log(`converted ${converted} JSON block(s) -> ${output}`);
