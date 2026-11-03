/**
 * 词典页交互逻辑
 * 数据结构（来自 _data/dictionary.yml）：
 *  - title: string (唯一)
 *  - meanings: Array<{
 *      explanation?: string,
 *      wordClass?: string,      // "动词"->"动", "名词"->"名", "形容词"->"形"
 *      bookRefs?: Array<{
 *          bookName: string,
 *          content: string,
 *          preview?: string,    // HTML 片段，hover 显示
 *          link?: string        // 若存在，整行可点击跳转，不显示链接样式
 *      }>
 *    }>
 *  - tags?: string[]
 * 搜索：仅匹配 title（按需求）
 * 展示顺序（按 YAML 注释）：
 *   标题
 *   ├─ wordClass 标签（可选，独立一行）
 *   ├─ explanation（可选，独立一行）
 *   └─ bookRefs[]（每行一个，首行前加"援例"标签，格式：content —— 《bookName》）
 */

// 防 XSS
const escapeHtml = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '\x26amp;', '<': '\x26lt;', '>': '\x26gt;', '"': '\x26quot;', "'": '\x26#39;' }[c]));

const escapeRegExp = (text) =>
  String(text ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 高亮关键字：先整体转义，再把匹配部分包裹 <mark>
const highlight = (text, keyword) => {
  const safe = escapeHtml(text);
  if (!keyword) return safe;
  const pattern = new RegExp(escapeRegExp(escapeHtml(keyword)), 'gi');
  return safe.replace(pattern, (m) => `<mark>${m}</mark>`);
};

// 词性 -> 标签类名/文本
const wordClassInfo = (cls) => {
  const c = String(cls ?? '').trim();
  if (!c) return { tag: '', text: '' };
  if (c.includes('\u52a8')) return { tag: 'word-class-tag--verb', text: '\u52a8' }; // 动
  if (c.includes('\u540d')) return { tag: 'word-class-tag--noun', text: '\u540d' }; // 名
  if (c.includes('\u5f62')) return { tag: 'word-class-tag--adj', text: '\u5f62' }; // 形
  return { tag: 'word-class-tag--other', text: c };
};

// 渲染单个 bookRef 行
const renderBookRefLine = (ref, keyword, isFirst) => {
  const content = highlight(ref.content, keyword);
  const bookName = highlight(ref.bookName, keyword);
  // 格式：content —— 《bookName》
  const lineText = `${content} \u2014\u2014 \u300a${bookName}\u300b`;

  const hasLink = ref.link && ref.link.trim();
  const hasPreview = ref.preview && ref.preview.trim();

  const previewHtml = hasPreview
    ? `<span class="dict-bookref-preview">${ref.preview}</span>` // preview 作为 HTML 渲染
    : '';

  const cls = ['dict-bookref-line', hasLink ? 'dict-bookref-line--link' : ''].join(' ').trim();

  // 仅首行加"援例"标签
  const labelHtml = isFirst
    ? '<span class="dict-bookref-label">\u63f4\u4f8b</span>' // 援例
    : '<span class="dict-bookref-label-spacer"></span>'; // 占位保持对齐

  const inner = `${labelHtml}${lineText}${previewHtml}`;

  if (hasLink) {
    return `<a class="${cls}" href="${escapeHtml(ref.link)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  }
  return `<span class="${cls}">${inner}</span>`;
};

// 渲染单个 meaning：按顺序输出 wordClass 行、explanation 行、bookRefs 行
const renderMeaning = (m, keyword) => {
  const lines = [];

  // 1. 词性标签行（可选，独立一行）
  if (m.wordClass) {
    const { tag, text } = wordClassInfo(m.wordClass);
    if (text) {
      lines.push(`<div class="dict-wordclass-line"><span class="word-class-tag ${tag}">${text}</span></div>`);
    }
  }

  // 2. 释义行（可选，独立一行）
  if (m.explanation) {
    lines.push(`<div class="dict-explanation-line">${highlight(m.explanation, keyword)}</div>`);
  }

  // 3. 书证/援例行（数组，每行一个，首行加标签）
  if (m.bookRefs?.length) {
    const refsHtml = m.bookRefs.map((r, i) => renderBookRefLine(r, keyword, i === 0)).join('');
    lines.push(`<div class="dict-bookrefs-lines">${refsHtml}</div>`);
  }

  return `<div class="dict-meaning">${lines.join('')}</div>`;
};

// 渲染单个词条
const renderEntry = (entry, keyword) => {
  const title = highlight(entry.title, keyword);
  const meaningsHtml = (entry.meanings ?? []).map((m) => renderMeaning(m, keyword)).join('');

  const tagsHtml = entry.tags?.length
    ? `<div class="dict-tags">${entry.tags.map((t) => `<span class="dict-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  return `
    <li class="dict-entry">
      <div class="dict-entry-title">${title}</div>
      ${meaningsHtml}
      ${tagsHtml}
    </li>`;
};

// 搜索：仅按 title 匹配（按需求）
const searchEntries = (entries, keyword) => {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter((e) =>
    String(e.title ?? '').toLowerCase().includes(needle)
  );
};

// 主渲染
const render = (entries, keyword, resultsEl, countEl) => {
  const list = searchEntries(entries, keyword);
  countEl.textContent = list.length ? `\u5171 ${list.length} \u6761\u7ed3\u679c` : '';
  resultsEl.innerHTML = list.length
    ? list.map((e) => renderEntry(e, keyword)).join('')
    : '<li class="dict-empty">\u6ca1\u6709\u627e\u5230\u5339\u914d\u7684\u8bcd\u6761\u3002</li>';
};

// 初始化
const initDictionary = () => {
  const DICTIONARY = window.DICTIONARY_DATA || [];

  const input = document.getElementById('dict-input');
  const results = document.getElementById('dict-results');
  const count = document.getElementById('dict-count');

  if (!input || !results || !count) {
    console.warn('[Dictionary] Required DOM elements not found');
    return;
  }

  let rafId = 0;
  input.addEventListener('input', () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const kw = input.value.trim();
      render(DICTIONARY, kw, results, count);
    });
  });

  render(DICTIONARY, '', results, count);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDictionary);
} else {
  initDictionary();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { escapeHtml, escapeRegExp, highlight, wordClassInfo, renderBookRefLine, renderMeaning, renderEntry, searchEntries, render, initDictionary };
}