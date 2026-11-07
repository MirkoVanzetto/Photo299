// Photo299 - cache locale (IndexedDB): salva documento + cronologia per non perdere il lavoro
'use strict';

P.storage = {
  db: null,
  savedKeys: new Set(),
  saving: false,
  pending: false,

  open() {
    return new Promise((res, rej) => {
      const req = indexedDB.open('photo299', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('bitmaps')) db.createObjectStore('bitmaps');
        if (!db.objectStoreNames.contains('session')) db.createObjectStore('session');
      };
      req.onsuccess = () => { this.db = req.result; res(); };
      req.onerror = () => rej(req.error);
    });
  },

  tx(stores, mode = 'readonly') { return this.db.transaction(stores, mode); },
  req(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },

  setIndicator(state) {
    const el = document.getElementById('autosave-indicator');
    el.className = state;
    el.textContent = state === 'saving' ? '● Salvataggio in cache…' : state === 'saved' ? '● Salvato in cache' : '● Cache';
  },

  async save() {
    if (!this.db) return;
    if (this.saving) { this.pending = true; return; }
    this.saving = true; this.setIndicator('saving');
    try {
      const h = P.history; const d = P.doc;
      if (!d || h.index < 0) { await this.clear(); return; }
      // 1. salva i bitmap nuovi
      const referenced = new Map();
      for (const e of h.entries) for (const l of e.layers) referenced.set(l.snap.key, l.snap);
      for (const [key, snap] of referenced) {
        if (this.savedKeys.has(key)) continue;
        const blob = await P.util.canvasToBlob(snap.canvas, 'image/png');
        await this.req(this.tx(['bitmaps'], 'readwrite').objectStore('bitmaps').put(blob, key));
        this.savedKeys.add(key);
      }
      // 2. salva i metadati di sessione
      const meta = {
        version: 1,
        doc: { id: d.id, name: d.name, filePath: d.filePath },
        index: h.index,
        entries: h.entries.map(e => ({
          label: e.label, time: e.time, width: e.width, height: e.height, activeId: e.activeId,
          layers: e.layers.map(l => ({ id: l.id, name: l.name, visible: l.visible, opacity: l.opacity, key: l.snap.key }))
        }))
      };
      await this.req(this.tx(['session'], 'readwrite').objectStore('session').put(meta, 'current'));
      // 3. rimuove i bitmap non più usati
      const store = this.tx(['bitmaps'], 'readwrite').objectStore('bitmaps');
      const keys = await this.req(store.getAllKeys());
      const del = keys.filter(k => !referenced.has(k));
      if (del.length) {
        const s2 = this.tx(['bitmaps'], 'readwrite').objectStore('bitmaps');
        for (const k of del) { s2.delete(k); this.savedKeys.delete(k); }
      }
    } catch (err) {
      console.error('Autosave fallito', err);
      this.setIndicator('');
    } finally {
      this.saving = false;
      if (this.pending) { this.pending = false; this.save(); }
      else this.setIndicator('saved');
    }
  },

  async clear() {
    if (!this.db) return;
    const t = this.tx(['bitmaps', 'session'], 'readwrite');
    t.objectStore('bitmaps').clear(); t.objectStore('session').clear();
    this.savedKeys.clear();
  },

  // Ripristina la sessione salvata. Restituisce true se ripristinata.
  async load() {
    if (!this.db) return false;
    const meta = await this.req(this.tx(['session']).objectStore('session').get('current'));
    if (!meta || !meta.entries || !meta.entries.length) return false;
    const snaps = new Map();
    const store = () => this.tx(['bitmaps']).objectStore('bitmaps');
    for (const e of meta.entries) for (const l of e.layers) {
      if (snaps.has(l.key)) continue;
      const blob = await this.req(store().get(l.key));
      if (!blob) return false;
      const img = await P.util.blobToImage(blob);
      const c = P.util.makeCanvas(img.width, img.height);
      c.getContext('2d').drawImage(img, 0, 0);
      snaps.set(l.key, { key: l.key, canvas: c });
      this.savedKeys.add(l.key);
    }
    const entries = meta.entries.map(e => ({
      label: e.label, time: e.time, width: e.width, height: e.height, activeId: e.activeId,
      layers: e.layers.map(l => ({ id: l.id, name: l.name, visible: l.visible, opacity: l.opacity, snap: snaps.get(l.key) }))
    }));
    const cur = entries[meta.index];
    P.doc = { id: meta.doc.id, name: meta.doc.name, filePath: meta.doc.filePath || null, width: cur.width, height: cur.height, layers: [], activeId: cur.activeId };
    P.history.entries = entries;
    P.history.restore(meta.index);
    return true;
  }
};

P.autosave = P.util.debounce(() => P.storage.save(), 800);
