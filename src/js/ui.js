// Photo299 - interfaccia: menu, menu contestuale tasto destro, barra strumenti, opzioni, pannelli
'use strict';

P.ui = {
  menus: [
    { label: 'File', items: ['new', 'open', 'place', '-', 'save', 'saveAs', 'openProject', '-', 'export', 'quickPng', '-', 'clearCache', '-', 'quit'] },
    { label: 'Modifica', items: ['undo', 'redo', '-', 'cut', 'copy', 'copyMerged', 'paste', 'clear', '-', 'fillFg', 'fillBg', '-', 'freeTransform'] },
    { label: 'Immagine', items: ['imageSize', 'canvasSize', 'cropSel', 'trim', '-', 'rotCW', 'rotCCW', 'rot180', 'flipH', 'flipV', '-', 'adjust', 'invertColors', 'grayscale'] },
    { label: 'Livello', items: ['layer-new', 'layer-text', 'layer-edit-text', 'layer-duplicate', 'layer-delete', '-', 'layer-up', 'layer-down', '-', 'layer-merge-down', 'flatten', '-', 'layerFlipH', 'layerFlipV'] },
    { label: 'Selezione', items: ['selectAll', 'deselect', 'invertSel', '-', 'selectAllLayers'] },
    { label: 'Visualizza', items: ['zoomIn', 'zoomOut', 'fit', 'actual', '-', 'fullscreen', 'devtools'] },
    { label: 'Aiuto', items: ['shortcuts', 'about'] }
  ],
  palette: ['#000000', '#ffffff', '#7f7f7f', '#c3c3c3', '#880015', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#3f48cc', '#a349a4',
    '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea', '#7092be', '#c8bfe7', '#1e1e1e', '#3d8bfd', '#a855f7', '#f43f5e'],

  init() {
    this.buildMenus();
    this.buildToolbar();
    this.buildPalette();
    this.bindColor();
    this.bindLayersPanel();
    document.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('click', () => P.run(b.dataset.cmd)));
  },

  // ---------- Menu superiore ----------
  buildMenus() {
    const nav = document.getElementById('menus');
    const dd = document.getElementById('menu-dropdown');
    const ctxMenu = document.getElementById('context-menu');
    let openIdx = -1;
    const close = () => {
      dd.classList.add('hidden');
      if (ctxMenu) ctxMenu.classList.add('hidden');
      nav.querySelectorAll('.menu-item').forEach(m => m.classList.remove('open'));
      openIdx = -1;
    };
    const open = (i, el) => {
      if (ctxMenu) ctxMenu.classList.add('hidden');
      openIdx = i;
      nav.querySelectorAll('.menu-item').forEach(m => m.classList.remove('open'));
      el.classList.add('open');
      dd.innerHTML = '';
      for (const id of this.menus[i].items) {
        if (id === '-') { dd.insertAdjacentHTML('beforeend', '<div class="dd-sep"></div>'); continue; }
        const c = P.commands[id]; if (!c) continue;
        const it = document.createElement('div');
        const en = !c.enabled || c.enabled();
        it.className = 'dd-item' + (en ? '' : ' disabled');
        it.innerHTML = `<span>${c.label}</span><span class="sc">${c.sc ? c.sc.join(' / ') : ''}</span>`;
        it.addEventListener('click', () => { close(); P.run(id); });
        dd.appendChild(it);
      }
      const r = el.getBoundingClientRect();
      dd.style.left = r.left + 'px'; dd.style.top = (r.bottom + 2) + 'px';
      dd.classList.remove('hidden');
    };
    this.menus.forEach((m, i) => {
      const el = document.createElement('div');
      el.className = 'menu-item'; el.textContent = m.label;
      el.addEventListener('mousedown', e => { e.stopPropagation(); openIdx === i ? close() : open(i, el); });
      el.addEventListener('mouseenter', () => { if (openIdx >= 0 && openIdx !== i) open(i, el); });
      nav.appendChild(el);
    });
    document.addEventListener('mousedown', e => {
      if (!dd.contains(e.target) && (!ctxMenu || !ctxMenu.contains(e.target))) close();
    });
    window.addEventListener('blur', close);
    this.closeMenus = close;
  },

  // ---------- Menu contestuale tasto destro ----------
  openContextMenu(clientX, clientY, docPt) {
    const cm = document.getElementById('context-menu');
    if (!cm || !P.doc) return;
    this.closeMenus();
    cm.innerHTML = '';

    const addItem = (label, sc, fn, enabled = true) => {
      const it = document.createElement('div');
      it.className = 'dd-item' + (enabled ? '' : ' disabled');
      it.innerHTML = `<span>${label}</span><span class="sc">${sc || ''}</span>`;
      if (enabled) {
        it.addEventListener('click', () => {
          cm.classList.add('hidden');
          fn();
        });
      }
      cm.appendChild(it);
    };
    const addCmd = id => {
      const c = P.commands[id]; if (!c) return;
      const en = !c.enabled || c.enabled();
      addItem(c.label, c.sc ? c.sc[0] : '', () => P.run(id), en);
    };
    const addSep = () => cm.insertAdjacentHTML('beforeend', '<div class="dd-sep"></div>');
    const addHead = txt => cm.insertAdjacentHTML('beforeend', `<div class="dd-head">${txt}</div>`);

    // 1. Se Trasformazione Libera è attiva
    if (P.transform.active) {
      addHead('Trasformazione libera');
      addItem('✓ Conferma trasformazione', 'Invio', () => P.transform.commit());
      addItem('✗ Annulla trasformazione', 'Esc', () => P.transform.cancel());
      addSep();
      addItem('↔ Rifletti orizzontale', '', () => { P.transform.flip('h'); this.updateTransformFields(); });
      addItem('↕ Rifletti verticale', '', () => { P.transform.flip('v'); this.updateTransformFields(); });
      addItem('⟳ Ruota 90° orario', '', () => P.transform.rotateBy(90));
      addItem('⟲ Ruota 90° antiorario', '', () => P.transform.rotateBy(-90));
    } else {
      // 2. Opzioni Selezione (sempre in primo piano quando c'è una selezione o per selezionare tutto)
      addHead('Selezione');
      addCmd('deselect');
      addCmd('selectAll');
      addCmd('invertSel');
      if (P.sel.active) {
        addCmd('cropSel');
      }

      addSep();
      addHead('Azioni rapide');
      addCmd('freeTransform');
      const activeLayer = P.Doc.active();
      if (activeLayer && activeLayer.textData) {
        addCmd('layer-edit-text');
      }
      addItem('Inserisci testo qui…', 'T', () => {
        const x = docPt ? Math.round(docPt.x) : Math.round(P.doc.width / 2);
        const y = docPt ? Math.round(docPt.y) : Math.round(P.doc.height / 2);
        P.dialog.textEditor({ x, y });
      });

      addSep();
      addCmd('cut');
      addCmd('copy');
      addCmd('paste');
      addCmd('clear');
      addCmd('fillFg');

      addSep();
      addHead('Livelli (' + P.Doc.selectedLayers().length + ' selezionat' + (P.Doc.selectedLayers().length === 1 ? 'o' : 'i') + ')');
      addCmd('layer-new');
      addCmd('layer-duplicate');
      addCmd('layer-merge-down');
      addCmd('layer-delete');
    }

    cm.classList.remove('hidden');
    const rect = cm.getBoundingClientRect();
    const x = Math.min(clientX, window.innerWidth - rect.width - 8);
    const y = Math.min(clientY, window.innerHeight - rect.height - 8);
    cm.style.left = Math.max(4, x) + 'px';
    cm.style.top = Math.max(4, y) + 'px';
  },

  // ---------- Strumenti ----------
  buildToolbar() {
    const tb = document.getElementById('toolbar');
    for (const t of P.tools.list) {
      if (t.sep) { tb.insertAdjacentHTML('beforeend', '<div class="tool-sep"></div>'); continue; }
      const b = document.createElement('button');
      b.className = 'tool-btn'; b.dataset.tool = t.id;
      b.title = `${t.name} (${t.key})`;
      b.innerHTML = t.icon;
      b.addEventListener('click', () => P.tools.select(t.id));
      tb.appendChild(b);
    }
  },
  updateToolbar() {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.toggle('active', P.tools.current && b.dataset.tool === P.tools.current.id));
  },

  // ---------- Barra opzioni ----------
  slider(label, obj, key, min, max, unit = '') {
    const wrap = document.createElement('div'); wrap.className = 'opt';
    wrap.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" value="${obj[key]}"><input type="number" min="${min}" max="${max}" value="${obj[key]}"><span class="val">${unit}</span>`;
    const [r, n] = wrap.querySelectorAll('input');
    const set = v => { v = P.util.clamp(Math.round(+v || min), min, max); obj[key] = v; r.value = v; n.value = v; P.render.request(); };
    r.addEventListener('input', () => set(r.value));
    n.addEventListener('change', () => set(n.value));
    wrap._set = set;
    return wrap;
  },
  html(s) { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstChild; },

  updateOptions() {
    const bar = document.getElementById('optionsbar');
    bar.innerHTML = '';
    if (P.transform.active) return this.transformOptions(bar);
    const t = P.tools.current; if (!t) return;
    bar.appendChild(this.html(`<span class="opt-title">${t.name}</span>`));
    const S = P.settings;

    if (t.id === 'brush' || t.id === 'eraser') {
      const o = t.id === 'brush' ? S.brush : S.eraser;
      // Selettore pattern del pennello
      const patBar = this.html('<div class="pattern-bar" title="Forma / Pattern punta pennello"></div>');
      for (const p of P.BRUSH_PATTERNS) {
        const b = this.html(`<button class="pat-btn${o.pattern === p.id ? ' active' : ''}">${p.label}</button>`);
        b.addEventListener('click', () => {
          o.pattern = p.id;
          this.updateOptions();
          P.render.request();
        });
        patBar.appendChild(b);
      }
      bar.appendChild(patBar);
      bar.appendChild(this.slider('Dim', o, 'size', 1, 500, 'px'));
      bar.appendChild(this.slider('Durezza', o, 'hardness', 0, 100, '%'));
      bar.appendChild(this.slider('Opacità', o, 'opacity', 1, 100, '%'));
    }

    if (t.id === 'text') {
      const ts = S.text;
      const fontSel = this.html(`<select title="Carattere">${P.FONTS.map(f => `<option value="${f}" ${ts.font === f ? 'selected' : ''}>${f.split(',')[0]}</option>`).join('')}</select>`);
      fontSel.addEventListener('change', () => { ts.font = fontSel.value; });
      bar.appendChild(fontSel);
      bar.appendChild(this.slider('Dim', ts, 'size', 8, 400, 'px'));

      const bBold = this.html(`<button class="btn small${ts.bold ? ' active' : ''}" title="Grassetto"><b>B</b></button>`);
      bBold.addEventListener('click', () => { ts.bold = !ts.bold; this.updateOptions(); });
      const bItalic = this.html(`<button class="btn small${ts.italic ? ' active' : ''}" title="Corsivo"><i>I</i></button>`);
      bItalic.addEventListener('click', () => { ts.italic = !ts.italic; this.updateOptions(); });
      bar.appendChild(bBold);
      bar.appendChild(bItalic);

      const newTxtBtn = this.html('<button class="btn small primary">＋ Nuovo testo al centro</button>');
      newTxtBtn.addEventListener('click', () => P.run('layer-text'));
      bar.appendChild(newTxtBtn);

      const act = P.Doc.active();
      if (act && act.textData) {
        const editBtn = this.html('<button class="btn small">✎ Modifica testo selezionato</button>');
        editBtn.addEventListener('click', () => P.dialog.textEditor({ layer: act }));
        bar.appendChild(editBtn);
      }
      bar.appendChild(this.html('<span class="hint">Clicca sul foglio per aggiungere o modificare un testo</span>'));
    }

    if (['rect', 'ellipse', 'lasso', 'wand'].includes(t.id)) {
      const modes = [['new', 'Nuova'], ['add', 'Aggiungi'], ['sub', 'Sottrai'], ['intersect', 'Interseca']];
      const w = this.html('<div class="opt"></div>');
      for (const [m, l] of modes) {
        const b = this.html(`<button class="btn small${S.selMode === m ? ' primary' : ''}">${l}</button>`);
        b.addEventListener('click', () => { S.selMode = m; this.updateOptions(); });
        w.appendChild(b);
      }
      bar.appendChild(w);
    }

    if (['wand', 'magic', 'bucket'].includes(t.id)) {
      bar.appendChild(this.slider('Tolleranza', S, 'tolerance', 0, 255));
      const c = this.html(`<label class="opt"><input type="checkbox" ${S.contiguous ? 'checked' : ''}> Contigui</label>`);
      c.querySelector('input').addEventListener('change', e => { S.contiguous = e.target.checked; });
      bar.appendChild(c);
    }

    if (['rect', 'ellipse', 'lasso', 'wand'].includes(t.id)) {
      const deselBtn = this.html('<button class="btn small">Deseleziona (Ctrl+D)</button>');
      deselBtn.addEventListener('click', () => P.run('deselect'));
      bar.appendChild(deselBtn);
      bar.appendChild(this.html('<span class="hint">Clic vuoto o Tasto destro → Deseleziona</span>'));
    }

    if (t.id === 'move') {
      const auto = this.html(`<label class="opt"><input type="checkbox" ${S.autoSelect ? 'checked' : ''}> Selezione automatica livello</label>`);
      auto.querySelector('input').addEventListener('change', e => { S.autoSelect = e.target.checked; });
      bar.appendChild(auto);
      const tfBtn = this.html('<button class="btn small">Trasformazione libera (Ctrl+T)</button>');
      tfBtn.addEventListener('click', () => P.run('freeTransform'));
      bar.appendChild(tfBtn);
      bar.appendChild(this.html('<span class="hint">Ctrl+clic = seleziona più elementi insieme</span>'));
    }

    if (t.id === 'picker') bar.appendChild(this.html('<span class="hint">Clic = colore primo piano · Alt+clic = colore di sfondo</span>'));
    if (t.id === 'crop') {
      if (t.rect) {
        const a = this.html('<button class="btn small primary">✓ Applica (Invio)</button>');
        a.addEventListener('click', () => t.apply());
        const c = this.html('<button class="btn small">✗ Annulla (Esc)</button>');
        c.addEventListener('click', () => t.cancel());
        bar.appendChild(a); bar.appendChild(c);
      } else bar.appendChild(this.html('<span class="hint">Trascina sull\'immagine per definire l\'area da ritagliare</span>'));
    }
    if (t.id === 'hand' || t.id === 'zoom') {
      for (const [id, l] of [['fit', 'Adatta allo schermo'], ['actual', '100%']]) {
        const b = this.html(`<button class="btn small">${l}</button>`); b.addEventListener('click', () => P.run(id)); bar.appendChild(b);
      }
      bar.appendChild(this.html('<span class="hint">Rotella = zoom · Spazio+trascina = sposta vista</span>'));
    }
  },

  transformOptions(bar) {
    const s = P.transform.s;
    const count = s.items ? s.items.length : 1;
    bar.appendChild(this.html(`<span class="opt-title">${s.moveOnly ? 'Sposta' : 'Trasforma'} (${count} liv.)</span>`));
    const f = this.html(`<div class="opt">
      <span>L</span><input id="tf-w" type="number" step="1">%
      <span>A</span><input id="tf-h" type="number" step="1">%
      <span>Angolo</span><input id="tf-a" type="number" step="1">°
    </div>`);
    bar.appendChild(f);
    f.querySelector('#tf-w').addEventListener('change', e => P.transform.setValues({ wPct: +e.target.value }));
    f.querySelector('#tf-h').addEventListener('change', e => P.transform.setValues({ hPct: +e.target.value }));
    f.querySelector('#tf-a').addEventListener('change', e => P.transform.setValues({ angleDeg: +e.target.value }));
    const btns = [['↔ Rifletti O', () => P.transform.flip('h')], ['↕ Rifletti V', () => P.transform.flip('v')], ['⟳ 90°', () => P.transform.rotateBy(90)], ['⟲ 90°', () => P.transform.rotateBy(-90)]];
    for (const [l, fn] of btns) { const b = this.html(`<button class="btn small">${l}</button>`); b.addEventListener('click', () => { fn(); this.updateTransformFields(); }); bar.appendChild(b); }
    const ok = this.html('<button class="btn small primary">✓ Conferma (Invio)</button>'); ok.addEventListener('click', () => P.transform.commit());
    const ko = this.html('<button class="btn small">✗ Annulla (Esc)</button>'); ko.addEventListener('click', () => P.transform.cancel());
    bar.appendChild(ok); bar.appendChild(ko);
    this.updateTransformFields();
  },
  updateTransformFields() {
    const s = P.transform.s; if (!s) return;
    const w = document.getElementById('tf-w'), h = document.getElementById('tf-h'), a = document.getElementById('tf-a');
    if (!w) return;
    if (document.activeElement !== w) w.value = Math.round(Math.abs(s.w) / s.sw * 1000) / 10;
    if (document.activeElement !== h) h.value = Math.round(Math.abs(s.h) / s.sh * 1000) / 10;
    if (document.activeElement !== a) a.value = Math.round(s.angle * 180 / Math.PI * 10) / 10;
  },

  // ---------- Colori ----------
  buildPalette() {
    const p = document.getElementById('palette');
    for (const c of this.palette) {
      const d = document.createElement('div'); d.style.background = c; d.title = c + ' (Alt+clic = sfondo)';
      d.addEventListener('click', e => { if (e.altKey) P.colors.bg = c; else P.colors.fg = c; this.updateColors(); });
      p.appendChild(d);
    }
  },
  bindColor() {
    const fgp = document.getElementById('fg-picker'), bgp = document.getElementById('bg-picker');
    document.getElementById('color-fg').addEventListener('click', () => { fgp.value = P.colors.fg; fgp.click(); });
    document.getElementById('color-bg').addEventListener('click', () => { bgp.value = P.colors.bg; bgp.click(); });
    fgp.addEventListener('input', () => { P.colors.fg = fgp.value; this.updateColors(); });
    bgp.addEventListener('input', () => { P.colors.bg = bgp.value; this.updateColors(); });
    document.getElementById('color-swap').addEventListener('click', () => P.run('swapColors'));
    document.getElementById('color-reset').addEventListener('click', () => P.run('resetColors'));
    const hex = document.getElementById('hex-input');
    hex.addEventListener('change', () => {
      let v = hex.value.trim(); if (!v.startsWith('#')) v = '#' + v;
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) { const c = P.util.hexToRgb(v); P.colors.fg = P.util.rgbToHex(c.r, c.g, c.b); }
      this.updateColors();
    });
    this.updateColors();
  },
  updateColors() {
    document.getElementById('color-fg').style.background = P.colors.fg;
    document.getElementById('color-bg').style.background = P.colors.bg;
    const hex = document.getElementById('hex-input');
    if (document.activeElement !== hex) hex.value = P.colors.fg.toUpperCase();
    P.render.request();
  },

  // ---------- Livelli (con selezione multipla Ctrl+clic e Shift+clic) ----------
  thumbs: new Map(),
  bindLayersPanel() {
    const op = document.getElementById('layer-opacity');
    op.addEventListener('input', () => {
      const sel = P.Doc.selectedLayers(); if (!sel.length) return;
      for (const l of sel) l.opacity = op.value / 100;
      document.getElementById('layer-opacity-val').textContent = op.value + '%';
      P.render.requestContent();
    });
    op.addEventListener('change', () => { if (P.Doc.active()) P.history.commit('Opacità livello'); });
  },
  updateLayers() {
    const list = document.getElementById('layers-list');
    const countSpan = document.getElementById('layers-sel-count');
    list.innerHTML = '';
    const d = P.doc;
    if (!d) { if (countSpan) countSpan.textContent = ''; return; }
    P.Doc.ensureSelection();
    const active = P.Doc.active();
    const selCount = d.selectedIds.length;
    if (countSpan) countSpan.textContent = selCount > 1 ? `(${selCount} selezionati)` : '';

    const ids = new Set();
    for (let i = d.layers.length - 1; i >= 0; i--) {
      const l = d.layers[i]; ids.add(l.id);
      const isAct = l === active;
      const isSel = P.Doc.isSelected(l.id);
      const row = document.createElement('div');
      row.className = 'layer' + (isAct ? ' active' : isSel ? ' selected' : '');
      row.title = 'Clic = seleziona · Ctrl+clic = selezione multipla · Maiusc+clic = intervallo';

      let th = this.thumbs.get(l.id);
      if (!th) { th = P.util.makeCanvas(80, 60); this.thumbs.set(l.id, th); l.thumbDirty = true; }
      if (l.thumbDirty) {
        const c = th.getContext('2d'); c.clearRect(0, 0, 80, 60);
        const s = Math.min(80 / d.width, 60 / d.height);
        c.imageSmoothingQuality = 'high';
        c.drawImage(l.canvas, (80 - d.width * s) / 2, (60 - d.height * s) / 2, d.width * s, d.height * s);
        l.thumbDirty = false;
      }
      const eye = document.createElement('span');
      eye.className = 'eye' + (l.visible ? '' : ' off'); eye.textContent = '👁'; eye.title = 'Mostra/nascondi';
      eye.addEventListener('click', e => { e.stopPropagation(); l.visible = !l.visible; P.history.commit(l.visible ? 'Mostra livello' : 'Nascondi livello'); });

      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = l.name + (l.opacity < 1 ? ` (${Math.round(l.opacity * 100)}%)` : '');
      name.title = l.textData ? 'Doppio clic per modificare il testo' : 'Doppio clic per rinominare';
      name.addEventListener('dblclick', e => {
        e.stopPropagation();
        if (l.textData) {
          P.Doc.selectLayer(l.id);
          this.updateLayers();
          P.dialog.textEditor({ layer: l });
          return;
        }
        const inp = document.createElement('input'); inp.value = l.name;
        name.innerHTML = ''; name.appendChild(inp); inp.focus(); inp.select();
        const done = ok => { if (ok && inp.value.trim() && inp.value !== l.name) { l.name = inp.value.trim(); P.history.commit('Rinomina livello'); } else this.updateLayers(); };
        inp.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter') done(true); if (ev.key === 'Escape') done(false); });
        inp.addEventListener('blur', () => done(true));
      });

      row.appendChild(eye);
      row.appendChild(th);
      if (l.textData) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = 'T';
        badge.title = 'Livello di testo modificabile (doppio clic per cambiare testo)';
        badge.addEventListener('click', e => {
          e.stopPropagation();
          P.Doc.selectLayer(l.id);
          this.updateLayers();
          P.dialog.textEditor({ layer: l });
        });
        row.appendChild(badge);
      }
      row.appendChild(name);

      row.addEventListener('click', e => {
        P.app.cancelPending();
        if (e.ctrlKey || e.metaKey) {
          P.Doc.selectLayer(l.id, { toggle: true });
        } else if (e.shiftKey) {
          P.Doc.selectLayer(l.id, { range: true });
        } else {
          P.Doc.selectLayer(l.id);
        }
        this.updateLayers();
        this.updateOptions();
      });
      list.appendChild(row);
    }
    for (const k of [...this.thumbs.keys()]) if (!ids.has(k)) this.thumbs.delete(k);
    if (active) {
      const v = Math.round(active.opacity * 100);
      document.getElementById('layer-opacity').value = v;
      document.getElementById('layer-opacity-val').textContent = v + '%';
    }
  },

  // ---------- Cronologia ----------
  updateHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    const h = P.history;
    h.entries.forEach((e, i) => {
      const row = document.createElement('div');
      row.className = 'hist' + (i === h.index ? ' current' : '') + (i > h.index ? ' future' : '');
      row.innerHTML = `<span class="n">${i + 1}</span><span>${e.label}</span>`;
      row.title = new Date(e.time).toLocaleTimeString();
      row.addEventListener('click', () => h.jump(i));
      list.appendChild(row);
    });
    const cur = list.children[h.index];
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  },

  // ---------- Stato ----------
  updateStatus() {
    document.getElementById('status-zoom').textContent = 'Zoom ' + Math.round(P.view.zoom * 100) + '%';
    const d = P.doc;
    const selN = d && d.selectedIds ? d.selectedIds.length : 1;
    document.getElementById('status-size').textContent = d ? `${d.width} × ${d.height} px · ${d.layers.length} liv.${selN > 1 ? ` (${selN} sel.)` : ''}` : '—';
    const m = P.view.mouseDoc;
    document.getElementById('status-pos').textContent = d && m && P.view.mouseIn ? `X ${Math.floor(m.x)}  Y ${Math.floor(m.y)}` : '';
  },
  updateTitle() {
    const d = P.doc;
    const t = d ? `${d.name} — Photo299` : 'Photo299';
    document.title = t;
    if (window.api) window.api.setTitle(t);
  }
};
