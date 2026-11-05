/**
 * 词典页交互逻辑
 * 数据结构（来自 _data/dictionary.yml）：
 *  - title: string (唯一)
 *  - meanings: Array<{
 *      explanation?: string,
 *      wordClass?: string,      // "动词"->"动", "名词"->"名", "形容词"->"形", "副词"->"副"
 *      bookRefs?: Array<{
 *          bookName: string,
 *          content: string,
 *          preview?: string,    // HTML 片段，hover 显示
 *          link?: string        // 若存在，整行可点击跳转，不显示链接样式
 *      }>,
 *      synonym?: Array<{       // 同义词，bookRefs 下方单行展示，行首"义近"标签
 *          synonymName: string,
 *          preview?: string    // 同 bookRefs.preview（含触屏浮层逻辑）
 *      }>                     // synonymName 命中已有词条时，新页面打开 ?keyword=xxx
 *    }>
 *  - tags?: string[]
 * 搜索：仅匹配 title（按需求）
 * URL 参数：?keyword=xxx 仅在首次进入时读取一次，之后不再改动地址栏。
 * 展示顺序（按 YAML 注释）：
 *   标题
 *   ├─ wordClass 标签（可选，独立一行）
 *   ├─ explanation（可选，独立一行）
 *   ├─ bookRefs[]（每行一个，首行前加"援例"标签，格式：content —— 《bookName》）
 *   └─ synonym[]（单行，行首"义近"标签，每个 synonymName 一个标签）
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
  // "副词"放在最前，避免未来出现"副词/动词"这类组合时被后面的动/名/形抢先匹配
  if (c.includes('\u526f')) return { tag: 'word-class-tag--adv', text: '\u526f' };  // 副
  if (c.includes('\u52a8')) return { tag: 'word-class-tag--verb', text: '\u52a8' }; // 动
  if (c.includes('\u540d')) return { tag: 'word-class-tag--noun', text: '\u540d' }; // 名
  if (c.includes('\u5f62')) return { tag: 'word-class-tag--adj', text: '\u5f62' }; // 形
  return { tag: 'word-class-tag--other', text: c };
};

// 渲染单个 bookRef 行
// preview 不再作为行内 <span> 插入：absolute 且未指定偏移时只会停在静态位置（行尾右下角）。
// 改为把 HTML 片段转义后存入 data-preview，由全局浮层读取并跟随鼠标展示。
const renderBookRefLine = (ref, keyword, isFirst) => {
  const content = highlight(ref.content, keyword);
  const bookName = highlight(ref.bookName, keyword);
  // 格式：content —— 《bookName》
  const lineText = `${content} \u2014\u2014 \u300a${bookName}\u300b`;

  const hasLink = ref.link && ref.link.trim();
  const hasPreview = ref.preview && ref.preview.trim();

  const cls = ['dict-bookref-line',
    hasLink ? 'dict-bookref-line--link' : '',
    hasPreview ? 'dict-bookref-line--preview' : ''
  ].join(' ').trim();

  // 属性值必须转义；读取 dataset.preview 时浏览器会自动解码回原始 HTML 片段
  const previewAttr = hasPreview
    ? ` data-preview="${escapeHtml(ref.preview)}"`
    : '';

  // 仅首行加"援例"标签
  const labelHtml = isFirst
    ? '<span class="dict-bookref-label">\u63f4\u4f8b</span>' // 援例
    : '<span class="dict-bookref-label-spacer"></span>'; // 占位保持对齐

  const inner = `${labelHtml}${lineText}`;

  if (hasLink) {
    // data-has-link：浮层控制器据此判断「链接行」，触屏走两段式点击
    return `<a class="${cls}"${previewAttr} data-has-link="1" href="${escapeHtml(ref.link)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
  }
  return `<span class="${cls}"${previewAttr}>${inner}</span>`;
};

// 同义词行：bookRefs 下方单行展示，行首「义近」标签，之后按数组顺序排 synonymName 标签。
// - 带 preview：写 data-preview，复用书证行的全局浮层（鼠标跟随 + 触屏两段式，含 app 端逻辑）。
// - synonymName 命中已有词条：生成 ?keyword=xxx 链接，target="_blank" 在新页面直达搜索结果。
//   用相对查询串可自动沿用当前词典页路径（含 baseurl），无需读 location。
const renderSynonymLine = (synonyms, keyword, knownTitles) => {
  const tags = (synonyms ?? []).map((s) => {
    const name = String(s?.synonymName ?? '').trim();
    if (!name) return '';

    const hasPreview = s.preview && String(s.preview).trim();
    const isEntry = !!knownTitles && knownTitles.has(name);
    const cls = ['dict-synonym-tag',
      hasPreview ? 'dict-synonym-tag--preview' : '',
      isEntry ? 'dict-synonym-tag--link' : ''
    ].join(' ').trim();
    const previewAttr = hasPreview
      ? ` data-preview="${escapeHtml(s.preview)}"`
      : '';
    const linkAttr = isEntry ? ' data-has-link="1"' : '';
    const text = highlight(name, keyword);

    if (isEntry) {
      const href = `?keyword=${encodeURIComponent(name)}`;
      return `<a class="${cls}"${previewAttr}${linkAttr} href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
    return `<span class="${cls}"${previewAttr}>${text}</span>`;
  }).filter(Boolean).join('');

  if (!tags) return '';
  return `<div class="dict-synonym-line"><span class="dict-synonym-label">\u4e49\u8fd1</span>${tags}</div>`; // 义近
};

// 渲染单个 meaning：按顺序输出 wordClass 行、explanation 行、bookRefs 行、synonym 行
// knownTitles 是全量词条标题的 Set，用来判断 synonymName 是否可链接到搜索页
const renderMeaning = (m, keyword, knownTitles) => {
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

  // 4. 同义词行（数组，单行「义近」+ 若干标签）
  if (m.synonym?.length) {
    const synonymHtml = renderSynonymLine(m.synonym, keyword, knownTitles);
    if (synonymHtml) lines.push(synonymHtml);
  }

  return `<div class="dict-meaning">${lines.join('')}</div>`;
};

// 渲染单个词条
const renderEntry = (entry, keyword, knownTitles) => {
  const title = highlight(entry.title, keyword);
  const meaningsHtml = (entry.meanings ?? []).map((m) => renderMeaning(m, keyword, knownTitles)).join('');

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
  // 全量标题用于判断 synonymName 是否也是词条（不能用搜索后的子集，否则命中项会漏判）
  const knownTitles = new Set(
    (entries ?? []).map((e) => String(e.title ?? '').trim()).filter(Boolean)
  );
  countEl.textContent = list.length ? `\u5171 ${list.length} \u6761\u7ed3\u679c` : '';
  resultsEl.innerHTML = list.length
    ? list.map((e) => renderEntry(e, keyword, knownTitles)).join('')
    : '<li class="dict-empty">\u6ca1\u6709\u627e\u5230\u5339\u914d\u7684\u8bcd\u6761\u3002</li>';
};

// ===== 首屏词云 =====
// 空关键字态展示词云：随机取最多 10 个标题，缓慢漂移，点击回填搜索框并搜索。
const CLOUD_MAX_WORDS = 10;
const CLOUD_PALETTE = ['#8a6d2f', '#a97c50', '#7a6a55', '#4a3f35', '#9c6b4a', '#6b7f6a'];

// 云朵外形：纯背景装饰，铺满词云容器。
// 词条位置不再受这条轮廓约束（不做「落在云形内」的计算），只在容器的方形范围内分布并移动。
const CLOUD_SHAPE_SVG =
  '<svg class="dict-cloud-shape" viewBox="0 0 640 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
  '<path d="M 120 258 C 64 258 22 222 22 180 C 22 140 52 108 94 104 ' +
  'C 104 58 148 26 200 26 C 248 26 288 54 304 94 C 320 68 348 56 380 56 ' +
  'C 434 56 474 94 480 142 C 528 136 572 164 584 204 C 596 226 590 258 560 258 Z"/>' +
  '</svg>';

// Fisher-Yates 洗牌（操作副本，不改动入参）
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// 随机抽取最多 max 个去重后的标题
const pickCloudWords = (entries, max = CLOUD_MAX_WORDS) =>
  shuffle([...new Set(
    (entries ?? []).map((e) => String(e.title ?? '').trim()).filter(Boolean)
  )]).slice(0, max);

// 简单网格槽位：只用于把词分散开，不做任何「落在云形轮廓内」的约束计算
const buildCloudSlots = (count) => {
  const slots = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) slots.push({ row, col });
  }
  return shuffle(slots).slice(0, count);
};

// 生成词云 DOM；onPick(keyword) 由外部回填搜索框
// 漂移改为单个 rAF 循环逐帧写 transform，不再依赖 CSS @keyframes：
// 这样不会被缓存的旧 CSS（找不到 animation-name 对应的关键帧）、animation 简写覆盖、
// 或 prefers-reduced-motion 的 `animation: none !important` 静默禁掉，Firefox/Chrome 行为一致。
const renderWordCloud = (cloudEl, titles, onPick) => {
  const slots = buildCloudSlots(titles.length);
  const motions = titles.map((title, i) => {
    const { row, col } = slots[i];
    return {
      title,
      cx: 14 + col * 19 + Math.random() * 5,   // 中心 x：容器宽 14%~76%
      cy: 20 + row * 18 + Math.random() * 7,   // 中心 y：容器高 20%~63%
      fs: 0.95 + Math.random() * 0.65,         // 0.95 ~ 1.6rem
      ax: 6 + Math.random() * 5,               // 横向振幅：容器宽 6%~11%
      ay: 10 + Math.random() * 8,              // 纵向振幅：容器高 10%~18%
      tx: 7 + Math.random() * 6,               // 横向周期 7~13s
      ty: 9 + Math.random() * 8,               // 纵向周期 9~17s
      px: Math.random() * Math.PI * 2,         // 随机相位，各词不同步
      py: Math.random() * Math.PI * 2
    };
  });

  const buttons = motions.map((m, i) => {
    const style = [
      `--x:${m.cx.toFixed(1)}%`, `--y:${m.cy.toFixed(1)}%`,
      `--fs:${m.fs.toFixed(2)}rem`, `--fs-hover:${(m.fs * 1.5).toFixed(2)}rem`,
      `color:${CLOUD_PALETTE[i % CLOUD_PALETTE.length]}`
    ].join(';');
    const safe = escapeHtml(m.title);
    return `<button type="button" class="dict-cloud-word" style="${style}" data-keyword="${safe}" aria-label="\u641c\u7d22\u8bcd\u6761\uff1a${safe}">${safe}</button>`;
  }).join('');

  cloudEl.innerHTML = CLOUD_SHAPE_SVG + buttons;

  // 事件委托：词云只构建一次，无需逐按钮绑定
  cloudEl.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest
      ? e.target.closest('.dict-cloud-word')
      : null;
    if (btn && cloudEl.contains(btn)) onPick(btn.dataset.keyword || btn.textContent);
  });

  const words = Array.from(cloudEl.querySelectorAll('.dict-cloud-word'));
  const reduceMotion = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 之前 CSS 的 `@media (prefers-reduced-motion: reduce) { animation: none !important }`
  // 会让漂移彻底静止；这里改为只减速、不停摆，并在控制台给出可排查的提示。
  const speed = reduceMotion ? 0.5 : 1;
  if (reduceMotion) {
    console.info('[Dictionary] 系统启用了「减少动态效果」，词云漂移已减速至 50%（未停止）。');
  }

  let rafId = 0;
  let elapsed = 0;
  let last = null;
  let active = false;
  let W = 0;
  let H = 0;

  const measure = () => {
    W = cloudEl.clientWidth || 640;
    H = cloudEl.clientHeight || 300;
  };

  const frame = (now) => {
    if (!active) return;
    if (last === null) last = now;
    // 单帧步长封顶，切回标签页时不会大跳
    elapsed += (Math.min(Math.max(now - last, 0), 64) / 1000) * speed;
    last = now;
    if (!W || !H) measure();
    const ux = W / 100;
    const uy = H / 100;
    for (let i = 0; i < words.length; i++) {
      const m = motions[i];
      const dx = m.ax * ux * Math.sin(elapsed * (2 * Math.PI / m.tx) + m.px);
      const dy = m.ay * uy * Math.sin(elapsed * (2 * Math.PI / m.ty) + m.py);
      words[i].style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    }
    rafId = requestAnimationFrame(frame);
  };

  const start = () => {
    if (active || !words.length) return;
    active = true;
    last = null;
    measure();
    rafId = requestAnimationFrame(frame);
  };

  const stop = () => {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  };

  // 页面切到后台或词云被搜索结果替换时停掉循环，回到词云态再续上
  const onVisibility = () => {
    if (document.hidden) stop();
    else if (!cloudEl.hidden) start();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', measure);

  return { start, stop };
};

// ===== preview 浮层：鼠标跟随 + 触屏点击 =====
// 单个全局浮层挂在 body 上，position: fixed。
// 有 hover 能力的设备：按 clientX/clientY 跟随鼠标；
// 触屏（无 hover）：点击书证行/同义词标签把浮层锚定在其上方/下方，再点或点空白处收起。
// 链接行首次点击只展示 preview 并阻止跳转，再次点击才打开链接，避免一触碰就离开页面。
const PREVIEW_OFFSET_X = 14;
const PREVIEW_OFFSET_Y = 18;
const PREVIEW_EDGE = 8;
const PREVIEW_TAP_GAP = 10;
const PREVIEW_TOUCH_WINDOW = 700; // 识别触屏 tap 后浏览器合成的 mouse 事件
const PREVIEW_LINK_HINT = '<div class="dict-preview-hint">\u518d\u6b21\u70b9\u51fb\u6253\u5f00\u94fe\u63a5</div>';

const createPreviewController = (rootEl) => {
  const tip = document.createElement('div');
  tip.className = 'dict-preview-tooltip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);

  const supportsHover = typeof window.matchMedia === 'function'
    ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
    : true;

  let activeLine = null;
  let visible = false;
  let tipW = 0;
  let tipH = 0;
  let currentHtml = null;
  let pinnedLine = null;  // 触屏/键盘：浮层锚定在这一行
  let lastTouchAt = 0;

  const fromTouch = (e) =>
    !!((e && e.pointerType === 'touch') ||
       (e && e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) ||
       (Date.now() - lastTouchAt < PREVIEW_TOUCH_WINDOW));

  // 书证行与同义词标签都用 data-preview 标记，共用这一套浮层（含触屏两段式）
  const findLine = (e) => {
    const t = e && e.target;
    const line = t && t.closest ? t.closest('[data-preview]') : null;
    return line && rootEl.contains(line) ? line : null;
  };

  const hide = () => {
    if (!visible && !activeLine && !pinnedLine) return;
    visible = false;
    activeLine = null;
    pinnedLine = null;
    currentHtml = null;
    tip.classList.remove('is-visible');
  };

  // 内容变化时才重新测量尺寸，避免每次 mousemove 都强制同步布局
  const measure = () => {
    tip.style.left = '0px';
    tip.style.top = '0px';
    const rect = tip.getBoundingClientRect();
    tipW = rect.width;
    tipH = rect.height;
  };

  // 鼠标：跟随指针，靠近视口右/下边缘时翻到另一侧
  const place = (clientX, clientY) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = clientX + PREVIEW_OFFSET_X;
    let y = clientY + PREVIEW_OFFSET_Y;

    if (x + tipW > vw - PREVIEW_EDGE) x = clientX - tipW - PREVIEW_OFFSET_X;
    if (y + tipH > vh - PREVIEW_EDGE) y = clientY - tipH - PREVIEW_OFFSET_Y;

    const maxX = Math.max(PREVIEW_EDGE, vw - tipW - PREVIEW_EDGE);
    const maxY = Math.max(PREVIEW_EDGE, vh - tipH - PREVIEW_EDGE);
    tip.style.left = `${Math.round(Math.max(PREVIEW_EDGE, Math.min(x, maxX)))}px`;
    tip.style.top = `${Math.round(Math.max(PREVIEW_EDGE, Math.min(y, maxY)))}px`;
  };

  // 触屏/键盘：锚定到书证行/同义词标签附近（优先上方居中，放不下改下方），再 clamp 进视口
  const placeNear = (line) => {
    const r = line.getBoundingClientRect
      ? line.getBoundingClientRect()
      : { left: 0, top: 0, bottom: 0, width: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let x = r.left + r.width / 2 - tipW / 2;
    let y = r.top - tipH - PREVIEW_TAP_GAP;
    if (y < PREVIEW_EDGE) y = r.bottom + PREVIEW_TAP_GAP;
    const maxX = Math.max(PREVIEW_EDGE, vw - tipW - PREVIEW_EDGE);
    const maxY = Math.max(PREVIEW_EDGE, vh - tipH - PREVIEW_EDGE);
    tip.style.left = `${Math.round(Math.max(PREVIEW_EDGE, Math.min(x, maxX)))}px`;
    tip.style.top = `${Math.round(Math.max(PREVIEW_EDGE, Math.min(y, maxY)))}px`;
  };

  const show = (line, coords, extraHtml = '') => {
    const html = (line.dataset.preview || '') + extraHtml;
    if (line !== activeLine || html !== currentHtml) {
      activeLine = line;
      currentHtml = html;
      // preview 本身是受信任的数据片段，按需求作为 HTML 渲染
      tip.innerHTML = html;
      tip.classList.add('is-visible');
      visible = true;
      measure();
    }
    if (coords) place(coords.x, coords.y);
    else placeNear(line);
  };

  // 列表会被 innerHTML 反复重渲染，因此所有事件都委托到容器
  if (supportsHover) {
    const onMove = (e) => {
      // 忽略触屏 tap 后浏览器合成的 mouseover/mousemove，避免覆盖锚定浮层
      if (pinnedLine || fromTouch(e)) return;
      const line = findLine(e);
      if (!line) { hide(); return; }
      show(line, { x: e.clientX, y: e.clientY });
    };
    rootEl.addEventListener('mousemove', onMove);
    rootEl.addEventListener('mouseover', onMove);
    rootEl.addEventListener('mouseleave', () => { if (!pinnedLine && !fromTouch()) hide(); });

    // 键盘 Tab 到带 preview 的链接行时也能看到内容
    rootEl.addEventListener('focusin', (e) => {
      const line = findLine(e);
      if (!line || fromTouch(e)) return;
      pinnedLine = line;
      show(line, null);
    });
    rootEl.addEventListener('focusout', () => { if (pinnedLine) hide(); });
  }

  // 记录触摸：既用于识别合成 mouse 事件，也兼容二合一设备
  rootEl.addEventListener('touchstart', () => { lastTouchAt = Date.now(); }, { passive: true });
  rootEl.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') lastTouchAt = Date.now();
  }, true);

  // 触屏点击：显示/收起浮层；链接行两段式，首次不跳转
  rootEl.addEventListener('click', (e) => {
    const line = findLine(e);
    if (!line || !fromTouch(e)) return; // 鼠标点击交给 hover / 原链接行为

    // data-has-link 由书证链接行与「同义词也是词条」的标签共同下发
    const isLink = line.dataset.hasLink === '1';
    if (pinnedLine === line) {
      hide();                          // 第二次：非链接行收起，链接行放行跳转
      return;
    }
    if (isLink) e.preventDefault();    // 首次只展示 preview，不离开页面
    pinnedLine = line;
    show(line, null, isLink ? PREVIEW_LINK_HINT : '');
  });

  // 点书证行以外的任何地方都收起（浮层 pointer-events:none，点它会穿透到这里）
  document.addEventListener('click', (e) => {
    if (!visible || findLine(e)) return;
    hide();
  });

  // 滚动/缩放后不再沿用旧坐标，直接收起
  window.addEventListener('scroll', hide, true);
  window.addEventListener('resize', hide);

  return { hide };
};

// ===== URL 参数：?keyword=xxx 首次进入时读取一次 =====
// 只在页面加载时读，之后搜索框怎么改都不动地址栏（避免多余的 history 逻辑）。
const readKeywordFromUrl = () => {
  try {
    const search = window.location && window.location.search;
    if (!search || typeof URLSearchParams !== 'function') return '';
    return new URLSearchParams(search).get('keyword') || '';
  } catch (e) {
    return '';
  }
};

// 初始化
const initDictionary = () => {
  const DICTIONARY = window.DICTIONARY_DATA || [];

  const input = document.getElementById('dict-input');
  const results = document.getElementById('dict-results');
  const count = document.getElementById('dict-count');
  let cloud = document.getElementById('dict-wordcloud');

  if (!input || !results || !count) {
    console.warn('[Dictionary] Required DOM elements not found');
    return;
  }

  // 兼容尚未包含词云容器的旧页面：动态补一个
  if (!cloud) {
    cloud = document.createElement('div');
    cloud.id = 'dict-wordcloud';
    cloud.className = 'dict-wordcloud';
    results.parentNode.insertBefore(cloud, results);
  }

  const preview = createPreviewController(results);

  // 词云只生成一次，切换显隐时复用，避免清空搜索框后重新随机造成跳动
  const titles = pickCloudWords(DICTIONARY);
  const cloudMotion = renderWordCloud(cloud, titles, (kw) => {
    input.value = kw;
    // 派发 input 事件复用既有搜索链路（含 rAF 与显隐分流）
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  });

  // 空关键字 => 词云态，不展示结果；有关键字 => 结果列表
  const updateView = (rawKeyword) => {
    const kw = rawKeyword.trim();
    preview.hide(); // 列表重渲染前先收起浮层
    if (!kw) {
      results.innerHTML = '';
      results.hidden = true;
      count.textContent = titles.length
        ? '\u70b9\u51fb\u8bcd\u6761\u53ef\u5feb\u901f\u641c\u7d22'
        : '\u6682\u65e0\u8bcd\u6761\u6570\u636e';
      cloud.hidden = !titles.length;
      if (titles.length) cloudMotion.start(); else cloudMotion.stop();
    } else {
      cloud.hidden = true;
      cloudMotion.stop();
      results.hidden = false;
      render(DICTIONARY, kw, results, count);
    }
  };

  let rafId = 0;
  input.addEventListener('input', () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => updateView(input.value));
  });

  // 直达链接：?keyword=臻 只在首次进入时读一次，回填输入框并展示结果；无参数则展示词云
  input.value = readKeywordFromUrl().trim();
  updateView(input.value);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDictionary);
} else {
  initDictionary();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { escapeHtml, escapeRegExp, highlight, wordClassInfo, renderBookRefLine, renderSynonymLine, renderMeaning, renderEntry, searchEntries, render, shuffle, pickCloudWords, buildCloudSlots, renderWordCloud, createPreviewController, readKeywordFromUrl, initDictionary };
}