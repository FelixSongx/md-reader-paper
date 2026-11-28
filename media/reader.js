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

  // ---- Table of contents (heading jump) ----
  const page = document.querySelector('.page');
  const headings = Array.from(
    document.querySelectorAll('.page h1[id], .page h2[id], .page h3[id], .page h4[id]')
  );
  let toc = null;
  if (headings.length > 1) {
    toc = document.createElement('nav');
    toc.className = 'toc';
    const tocTitle = document.createElement('div');
    tocTitle.className = 'toc-title';
    tocTitle.textContent = '目录';
    toc.appendChild(tocTitle);
    const list = document.createElement('ul');
    const links = [];
    headings.forEach(function (h) {
      const li = document.createElement('li');
      li.className = 'toc-' + h.tagName.toLowerCase();
      const a = document.createElement('a');
      a.textContent = h.textContent;
      a.href = '#' + h.id;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      li.appendChild(a);
      list.appendChild(li);
      links.push(a);
    });
    toc.appendChild(list);
    document.body.appendChild(toc);

    // Highlight the section currently in view and keep the active entry
    // scrolled into the visible part of the TOC itself
    function spy() {
      let active = 0;
      headings.forEach(function (h, i) {
        if (h.getBoundingClientRect().top <= 80) active = i;
      });
      links.forEach(function (a, i) {
        a.classList.toggle('active', i === active);
      });
      const a = links[active];
      const ar = a.getBoundingClientRect();
      const tr = toc.getBoundingClientRect();
      if (ar.top < tr.top + 28 || ar.bottom > tr.bottom - 4) {
        toc.scrollTop += ar.top - tr.top - 32;
      }
    }
    document.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  // ---- Page width control ----
  // widthMode 'fit': fill the window, leaving room for the TOC.
  // A number: fixed page width in mm (manual mode via −/+).
  const state = vscode.getState() || {};
  let widthMode = (typeof state.width === 'number' &&
    state.width >= 140 && state.width <= 1000) ? state.width : 'fit';

  // Hide the TOC when the (centered) page would reach under it.
  // All measurements are taken from the live layout (scrollbar-safe).
  const TOC_GAP = 18; // px gap between page right edge and TOC left edge

  function tocLeft() {
    return toc ? toc.getBoundingClientRect().left : Infinity;
  }

  function checkTocVisibility() {
    if (!toc) return;
    toc.style.display = '';
    const cw = document.documentElement.clientWidth;
    const pageRight = (cw + page.offsetWidth) / 2; // page is centered
    toc.style.display = (pageRight > tocLeft() - TOC_GAP) ? 'none' : '';
  }

  function applyWidth() {
    if (widthMode === 'fit') {
      page.style.width = 'auto';
      if (toc) {
        toc.style.display = '';
        const cw = document.documentElement.clientWidth;
        const marginRight = cw - (tocLeft() - TOC_GAP);
        if (cw - marginRight - 24 >= 640) {
          // Right margin reserves exactly the TOC's footprint
          page.style.margin = '24px ' + marginRight + 'px 24px 24px';
        } else {
          page.style.margin = '24px';
          checkTocVisibility();
        }
      } else {
        page.style.margin = '24px';
      }
      wLabel.textContent = '铺满';
    } else {
      page.style.width = widthMode + 'mm';
      page.style.margin = '24px auto';
      wLabel.textContent = widthMode + 'mm';
      checkTocVisibility();
    }
    vscode.setState({ width: widthMode });
  }

  function changeWidth(delta) {
    if (widthMode === 'fit') {
      // Enter manual mode starting from the currently fitted width (px → mm)
      widthMode = Math.round((page.offsetWidth * 25.4 / 96) / 20) * 20;
    }
    widthMode = Math.min(1000, Math.max(140, widthMode + delta));
    applyWidth();
  }

  const wc = document.createElement('div');
  wc.className = 'width-ctrl';
  wc.innerHTML =
    '<button class="w-dec" title="减小页宽">−</button>' +
    '<span class="width-label"></span>' +
    '<button class="w-inc" title="增大页宽">+</button>';
  document.body.appendChild(wc);
  const wLabel = wc.querySelector('.width-label');
  wc.querySelector('.w-dec').addEventListener('click', function () { changeWidth(-20); });
  wc.querySelector('.w-inc').addEventListener('click', function () { changeWidth(20); });
  wLabel.title = '点击恢复铺满模式';
  wLabel.addEventListener('click', function () {
    widthMode = 'fit';
    applyWidth();
  });

  window.addEventListener('resize', function () {
    if (widthMode === 'fit') applyWidth();
    else checkTocVisibility();
  });
  applyWidth();
})();
