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

  // ---- Find bar (Ctrl+F) ----
  const bar = document.createElement('div');
  bar.className = 'find-bar';
  bar.innerHTML =
    '<input type="text" class="find-input" placeholder="搜索…">' +
    '<span class="find-count"></span>' +
    '<button class="find-prev" title="上一个 (Shift+Enter)">↑</button>' +
    '<button class="find-next" title="下一个 (Enter)">↓</button>';
  document.body.appendChild(bar);
  const input = bar.querySelector('.find-input');
  const count = bar.querySelector('.find-count');

  let hits = [];
  let current = -1;

  function clearHits() {
    document.querySelectorAll('mark.find-hit').forEach(function (m) {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
    hits = [];
    current = -1;
    count.textContent = '';
  }

  function search() {
    const query = input.value;
    clearHits();
    if (!query) return;
    const q = query.toLowerCase();
    const walker = document.createTreeWalker(
      document.getElementById('content'),
      NodeFilter.SHOW_TEXT
    );
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(function (textNode) {
      const text = textNode.nodeValue;
      const lower = text.toLowerCase();
      let idx = 0;
      let pos;
      let found = false;
      const frag = document.createDocumentFragment();
      while ((pos = lower.indexOf(q, idx)) !== -1) {
        found = true;
        frag.appendChild(document.createTextNode(text.slice(idx, pos)));
        const mark = document.createElement('mark');
        mark.className = 'find-hit';
        mark.textContent = text.slice(pos, pos + query.length);
        frag.appendChild(mark);
        idx = pos + query.length;
      }
      if (found) {
        frag.appendChild(document.createTextNode(text.slice(idx)));
        textNode.parentNode.replaceChild(frag, textNode);
      }
    });
    hits = Array.from(document.querySelectorAll('mark.find-hit'));
    if (hits.length) {
      jump(0);
    } else {
      count.textContent = '0';
    }
  }

  function jump(i) {
    if (!hits.length) return;
    if (current >= 0) hits[current].classList.remove('current');
    current = (i + hits.length) % hits.length;
    hits[current].classList.add('current');
    hits[current].scrollIntoView({ block: 'center' });
    count.textContent = (current + 1) + '/' + hits.length;
  }

  function openBar() {
    bar.classList.add('visible');
    input.focus();
    input.select();
  }

  function closeBar() {
    bar.classList.remove('visible');
    clearHits();
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openBar();
    } else if (e.key === 'Escape' && bar.classList.contains('visible')) {
      closeBar();
    }
  });
  input.addEventListener('input', search);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      jump(current + (e.shiftKey ? -1 : 1));
    }
  });
  bar.querySelector('.find-prev').addEventListener('click', function () { jump(current - 1); });
  bar.querySelector('.find-next').addEventListener('click', function () { jump(current + 1); });
})();
