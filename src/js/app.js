// Photo299 - avvio applicazione ed eventi di input (mouse + pen + touch + tasto destro)
'use strict';

P.app = {
  spaceDown: false,
  panning: null,
  dragging: false,

  changed(opts = {}) {
    if (opts.content) P.render.requestContent(); else P.render.request();
    P.ui.updateLayers();
    P.ui.updateHistory();
    P.ui.updateStatus();
    if (!opts.noAutosave) P.autosave();
  },

  cancelPending() {
    if (P.transform.active) P.transform.commit();
    const t = P.tools.current;
    if (t && t.id !== 'crop' && t.cancel) t.cancel();
  },

  async init() {
    P.view.canvas = document.getElementById('view');
    P.view.el = document.getElementById('viewport');
    P.ui.init();
    P.tools.select('brush');
    this.bindPointer();
    this.bindKeys();
    this.bindDrop();
    new ResizeObserver(() => P.render.request()).observe(P.view.el);

    let restored = false;
    try { await P.storage.open(); restored = await P.storage.load(); }
    catch (err) { console.error('Ripristino cache fallito', err); }

    let pending = null;
    if (window.api) {
      pending = await window.api.getPendingFile();
      window.api.onOpenFile(f => P.cmd.openFromBytes(f.name, P.util.base64ToBytes(f.base64), f.path));
    }
    if (pending) await P.cmd.openFromBytes(pending.name, P.util.base64ToBytes(pending.base64), pending.path);
    else if (restored) { P.view.fit(1); P.util.toast('Sessione precedente ripristinata dalla cache'); }
    else {
      // Crea subito una pagina bianca 1920x1080 pronta per disegnare immediatamente
      P.cmd.newDocument(1920, 1080, '#ffffff', 'Senza titolo');
    }

    P.ui.updateTitle();
    P.ui.updateStatus();
    P.render.request();
  },

  bindPointer() {
    const cv = P.view.canvas, v = P.view;

    cv.addEventListener('pointerdown', e => {
      P.ui.closeMenus && P.ui.closeMenus();
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();

      // Tasto destro -> viene gestito da contextmenu
      if (e.button === 2) return;

      const t = P.tools.current;
      if (e.button === 1 || (e.button === 0 && (this.spaceDown || (t && t.id === 'hand')))) {
        try { cv.setPointerCapture(e.pointerId); } catch {}
        this.panning = { x: e.clientX, y: e.clientY, px: v.panX, py: v.panY };
        v.setCursor('grabbing');
        e.preventDefault();
        return;
      }

      if (e.button !== 0 || !P.doc) return;
      e.preventDefault();
      try { cv.setPointerCapture(e.pointerId); } catch {}

      const pt = v.eventToDoc(e);
      v.mouseDoc = pt; v.mouseIn = true;
      this.dragging = true;
      if (P.transform.active) { P.transform.down(pt); return; }
      if (t) t.down(pt, e);
    });

    // Ascoltiamo pointermove su window per garantire il trascinamento continuo del pennello anche ad alta velocità
    window.addEventListener('pointermove', e => {
      const pt = v.eventToDoc(e);
      v.mouseDoc = pt;
      const rect = cv.getBoundingClientRect();
      v.mouseIn = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      P.ui.updateStatus();

      if (this.panning) {
        v.panX = this.panning.px + e.clientX - this.panning.x;
        v.panY = this.panning.py + e.clientY - this.panning.y;
        P.render.request();
        return;
      }

      if (!P.doc) return;
      if (P.transform.active) {
        if (this.dragging || v.mouseIn) P.transform.move(pt, e);
        return;
      }

      const t = P.tools.current;
      // Sicurezza: se il bottone sinistro non è più premuto durante il trascinamento, chiudi il tratto
      if (this.dragging && e.buttons === 0) {
        this.dragging = false;
        if (t) t.up(pt, e);
        return;
      }

      if (this.dragging && t) {
        t.move(pt, e);
      } else if (v.mouseIn && t && t.overlay) {
        P.render.request();
      }
    });

    const end = e => {
      if (this.panning) {
        this.panning = null;
        const t = P.tools.current;
        v.setCursor(this.spaceDown ? 'grab' : (t ? t.cursor : 'default'));
        return;
      }
      if (!this.dragging) return;
      this.dragging = false;
      const pt = v.eventToDoc(e);
      if (P.transform.active) { P.transform.up(pt); return; }
      const t = P.tools.current;
      if (t) t.up(pt, e);
    };

    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    cv.addEventListener('pointerleave', () => { v.mouseIn = false; P.ui.updateStatus(); P.render.request(); });
    cv.addEventListener('pointerenter', () => { v.mouseIn = true; });

    cv.addEventListener('wheel', e => {
      e.preventDefault();
      if (!P.doc) return;
      const r = cv.getBoundingClientRect();
      if (e.shiftKey && !e.ctrlKey) { v.panX -= e.deltaY; P.render.request(); return; }
      v.zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });

    // Menu contestuale tasto destro sul canvas (Deseleziona, Trasforma, Taglia, Copia, Testo...)
    cv.addEventListener('contextmenu', e => {
      e.preventDefault();
      if (!P.doc) return;
      const pt = v.eventToDoc(e);
      P.ui.openContextMenu(e.clientX, e.clientY, pt);
    });
  },

  combo(e) {
    let k = e.key;
    if (e.code && e.code.startsWith('Key')) k = e.code.slice(3);
    else if (e.code && e.code.startsWith('Digit')) k = e.code.slice(5);
    else if (k.length === 1) k = k.toUpperCase();
    return (e.ctrlKey || e.metaKey ? 'Ctrl+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + k;
  },

  bindKeys() {
    window.addEventListener('keydown', e => {
      if (P.dialog.isOpen) return;
      const tag = e.target.tagName;
      const typing = (tag === 'INPUT' && !['range', 'checkbox', 'color'].includes(e.target.type)) || tag === 'TEXTAREA' || tag === 'SELECT';
      if (typing) { if (e.key === 'Escape' || e.key === 'Enter') e.target.blur(); return; }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!this.spaceDown) { this.spaceDown = true; if (!this.panning) P.view.setCursor('grab'); }
        return;
      }
      const tool = P.tools.current;
      if (e.key === 'Enter') {
        if (P.transform.active) { P.transform.commit(); e.preventDefault(); return; }
        if (tool && tool.id === 'crop' && tool.rect) { tool.apply(); e.preventDefault(); return; }
      }
      if (e.key === 'Escape') {
        P.ui.closeMenus && P.ui.closeMenus();
        if (P.transform.active) { P.transform.cancel(); return; }
        if (tool && tool.rect) { tool.cancel(); return; }
        if (tool && tool.cancel) tool.cancel();
        // Premendo Esc con una selezione attiva la deseleziona subito!
        if (P.sel.active) { P.sel.clear(); P.util.status('Deselezionato'); return; }
        return;
      }
      if (P.transform.active && e.key.startsWith('Arrow') && !e.ctrlKey) {
        const s = P.transform.s, n = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') s.cx -= n; if (e.key === 'ArrowRight') s.cx += n;
        if (e.key === 'ArrowUp') s.cy -= n; if (e.key === 'ArrowDown') s.cy += n;
        P.render.requestContent(); e.preventDefault(); return;
      }

      const combo = this.combo(e);
      // Scorciatoia strumento Testo 'T' seleziona lo strumento testo
      if (combo === 'T') {
        e.preventDefault();
        P.app.cancelPending();
        P.tools.select('text');
        return;
      }

      for (const [id, c] of Object.entries(P.commands)) {
        if (c.sc && c.sc.includes(combo)) { e.preventDefault(); P.run(id); return; }
      }
      if (e.ctrlKey || e.metaKey) return;

      // scorciatoie strumenti
      const toolKey = P.tools.list.find(t => !t.sep && t.key === combo);
      if (toolKey) { e.preventDefault(); P.app.cancelPending(); P.tools.select(toolKey.id); return; }
      if (combo === 'X') return P.run('swapColors');
      if (combo === 'D') return P.run('resetColors');
      if (e.key === '[' || e.key === ']') {
        const o = tool && tool.id === 'eraser' ? P.settings.eraser : P.settings.brush;
        const step = o.size < 10 ? 1 : o.size < 50 ? 5 : 10;
        o.size = P.util.clamp(o.size + (e.key === ']' ? step : -step), 1, 500);
        P.ui.updateOptions(); P.render.request();
      }
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'Space') {
        this.spaceDown = false;
        if (!this.panning) { const t = P.tools.current; P.view.setCursor(t ? t.cursor : 'default'); }
      }
    });
    window.addEventListener('blur', () => { this.spaceDown = false; });
  },

  bindDrop() {
    const vp = P.view.el;
    vp.addEventListener('dragover', e => { e.preventDefault(); vp.classList.add('drag-over'); });
    vp.addEventListener('dragleave', () => vp.classList.remove('drag-over'));
    vp.addEventListener('drop', async e => {
      e.preventDefault(); vp.classList.remove('drag-over');
      const f = e.dataTransfer.files[0]; if (!f) return;
      if (/\.p299$/i.test(f.name)) return P.cmd.loadProject(await f.text(), f.name);
      if (!f.type.startsWith('image/')) { P.util.toast('Formato non supportato'); return; }
      if (!P.doc) return P.cmd.openImageBlob(f, f.name);
      const img = await P.util.blobToImage(f);
      P.cmd.placeImage(img, f.name.replace(/\.[^.]+$/, ''));
    });
    document.addEventListener('paste', async e => {
      if (window.api || P.dialog.isOpen) return;
      const item = [...e.clipboardData.items].find(i => i.type.startsWith('image/'));
      if (!item) return;
      e.preventDefault();
      P.cmd.pasteImage(await P.util.blobToImage(item.getAsFile()));
    });
    window.addEventListener('beforeunload', () => { P.storage.save(); });
  }
};

window.addEventListener('DOMContentLoaded', () => P.app.init());
