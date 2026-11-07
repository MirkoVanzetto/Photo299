// Photo299 - comandi (menu + scorciatoie + gestione multi-livello)
'use strict';

const hasDoc = () => !!P.doc;
const hasSel = () => !!P.doc && P.sel.active;
const isTextLayer = () => { const l = P.Doc.active(); return !!(l && l.textData); };

P.clipboard = null; // { canvas, x, y }

P.cmd = {
  // ---------- Documento ----------
  newDocument(w, h, bg, name) {
    P.app.cancelPending();
    P.doc = P.Doc.create(w, h, bg, name);
    P.history.reset(); P.sel.clear(true);
    P.history.commit('Nuovo documento');
    P.view.fit(1);
    P.ui.updateTitle();
  },

  async openFromBytes(name, bytes, path) {
    if (/\.p299$/i.test(name)) return this.loadProject(new TextDecoder().decode(bytes), name, path);
    const blob = new Blob([bytes], { type: P.util.mimeFromName(name) });
    return this.openImageBlob(blob, name);
  },

  async openImageBlob(blob, name) {
    let img;
    try { img = await P.util.blobToImage(blob); } catch { P.util.toast('Impossibile aprire il file'); return; }
    P.app.cancelPending();
    const base = name.replace(/\.[^.]+$/, '');
    P.doc = P.Doc.create(img.width, img.height, 'transparent', base);
    const l = P.doc.layers[0]; l.name = base;
    l.canvas.getContext('2d').drawImage(img, 0, 0);
    P.history.reset(); P.sel.clear(true);
    P.history.commit('Apri ' + name);
    P.view.fit(1);
    P.ui.updateTitle();
  },

  async pickFile(filters, inputId) {
    if (window.api) {
      const f = await window.api.openFile(filters);
      if (!f) return null;
      return { name: f.name, path: f.path, bytes: P.util.base64ToBytes(f.base64) };
    }
    return new Promise(res => {
      const inp = document.getElementById(inputId);
      inp.value = '';
      inp.onchange = async () => { const f = inp.files[0]; if (!f) return res(null); res({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) }); };
      inp.click();
    });
  },

  async open() {
    const f = await this.pickFile([{ name: 'Immagini e progetti', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'p299'] }], 'file-open');
    if (f) this.openFromBytes(f.name, f.bytes, f.path);
  },

  async place() {
    const f = await this.pickFile([{ name: 'Immagini', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] }], 'file-place');
    if (!f) return;
    const blob = new Blob([f.bytes], { type: P.util.mimeFromName(f.name) });
    if (!P.doc) return this.openImageBlob(blob, f.name);
    const img = await P.util.blobToImage(blob);
    this.placeImage(img, f.name.replace(/\.[^.]+$/, ''));
  },

  placeImage(img, name, pos) {
    P.app.cancelPending();
    const d = P.doc;
    let w = img.width, h = img.height;
    if (!pos && (w > d.width || h > d.height)) { const s = Math.min(d.width / w, d.height / h); w = Math.max(1, Math.round(w * s)); h = Math.max(1, Math.round(h * s)); }
    const src = P.util.makeCanvas(w, h);
    const sctx = src.getContext('2d'); sctx.imageSmoothingQuality = 'high'; sctx.drawImage(img, 0, 0, w, h);
    const prevActive = d.activeId;
    const prevSel = [...(d.selectedIds || [d.activeId])];
    const layer = P.Doc.addLayer(name || 'Immagine');
    P.sel.clear(true);
    P.ui.updateLayers();
    P.transform.begin({
      source: { canvas: src, x: pos ? pos.x : Math.round((d.width - w) / 2), y: pos ? pos.y : Math.round((d.height - h) / 2) },
      label: 'Inserisci immagine',
      onCommit: () => {},
      onCancel: () => {
        d.layers = d.layers.filter(l => l !== layer);
        d.activeId = prevActive;
        d.selectedIds = prevSel;
        P.app.changed({ content: true, noAutosave: true });
      }
    });
  },

  // ---------- Progetto .p299 ----------
  async projectBytes() {
    const d = P.doc;
    const layers = d.layers.map(l => ({
      name: l.name,
      visible: l.visible,
      opacity: l.opacity,
      textData: l.textData || null,
      data: l.canvas.toDataURL('image/png')
    }));
    const json = JSON.stringify({ app: 'Photo299', version: 2, name: d.name, width: d.width, height: d.height, activeIndex: P.Doc.activeIndex(), layers });
    return new TextEncoder().encode(json);
  },
  async save() {
    const d = P.doc; if (!d) return;
    P.app.cancelPending();
    if (d.filePath && window.api) {
      await window.api.saveFileTo(d.filePath, await this.projectBytes());
      P.util.toast('Progetto salvato'); return;
    }
    return this.saveAs();
  },
  async saveAs() {
    const d = P.doc; if (!d) return;
    P.app.cancelPending();
    const bytes = await this.projectBytes();
    const name = d.name + '.p299';
    if (window.api) {
      const r = await window.api.saveFile(name, [{ name: 'Progetto Photo299', extensions: ['p299'] }], bytes);
      if (r.canceled) return;
      d.filePath = r.path; d.name = r.path.split(/[\\/]/).pop().replace(/\.p299$/i, '');
    } else this.download(new Blob([bytes]), name);
    P.ui.updateTitle(); P.autosave();
    P.util.toast('Progetto salvato');
  },
  async loadProject(text, fileName, path) {
    let data;
    try { data = JSON.parse(text); if (data.app !== 'Photo299') throw 0; } catch { P.util.toast('File di progetto non valido'); return; }
    P.app.cancelPending();
    const doc = { id: P.util.uid(), name: data.name || fileName.replace(/\.p299$/i, ''), width: data.width, height: data.height, layers: [], activeId: null, selectedIds: [], filePath: path || null };
    for (const ld of data.layers) {
      const l = P.Doc.createLayer(ld.name, data.width, data.height);
      l.visible = ld.visible !== false;
      l.opacity = ld.opacity == null ? 1 : ld.opacity;
      l.textData = ld.textData || null;
      const img = await P.util.srcToImage(ld.data);
      l.canvas.getContext('2d').drawImage(img, 0, 0);
      doc.layers.push(l);
    }
    if (!doc.layers.length) doc.layers.push(P.Doc.createLayer('Livello 1', data.width, data.height));
    doc.activeId = (doc.layers[data.activeIndex] || doc.layers[doc.layers.length - 1]).id;
    doc.selectedIds = [doc.activeId];
    P.doc = doc;
    P.history.reset(); P.sel.clear(true);
    P.history.commit('Apri progetto');
    P.view.fit(1); P.ui.updateTitle();
  },

  // ---------- Esporta ----------
  download(blob, name) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  async exportImage(format, quality, scale, bg) {
    P.app.cancelPending();
    const d = P.doc;
    let c = P.Doc.composite(format === 'jpeg' ? bg : null);
    if (scale !== 1) {
      const w = Math.max(1, Math.round(d.width * scale)), h = Math.max(1, Math.round(d.height * scale));
      while (c.width / 2 >= w && c.height / 2 >= h) {
        const t = P.util.makeCanvas(c.width / 2, c.height / 2); const x = t.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, t.width, t.height); c = t;
      }
      const t = P.util.makeCanvas(w, h); const x = t.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, w, h); c = t;
    }
    const mime = 'image/' + format;
    const blob = await P.util.canvasToBlob(c, mime, quality);
    const ext = format === 'jpeg' ? 'jpg' : format;
    const name = `${d.name}.${ext}`;
    if (window.api) {
      const r = await window.api.saveFile(name, [{ name: format.toUpperCase(), extensions: [ext] }], new Uint8Array(await blob.arrayBuffer()));
      if (!r.canceled) P.util.toast('Esportato: ' + r.path.split(/[\\/]/).pop());
    } else this.download(blob, name);
  },

  // ---------- Appunti ----------
  copyFrom(src) {
    const ex = P.sel.extract(src);
    P.clipboard = ex;
    if (window.api) window.api.clipboardWriteImage(ex.canvas.toDataURL('image/png'));
    return ex;
  },
  copy() { const l = P.Doc.active(); if (!l) return; this.copyFrom(l.canvas); P.util.status('Copiato'); },
  copyMerged() { if (!P.doc) return; this.copyFrom(P.Doc.composite()); P.util.status('Copiato (unito)'); },
  cut() {
    const sel = P.Doc.selectedLayers(); if (!sel.length) return;
    this.copyFrom(P.Doc.active().canvas);
    for (const l of sel) {
      if (l.textData) l.textData = null;
      P.sel.clearFrom(l.canvas);
      P.Doc.markDirty(l);
    }
    P.history.commit('Taglia');
  },
  async paste() {
    P.app.cancelPending();
    let img = null, pos = null;
    let sys = null;
    if (window.api) { try { sys = await window.api.clipboardReadImage(); } catch { } }
    if (sys) {
      const si = await P.util.srcToImage(sys);
      const ic = P.clipboard;
      if (ic && ic.canvas.width === si.width && ic.canvas.height === si.height) { img = ic.canvas; pos = { x: ic.x, y: ic.y }; }
      else img = si;
    } else if (P.clipboard) { img = P.clipboard.canvas; pos = { x: P.clipboard.x, y: P.clipboard.y }; }
    if (!img) { P.util.toast('Gli appunti non contengono immagini'); return; }
    this.pasteImage(img, pos);
  },
  pasteImage(img, pos) {
    if (!P.doc) { this.newDocument(img.width, img.height, 'transparent', 'Incollato'); pos = { x: 0, y: 0 }; }
    const d = P.doc;
    if (!pos || pos.x + img.width > d.width + img.width / 2 || pos.y + img.height > d.height + img.height / 2) pos = { x: Math.round((d.width - img.width) / 2), y: Math.round((d.height - img.height) / 2) };
    const l = P.Doc.addLayer('Livello incollato');
    l.canvas.getContext('2d').drawImage(img, pos.x, pos.y);
    P.Doc.markDirty(l);
    P.sel.clear(true);
    P.history.commit('Incolla');
  },
  clear() {
    const sel = P.Doc.selectedLayers(); if (!sel.length) return;
    if (!P.sel.active) { P.util.toast('Nessuna selezione da cancellare'); return; }
    for (const l of sel) {
      if (l.textData) l.textData = null;
      P.sel.clearFrom(l.canvas);
      P.Doc.markDirty(l);
    }
    P.history.commit('Cancella');
  },
  fill(color, label) {
    const l = P.Doc.active(); if (!l) return;
    if (l.textData) l.textData = null;
    const ctx = l.canvas.getContext('2d');
    if (P.sel.active) {
      const t = P.util.cloneCanvas(P.sel.mask), tc = t.getContext('2d');
      tc.globalCompositeOperation = 'source-in'; tc.fillStyle = color; tc.fillRect(0, 0, t.width, t.height);
      ctx.drawImage(t, 0, 0);
    } else { ctx.fillStyle = color; ctx.fillRect(0, 0, l.canvas.width, l.canvas.height); }
    P.Doc.markDirty(l);
    P.history.commit(label);
  },

  // ---------- Immagine ----------
  resizeImage(w, h) {
    P.app.cancelPending();
    P.Doc.mapLayers(w, h, (ctx, src, l) => {
      if (l.textData) l.textData = null;
      let c = src;
      while (c.width / 2 >= w && c.height / 2 >= h) { const t = P.util.makeCanvas(c.width / 2, c.height / 2); const x = t.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, t.width, t.height); c = t; }
      ctx.drawImage(c, 0, 0, w, h);
    });
    P.sel.clear(true);
    P.history.commit('Dimensione immagine');
    P.view.fit(1);
  },
  resizeCanvas(w, h, anchor, fill) {
    P.app.cancelPending();
    const d = P.doc;
    const ox = Math.round((w - d.width) * anchor[0] / 2), oy = Math.round((h - d.height) * anchor[1] / 2);
    const oldW = d.width, oldH = d.height;
    const bottom = d.layers[0];
    P.Doc.mapLayers(w, h, (ctx, src, l) => {
      if (l === bottom && fill && fill !== 'transparent') {
        ctx.fillStyle = fill; ctx.fillRect(0, 0, w, h); ctx.clearRect(ox, oy, oldW, oldH);
      }
      ctx.drawImage(src, ox, oy);
      if (l.textData) { l.textData.x += ox; l.textData.y += oy; }
    });
    P.sel.clear(true);
    P.history.commit('Dimensione quadro');
    P.view.fit(1);
  },
  cropTo(r) {
    P.app.cancelPending();
    if (!r || r.w < 1 || r.h < 1) return;
    const rx = Math.round(r.x), ry = Math.round(r.y);
    P.Doc.mapLayers(Math.round(r.w), Math.round(r.h), (ctx, src, l) => {
      ctx.drawImage(src, -rx, -ry);
      if (l.textData) { l.textData.x -= rx; l.textData.y -= ry; }
    });
    P.sel.clear(true);
    P.history.commit('Ritaglia');
    P.view.fit(1);
  },
  trim() {
    const b = P.util.contentBounds(P.Doc.composite());
    if (!b) { P.util.toast('Immagine vuota'); return; }
    if (b.w === P.doc.width && b.h === P.doc.height) { P.util.toast('Niente da rifilare'); return; }
    this.cropTo(b);
  },
  rotate(deg) {
    P.app.cancelPending();
    const d = P.doc, swap = deg % 180 !== 0;
    const W = swap ? d.height : d.width, H = swap ? d.width : d.height;
    P.Doc.mapLayers(W, H, (ctx, src, l) => {
      if (l.textData) l.textData = null;
      ctx.translate(W / 2, H / 2); ctx.rotate(deg * Math.PI / 180); ctx.drawImage(src, -src.width / 2, -src.height / 2);
    });
    P.sel.clear(true);
    P.history.commit(`Ruota ${deg}°`);
    P.view.fit(1);
  },
  flip(axis, layerOnly) {
    P.app.cancelPending();
    const d = P.doc;
    const doFlip = l => {
      if (l.textData) l.textData = null;
      const c = P.util.makeCanvas(d.width, d.height), x = c.getContext('2d');
      if (axis === 'h') { x.translate(d.width, 0); x.scale(-1, 1); } else { x.translate(0, d.height); x.scale(1, -1); }
      x.drawImage(l.canvas, 0, 0); l.canvas = c; P.Doc.markDirty(l);
    };
    if (layerOnly) P.Doc.selectedLayers().forEach(doFlip);
    else { d.layers.forEach(doFlip); P.sel.clear(true); }
    P.history.commit((layerOnly ? 'Rifletti livello ' : 'Rifletti ') + (axis === 'h' ? 'orizzontale' : 'verticale'));
  },
  filteredLayer(layer, filter) {
    const d = P.doc;
    const t = P.util.makeCanvas(d.width, d.height), tc = t.getContext('2d');
    tc.filter = filter; tc.drawImage(layer.canvas, 0, 0); tc.filter = 'none';
    if (!P.sel.active) return t;
    const out = P.util.cloneCanvas(layer.canvas), oc = out.getContext('2d');
    P.sel.clearFrom(out);
    tc.globalCompositeOperation = 'destination-in'; tc.drawImage(P.sel.mask, 0, 0);
    oc.drawImage(t, 0, 0);
    return out;
  },
  applyFilter(filter, label) {
    P.app.cancelPending();
    const sel = P.Doc.selectedLayers(); if (!sel.length) return;
    for (const l of sel) {
      if (l.textData) l.textData = null;
      l.canvas = this.filteredLayer(l, filter);
      P.Doc.markDirty(l);
    }
    P.history.commit(label);
  },

  // ---------- Livelli (supporto selezione multipla) ----------
  layerNew() { P.app.cancelPending(); P.Doc.addLayer(); P.history.commit('Nuovo livello'); },
  layerDuplicate() {
    P.app.cancelPending();
    const sel = P.Doc.selectedLayers(); if (!sel.length) return;
    const newIds = [];
    for (const l of sel) {
      const n = P.Doc.addLayer(l.name + ' copia', l.canvas);
      n.opacity = l.opacity;
      if (l.textData) n.textData = { ...l.textData };
      newIds.push(n.id);
    }
    P.doc.selectedIds = newIds;
    P.doc.activeId = newIds[newIds.length - 1];
    P.history.commit(sel.length > 1 ? 'Duplica livelli' : 'Duplica livello');
  },
  layerDelete() {
    P.app.cancelPending();
    const d = P.doc;
    const sel = new Set(d.selectedIds || [d.activeId]);
    if (sel.size >= d.layers.length) {
      P.util.toast('Il documento deve mantenere almeno un livello');
      return;
    }
    const firstIdx = d.layers.findIndex(l => sel.has(l.id));
    d.layers = d.layers.filter(l => !sel.has(l.id));
    const nextLayer = d.layers[Math.max(0, Math.min(d.layers.length - 1, firstIdx - 1))];
    d.activeId = nextLayer.id;
    d.selectedIds = [nextLayer.id];
    P.history.commit(sel.size > 1 ? 'Elimina livelli' : 'Elimina livello');
  },
  layerMove(dir) {
    P.app.cancelPending();
    const d = P.doc, i = P.Doc.activeIndex(), j = i + dir;
    if (j < 0 || j >= d.layers.length) return;
    [d.layers[i], d.layers[j]] = [d.layers[j], d.layers[i]];
    P.history.commit(dir > 0 ? 'Sposta livello su' : 'Sposta livello giù');
  },
  mergeDown() {
    P.app.cancelPending();
    const d = P.doc;
    const sel = P.Doc.selectedLayers();
    if (sel.length > 1) {
      // Unisce tutti i livelli selezionati nel più basso tra i selezionati
      const base = sel[0];
      if (base.textData) base.textData = null;
      const c = P.util.makeCanvas(d.width, d.height), x = c.getContext('2d');
      for (const l of sel) {
        if (!l.visible) continue;
        x.globalAlpha = l.opacity;
        x.drawImage(l.canvas, 0, 0);
      }
      x.globalAlpha = 1;
      base.canvas = c;
      base.opacity = 1;
      P.Doc.markDirty(base);
      const removeIds = new Set(sel.slice(1).map(l => l.id));
      d.layers = d.layers.filter(l => !removeIds.has(l.id));
      d.activeId = base.id;
      d.selectedIds = [base.id];
      P.history.commit('Unisci livelli selezionati');
      return;
    }
    const i = P.Doc.activeIndex();
    if (i <= 0) { P.util.toast('Nessun livello sotto'); return; }
    const top = d.layers[i], below = d.layers[i - 1];
    if (below.textData) below.textData = null;
    const c = P.util.cloneCanvas(below.canvas), x = c.getContext('2d');
    if (top.visible) { x.globalAlpha = top.opacity; x.drawImage(top.canvas, 0, 0); }
    below.canvas = c; P.Doc.markDirty(below);
    d.layers.splice(i, 1);
    d.activeId = below.id;
    d.selectedIds = [below.id];
    P.history.commit('Unisci sotto');
  },
  flatten() {
    P.app.cancelPending();
    const d = P.doc;
    const l = P.Doc.createLayer('Sfondo', d.width, d.height);
    l.canvas = P.Doc.composite();
    d.layers = [l]; d.activeId = l.id; d.selectedIds = [l.id];
    P.history.commit('Unisci tutto');
  }
};

// Registro dei comandi: etichetta, scorciatoie, azione
P.commands = {
  new: { label: 'Nuovo…', sc: ['Ctrl+N'], run: () => P.dialog.newDoc() },
  open: { label: 'Apri…', sc: ['Ctrl+O'], run: () => P.cmd.open() },
  place: { label: 'Inserisci immagine…', sc: ['Ctrl+Shift+O'], run: () => P.cmd.place() },
  save: { label: 'Salva progetto', sc: ['Ctrl+S'], run: () => P.cmd.save(), enabled: hasDoc },
  saveAs: { label: 'Salva progetto con nome…', sc: ['Ctrl+Alt+S'], run: () => P.cmd.saveAs(), enabled: hasDoc },
  openProject: { label: 'Apri progetto (.p299)…', run: () => P.cmd.open() },
  export: { label: 'Esporta come…', sc: ['Ctrl+Shift+S'], run: () => P.dialog.exportImage(), enabled: hasDoc },
  quickPng: { label: 'Esportazione rapida PNG', sc: ['Ctrl+Shift+Alt+S'], run: () => P.cmd.exportImage('png', 1, 1), enabled: hasDoc },
  clearCache: { label: 'Svuota cache locale…', run: async () => { if (await P.dialog.confirm('Svuota cache', 'La cronologia salvata verrà eliminata. Il documento aperto resta in memoria finché non chiudi l\'app.')) { await P.storage.clear(); P.util.toast('Cache svuotata'); } } },
  quit: { label: 'Esci', sc: ['Ctrl+Q'], run: () => window.api ? window.api.quit() : window.close() },

  undo: { label: 'Annulla', sc: ['Ctrl+Z'], run: () => P.history.undo(), enabled: () => P.history.canUndo() },
  redo: { label: 'Ripeti', sc: ['Ctrl+Shift+Z', 'Ctrl+Y'], run: () => P.history.redo(), enabled: () => P.history.canRedo() },
  cut: { label: 'Taglia', sc: ['Ctrl+X'], run: () => P.cmd.cut(), enabled: hasDoc },
  copy: { label: 'Copia', sc: ['Ctrl+C'], run: () => P.cmd.copy(), enabled: hasDoc },
  copyMerged: { label: 'Copia unito', sc: ['Ctrl+Shift+C'], run: () => P.cmd.copyMerged(), enabled: hasDoc },
  paste: { label: 'Incolla', sc: ['Ctrl+V'], run: () => P.cmd.paste() },
  clear: { label: 'Cancella selezione', sc: ['Delete', 'Backspace'], run: () => P.cmd.clear(), enabled: hasSel },
  fillFg: { label: 'Riempi con colore primo piano', sc: ['Alt+Backspace'], run: () => P.cmd.fill(P.colors.fg, 'Riempi'), enabled: hasDoc },
  fillBg: { label: 'Riempi con colore di sfondo', sc: ['Ctrl+Backspace'], run: () => P.cmd.fill(P.colors.bg, 'Riempi'), enabled: hasDoc },
  freeTransform: { label: 'Trasformazione libera', sc: ['Ctrl+T'], run: () => P.transform.begin(), enabled: hasDoc },

  imageSize: { label: 'Dimensione immagine…', sc: ['Ctrl+Alt+I'], run: () => P.dialog.imageSize(), enabled: hasDoc },
  canvasSize: { label: 'Dimensione quadro…', sc: ['Ctrl+Alt+C'], run: () => P.dialog.canvasSize(), enabled: hasDoc },
  cropSel: { label: 'Ritaglia sulla selezione', run: () => P.cmd.cropTo(P.sel.bounds), enabled: hasSel },
  trim: { label: 'Rifila (rimuovi bordi trasparenti)', run: () => P.cmd.trim(), enabled: hasDoc },
  rotCW: { label: 'Ruota 90° orario', run: () => P.cmd.rotate(90), enabled: hasDoc },
  rotCCW: { label: 'Ruota 90° antiorario', run: () => P.cmd.rotate(-90), enabled: hasDoc },
  rot180: { label: 'Ruota 180°', run: () => P.cmd.rotate(180), enabled: hasDoc },
  flipH: { label: 'Rifletti quadro orizzontalmente', run: () => P.cmd.flip('h'), enabled: hasDoc },
  flipV: { label: 'Rifletti quadro verticalmente', run: () => P.cmd.flip('v'), enabled: hasDoc },
  adjust: { label: 'Regolazioni (luminosità, contrasto…)…', sc: ['Ctrl+U'], run: () => P.dialog.adjust(), enabled: hasDoc },
  invertColors: { label: 'Inverti colori', sc: ['Ctrl+I'], run: () => P.cmd.applyFilter('invert(1)', 'Inverti colori'), enabled: hasDoc },
  grayscale: { label: 'Bianco e nero', sc: ['Ctrl+Shift+U'], run: () => P.cmd.applyFilter('grayscale(1)', 'Bianco e nero'), enabled: hasDoc },

  'layer-new': { label: 'Nuovo livello', sc: ['Ctrl+Shift+N'], run: () => P.cmd.layerNew(), enabled: hasDoc },
  'layer-text': { label: 'Nuovo livello di testo…', sc: ['T'], run: () => P.dialog.textEditor(), enabled: hasDoc },
  'layer-edit-text': { label: 'Modifica testo livello…', run: () => P.dialog.textEditor({ layer: P.Doc.active() }), enabled: isTextLayer },
  'layer-duplicate': { label: 'Duplica livello', sc: ['Ctrl+J'], run: () => P.cmd.layerDuplicate(), enabled: hasDoc },
  'layer-delete': { label: 'Elimina livello', run: () => P.cmd.layerDelete(), enabled: hasDoc },
  'layer-up': { label: 'Sposta livello su', sc: ['Ctrl+]'], run: () => P.cmd.layerMove(1), enabled: hasDoc },
  'layer-down': { label: 'Sposta livello giù', sc: ['Ctrl+['], run: () => P.cmd.layerMove(-1), enabled: hasDoc },
  'layer-merge-down': { label: 'Unisci selezionati / sotto', sc: ['Ctrl+E'], run: () => P.cmd.mergeDown(), enabled: hasDoc },
  flatten: { label: 'Unisci tutti i livelli', sc: ['Ctrl+Shift+E'], run: () => P.cmd.flatten(), enabled: hasDoc },
  layerFlipH: { label: 'Rifletti livello orizzontalmente', run: () => P.cmd.flip('h', true), enabled: hasDoc },
  layerFlipV: { label: 'Rifletti livello verticalmente', run: () => P.cmd.flip('v', true), enabled: hasDoc },

  selectAll: { label: 'Seleziona tutto', sc: ['Ctrl+A'], run: () => P.sel.selectAll(), enabled: hasDoc },
  deselect: { label: 'Deseleziona', sc: ['Ctrl+D'], run: () => { P.sel.clear(); P.util.status('Deselezionato'); }, enabled: hasSel },
  invertSel: { label: 'Inverti selezione', sc: ['Ctrl+Shift+I'], run: () => P.sel.invert(), enabled: hasDoc },
  selectAllLayers: {
    label: 'Seleziona tutti i livelli',
    sc: ['Ctrl+Alt+A'],
    run: () => {
      if (!P.doc) return;
      P.doc.selectedIds = P.doc.layers.map(l => l.id);
      P.ui.updateLayers();
    },
    enabled: hasDoc
  },

  zoomIn: { label: 'Aumenta zoom', sc: ['Ctrl+=', 'Ctrl++'], run: () => P.view.zoomAt(1.25), enabled: hasDoc },
  zoomOut: { label: 'Riduci zoom', sc: ['Ctrl+-'], run: () => P.view.zoomAt(0.8), enabled: hasDoc },
  fit: { label: 'Adatta allo schermo', sc: ['Ctrl+0'], run: () => P.view.fit(), enabled: hasDoc },
  actual: { label: 'Pixel effettivi (100%)', sc: ['Ctrl+1'], run: () => P.view.actualSize(), enabled: hasDoc },
  fullscreen: { label: 'Schermo intero', sc: ['F11'], run: () => window.api ? window.api.toggleFullscreen() : document.documentElement.requestFullscreen() },
  devtools: { label: 'Strumenti sviluppatore', sc: ['Ctrl+Shift+F12'], run: () => window.api && window.api.toggleDevTools() },

  swapColors: { label: 'Scambia colori', run: () => { const c = P.colors; [c.fg, c.bg] = [c.bg, c.fg]; P.ui.updateColors(); } },
  resetColors: { label: 'Colori predefiniti', run: () => { P.colors.fg = '#000000'; P.colors.bg = '#ffffff'; P.ui.updateColors(); } },
  shortcuts: { label: 'Scorciatoie da tastiera', sc: ['F1'], run: () => P.dialog.shortcuts() },
  about: { label: 'Informazioni su Photo299', run: () => P.dialog.about() }
};

P.run = function (id) {
  const c = P.commands[id];
  if (!c) return;
  if (c.enabled && !c.enabled()) return;
  try { const r = c.run(); if (r && r.catch) r.catch(err => { console.error(err); P.util.toast('Errore: ' + err.message); }); }
  catch (err) { console.error(err); P.util.toast('Errore: ' + err.message); }
};
