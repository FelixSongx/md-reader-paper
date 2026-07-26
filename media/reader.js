(function () {
  const vscode = acquireVsCodeApi();

  // Wrap tables for horizontal scrolling
  document.querySelectorAll('.page table').forEach(function (t) {
    const w = document.createElement('div');
    w.className = 'table-wrap';
    t.parentNode.insertBefore(w, t);
    w.appendChild(t);
  });

  // Open external links in the system browser via the extension host
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="http"]');
    if (a) {
      e.preventDefault();
      vscode.postMessage({ type: 'openExternal', url: a.href });
    }
  });
})();
