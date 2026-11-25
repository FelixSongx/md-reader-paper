# MD Reader

A PDF-like **read-only** Markdown reader for VS Code: A4 paper layout, `**bold**` rendered in pink, `inline code` as pink pills, teal sub-headings, and KaTeX math support.

## Usage

1. Open any `.md` / `.markdown` file.
2. Use the editor title bar menu → **Open With…** → **MD Reader** (or right-click the file in the Explorer → **Open With…**).

To make MD Reader the default for Markdown files, add to your settings:

```json
"workbench.editorAssociations": {
  "*.md": "mdReader.preview"
}
```

## Features

- A4 paper page with shadow, like a printed PDF
- `**bold**` → pink, headings h3+ → teal
- Inline code as pink pills, clean tables with gray headers
- KaTeX math: inline `\( ... \)` and block `\[ ... \]`
- `Ctrl+F` in-page keyword search with match highlighting
- Table of contents panel with click-to-jump and scroll highlighting
- Dark mode: follows your VS Code color theme automatically
- External links open in your system browser
- Re-renders automatically when the file changes on disk

## Notes

- Read-only by design — it is a reader, not an editor.
- The Electron standalone version lives at [EvanSong5525/md-reader](https://github.com/EvanSong5525/md-reader).

## License

MIT
