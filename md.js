// Renders <pre class="md"> blocks (real Claude answers, saved verbatim as Markdown) as formatted HTML.
// The raw text stays in the DOM (hidden) so copy buttons keep copying the exact answer.
(function () {
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function inline(s) {
    s = esc(s);
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
    return s;
  }
  function cells(row) { return row.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim()); }
  function render(md) {
    const lines = md.replace(/\r/g, '').split('\n');
    let out = [], i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      let m;
      if ((m = l.match(/^(#{1,6})\s+(.*)$/))) {
        const n = Math.min(m[1].length + 2, 6);
        out.push(`<h${n}>${inline(m[2])}</h${n}>`); i++; continue;
      }
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { out.push('<hr>'); i++; continue; }
      if (/^\s*\|/.test(l) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        const head = cells(l); i += 2;
        const body = [];
        while (i < lines.length && /^\s*\|/.test(lines[i])) body.push(cells(lines[i++]));
        out.push('<div class="md-table"><table><thead><tr>' + head.map(c => `<th>${inline(c)}</th>`).join('') +
          '</tr></thead><tbody>' + body.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody></table></div>');
        continue;
      }
      if (/^\s*>/.test(l)) {
        const q = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ''));
        out.push(`<blockquote>${render(q.join('\n'))}</blockquote>`); continue;
      }
      if (/^\s*([-*+]|\d+[.)])\s+/.test(l)) {
        const ordered = /^\s*\d/.test(l), items = [];
        while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
          items.push(lines[i++].replace(/^\s*([-*+]|\d+[.)])\s+/, ''));
        }
        const t = ordered ? 'ol' : 'ul';
        out.push(`<${t}>` + items.map(x => `<li>${inline(x)}</li>`).join('') + `</${t}>`); continue;
      }
      const p = [];
      while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*>|\s*\||\s*([-*+]|\d+[.)])\s+)/.test(lines[i])) p.push(lines[i++]);
      if (!p.length) p.push(lines[i++]);
      out.push(`<p>${p.map(inline).join('<br>')}</p>`);
    }
    return out.join('\n');
  }
  function run() {
    document.querySelectorAll('pre.md').forEach(pre => {
      const div = document.createElement('div');
      div.className = 'md-answer';
      div.setAttribute('dir', 'rtl');
      div.innerHTML = render(pre.textContent);
      pre.hidden = true;
      pre.after(div);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
