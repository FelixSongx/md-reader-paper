# Change Log

## 1.0.5

- Inline code in dark mode shows colored text only (no pill background).
- Fit-to-window page width by default, keeping the TOC visible; `−/+` control switches to a fixed mm width (140–1000mm), click the label to return to fit mode; setting is remembered per tab.
- TOC auto-scrolls so the active entry stays visible, and hides itself whenever the page would render underneath it.

## 1.0.4

- Dark color theme: follows the VS Code color theme automatically — dark paper/workspace with adjusted pink/teal accents; find bar, TOC panel and search highlights get dark variants too.

## 1.0.3

- Add a table-of-contents panel (h1–h4) with click-to-jump and scroll highlighting; auto-hides on narrow windows.

## 1.0.2

- Fix broken KaTeX sub/superscripts and fractions (CSP now allows inline styles, which KaTeX relies on for positioning).
- Decode embedded JSON blocks (`{"type":"reasoning",...}`) from CodeBuddy chat exports into readable blockquotes.
- Add `Ctrl+F` in-page keyword search with match highlighting and navigation.
- Remove the in-page toolbar (redundant with the VS Code editor tab).

## 1.0.1

- Re-publish with the correct display name "MD Reader Paper" and updated repository links (FelixSongx).

## 1.0.0

- Initial release: read-only custom editor for `.md` / `.markdown` with the PDF-like MD Reader theme (A4 page, pink bold, teal headings, KaTeX math).
