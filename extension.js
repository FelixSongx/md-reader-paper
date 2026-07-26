const vscode = require('vscode');
const { marked } = require('marked');
const katex = require('katex');

marked.setOptions({ gfm: true, breaks: false });

// ---- LaTeX math extensions for marked (ported from preload.js) ----

// Inline math: \( ... \)
const inlineMathExtension = {
  name: 'inlineMath',
  level: 'inline',
  start(src) {
    return src.indexOf('\\(');
  },
  tokenizer(src) {
    const match = src.match(/^\\\(([\s\S]*?)\\\)/);
    if (match) {
      return {
        type: 'inlineMath',
        raw: match[0],
        text: match[1].trim()
      };
    }
  },
  renderer(token) {
    try {
      return katex.renderToString(token.text, {
        throwOnError: false,
        displayMode: false
      });
    } catch (e) {
      return `<code>${token.text}</code>`;
    }
  }
};

// Display/block math: \[ ... \]
const blockMathExtension = {
  name: 'blockMath',
  level: 'block',
  start(src) {
    return src.indexOf('\\[');
  },
  tokenizer(src) {
    const match = src.match(/^\\\[([\s\S]*?)\\\]/);
    if (match) {
      return {
        type: 'blockMath',
        raw: match[0],
        text: match[1].trim()
      };
    }
  },
  renderer(token) {
    try {
      return katex.renderToString(token.text, {
        throwOnError: false,
        displayMode: true
      });
    } catch (e) {
      return `<pre><code>${token.text}</code></pre>`;
    }
  }
};

marked.use({ extensions: [inlineMathExtension, blockMathExtension] });

function renderMarkdown(text) {
  try {
    return marked.parse(text || '');
  } catch (e) {
    return `<p>渲染失败：${e.message}</p>`;
  }
}

function getNonce() {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}

function getHtml(webview, mediaRoot, bodyHtml, title) {
  const nonce = getNonce();
  const katexCss = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'katex', 'katex.min.css'));
  const readerCss = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'reader.css'));
  const readerJs = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'reader.js'));
  const csp = [
    `default-src 'none'`,
    `img-src ${webview.cspSource} https: data:`,
    `style-src ${webview.cspSource}`,
    `font-src ${webview.cspSource}`,
    `script-src 'nonce-${nonce}'`,
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<link rel="stylesheet" href="${katexCss}">
<link rel="stylesheet" href="${readerCss}">
<title>${title}</title>
</head>
<body>
  <div class="toolbar">
    <span class="title">${title}</span>
  </div>
  <div id="content">
    <div class="page">${bodyHtml}</div>
  </div>
  <script nonce="${nonce}" src="${readerJs}"></script>
</body>
</html>`;
}

class MdReaderEditorProvider {
  constructor(context) {
    this.context = context;
  }

  static register(context) {
    return vscode.window.registerCustomEditorProvider(
      MdReaderEditorProvider.viewType,
      new MdReaderEditorProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    );
  }

  async openCustomDocument(uri) {
    return { uri, dispose() {} };
  }

  async resolveCustomEditor(document, webviewPanel) {
    const mediaRoot = vscode.Uri.joinPath(this.context.extensionUri, 'media');
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [mediaRoot],
    };

    const fileName = document.uri.path.split('/').pop() || 'Markdown';

    const update = async () => {
      let text = '';
      try {
        const doc = await vscode.workspace.openTextDocument(document.uri);
        text = doc.getText();
      } catch (e) {
        const raw = await vscode.workspace.fs.readFile(document.uri);
        text = Buffer.from(raw).toString('utf-8');
      }
      webviewPanel.webview.html = getHtml(
        webviewPanel.webview,
        mediaRoot,
        renderMarkdown(text),
        fileName
      );
    };

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        update();
      }
    });
    webviewPanel.onDidDispose(() => changeSub.dispose());

    webviewPanel.webview.onDidReceiveMessage((msg) => {
      if (msg && msg.type === 'openExternal' && typeof msg.url === 'string') {
        if (/^https?:\/\//i.test(msg.url)) {
          vscode.env.openExternal(vscode.Uri.parse(msg.url));
        }
      }
    });

    await update();
  }
}

MdReaderEditorProvider.viewType = 'mdReader.preview';

function activate(context) {
  context.subscriptions.push(MdReaderEditorProvider.register(context));
}

function deactivate() {}

module.exports = { activate, deactivate };
