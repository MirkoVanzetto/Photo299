// Photo299 - cronologia delle azioni (snapshot con condivisione dei bitmap invariati)
'use strict';

P.history = {
  entries: [],
  index: -1,
  max: 60,

  reset() { this.entries = []; this.index = -1; },

  freeze(layer) {
    if (layer.dirty || !layer.snap) {
      layer.snap = { key: P.util.uid(), canvas: P.util.cloneCanvas(layer.canvas) };
      layer.dirty = false;
    }
    return layer.snap;
  },

  // Registra lo stato corrente del documento come nuovo passo
  commit(label) {
    const d = P.doc; if (!d) return;
    P.Doc.ensureSelection();
    const entry = {
      label,
      time: Date.now(),
      width: d.width, height: d.height,
      activeId: d.activeId,
      selectedIds: [...(d.selectedIds || [d.activeId])],
      layers: d.layers.map(l => ({
        id: l.id,
        name: l.name,
        visible: l.visible,
        opacity: l.opacity,
        textData: l.textData ? { ...l.textData } : null,
        snap: this.freeze(l)
      }))
    };
    this.entries.length = this.index + 1;
    this.entries.push(entry);
    if (this.entries.length > this.max) this.entries.splice(0, this.entries.length - this.max);
    this.index = this.entries.length - 1;
    P.app.changed({ content: true });
  },

  restore(i) {
    const d = P.doc; const e = this.entries[i]; if (!d || !e) return;
    const old = new Map(d.layers.map(l => [l.id, l]));
    d.width = e.width; d.height = e.height;
    d.layers = e.layers.map(s => {
      let l = old.get(s.id);
      if (!l) l = { id: s.id, canvas: null, dirty: false, snap: null };
      if (l.snap !== s.snap || l.dirty || !l.canvas) {
        l.canvas = P.util.cloneCanvas(s.snap.canvas);
        l.snap = s.snap; l.dirty = false;
      }
      l.name = s.name;
      l.visible = s.visible;
      l.opacity = s.opacity;
      l.textData = s.textData ? { ...s.textData } : null;
      l.thumbDirty = true;
      return l;
    });
    d.activeId = e.activeId;
    d.selectedIds = e.selectedIds ? [...e.selectedIds] : [e.activeId];
    P.Doc.ensureSelection();
    this.index = i;
    P.sel.clear(true);
    P.app.changed({ content: true, sizeChanged: true });
  },

  canUndo() { return this.index > 0; },
  canRedo() { return this.index < this.entries.length - 1; },
  undo() { P.app.cancelPending(); if (this.canUndo()) { this.restore(this.index - 1); P.util.status('Annulla: ' + this.entries[this.index + 1].label); } },
  redo() { P.app.cancelPending(); if (this.canRedo()) { this.restore(this.index + 1); P.util.status('Ripeti: ' + this.entries[this.index].label); } },
  jump(i) { P.app.cancelPending(); if (i !== this.index) this.restore(i); }
};
