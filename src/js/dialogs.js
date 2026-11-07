// Photo299 - finestre di dialogo
'use strict';

P.dialog = {
  open({ title, body, okLabel = 'OK', cancelLabel = 'Annulla', onOk, onCancel, wide }) {
    const root = document.getElementById('modal-root');
    const bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    bd.innerHTML = `<div class="modal" ${wide ? 'style="min-width:560px"' : ''}><div class="modal-head"></div><div class="modal-body"></div><div class="modal-foot"></div></div>`;
    bd.querySelector('.modal-head').textContent = title;
    const b = bd.querySelector('.modal-body');
    if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
    const foot = bd.querySelector('.modal-foot');
    const close = () => { bd.remove(); P.dialog.isOpen = root.children.length > 0; };
    if (cancelLabel) {
      const c = document.createElement('button'); c.className = 'btn'; c.textContent = cancelLabel;
      c.addEventListener('click', () => { close(); if (onCancel) onCancel(); });
      foot.appendChild(c);
    }
    const ok = document.createElement('button'); ok.className = 'btn primary'; ok.textContent = okLabel;
    ok.addEventListener('click', () => { if (onOk && onOk(b) === false) return; close(); });
    foot.appendChild(ok);
    bd.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') ok.click();
      if (e.key === 'Escape') { close(); if (onCancel) onCancel(); }
    });
    root.appendChild(bd);
    P.dialog.isOpen = true;
    setTimeout(() => { const f = b.querySelector('input,select'); (f || ok).focus(); if (f && f.select) f.select(); }, 0);
    return { root: b, close };
  },
  isOpen: false,

  confirm(title, text, okLabel = 'Continua') {
    return new Promise(res => this.open({ title, body: `<p style="margin:0;max-width:420px">${text}</p>`, okLabel, onOk: () => res(true), onCancel: () => res(false) }));
  },

  newDoc() {
    const presets = [['HD 1920×1080', 1920, 1080], ['4K 3840×2160', 3840, 2160], ['A4 300dpi', 2480, 3508], ['A4 150dpi', 1240, 1754],
      ['Instagram 1080×1080', 1080, 1080], ['Storia 1080×1920', 1080, 1920], ['Web 1280×720', 1280, 720], ['800×600', 800, 600]];
    const body = `
      <div class="field"><label>Nome</label><input id="nd-name" type="text" value="Senza titolo" style="flex:1"></div>
      <div class="field"><label>Larghezza</label><input id="nd-w" type="number" min="1" max="16000" value="1920"> px</div>
      <div class="field"><label>Altezza</label><input id="nd-h" type="number" min="1" max="16000" value="1080"> px</div>
      <div class="field"><label>Sfondo</label><select id="nd-bg"><option value="#ffffff">Bianco</option><option value="transparent">Trasparente</option><option value="fg">Colore primo piano</option><option value="bg">Colore di sfondo</option></select></div>
      <div><div class="muted" style="margin-bottom:6px">Predefiniti</div><div class="presets">${presets.map(p => `<button data-w="${p[1]}" data-h="${p[2]}">${p[0]}</button>`).join('')}</div></div>`;
    const dlg = this.open({
      title: 'Nuovo documento', body, okLabel: 'Crea',
      onOk: r => {
        const w = P.util.clamp(+r.querySelector('#nd-w').value | 0, 1, 16000), h = P.util.clamp(+r.querySelector('#nd-h').value | 0, 1, 16000);
        let bg = r.querySelector('#nd-bg').value;
        if (bg === 'fg') bg = P.colors.fg; if (bg === 'bg') bg = P.colors.bg;
        P.cmd.newDocument(w, h, bg, r.querySelector('#nd-name').value.trim() || 'Senza titolo');
      }
    });
    dlg.root.querySelectorAll('.presets button').forEach(b => b.addEventListener('click', () => {
      dlg.root.querySelector('#nd-w').value = b.dataset.w; dlg.root.querySelector('#nd-h').value = b.dataset.h;
    }));
  },

  imageSize() {
    const d = P.doc;
    const body = `
      <div class="field"><label>Larghezza</label><input id="is-w" type="number" min="1" max="16000" value="${d.width}"> px</div>
      <div class="field"><label>Altezza</label><input id="is-h" type="number" min="1" max="16000" value="${d.height}"> px</div>
      <div class="field"><label>Percentuale</label><input id="is-p" type="number" min="1" max="1000" value="100"> %</div>
      <label class="field"><input id="is-lock" type="checkbox" checked> Mantieni proporzioni</label>`;
    const dlg = this.open({
      title: 'Dimensione immagine', body,
      onOk: r => P.cmd.resizeImage(P.util.clamp(+r.querySelector('#is-w').value | 0, 1, 16000), P.util.clamp(+r.querySelector('#is-h').value | 0, 1, 16000))
    });
    const r = dlg.root, W = r.querySelector('#is-w'), H = r.querySelector('#is-h'), Pc = r.querySelector('#is-p'), L = r.querySelector('#is-lock');
    W.addEventListener('input', () => { if (L.checked) H.value = Math.max(1, Math.round(W.value * d.height / d.width)); Pc.value = Math.round(W.value / d.width * 100); });
    H.addEventListener('input', () => { if (L.checked) W.value = Math.max(1, Math.round(H.value * d.width / d.height)); });
    Pc.addEventListener('input', () => { W.value = Math.max(1, Math.round(d.width * Pc.value / 100)); H.value = Math.max(1, Math.round(d.height * Pc.value / 100)); });
  },

  canvasSize() {
    const d = P.doc;
    let anchor = [1, 1];
    const body = `
      <div class="field"><label>Larghezza</label><input id="cs-w" type="number" min="1" max="16000" value="${d.width}"> px</div>
      <div class="field"><label>Altezza</label><input id="cs-h" type="number" min="1" max="16000" value="${d.height}"> px</div>
      <div class="field"><span>Ancoraggio</span><div class="anchor-grid">${[0, 1, 2].map(y => [0, 1, 2].map(x => `<button data-x="${x}" data-y="${y}"></button>`).join('')).join('')}</div></div>
      <div class="field"><label>Estensione</label><select id="cs-fill"><option value="transparent">Trasparente</option><option value="bg">Colore di sfondo</option><option value="#ffffff">Bianco</option></select></div>`;
    const dlg = this.open({
      title: 'Dimensione quadro', body,
      onOk: r => {
        let fill = r.querySelector('#cs-fill').value; if (fill === 'bg') fill = P.colors.bg;
        P.cmd.resizeCanvas(P.util.clamp(+r.querySelector('#cs-w').value | 0, 1, 16000), P.util.clamp(+r.querySelector('#cs-h').value | 0, 1, 16000), anchor, fill);
      }
    });
    const btns = dlg.root.querySelectorAll('.anchor-grid button');
    const upd = () => btns.forEach(b => b.classList.toggle('on', +b.dataset.x === anchor[0] && +b.dataset.y === anchor[1]));
    btns.forEach(b => b.addEventListener('click', () => { anchor = [+b.dataset.x, +b.dataset.y]; upd(); }));
    upd();
  },

  exportImage() {
    const d = P.doc;
    const body = `
      <div class="field"><label>Formato</label><select id="ex-f"><option value="png">PNG (trasparenza)</option><option value="jpeg">JPEG</option><option value="webp">WebP</option></select></div>
      <div class="field" id="ex-q-row"><label>Qualità</label><input id="ex-q" type="range" min="10" max="100" value="92"><span id="ex-qv">92</span></div>
      <div class="field"><label>Scala</label><input id="ex-s" type="number" min="1" max="400" value="100"> % <span id="ex-dim" class="muted"></span></div>
      <div class="field" id="ex-bg-row"><label>Sfondo JPEG</label><input id="ex-bg" type="color" value="#ffffff"></div>`;
    const dlg = this.open({
      title: 'Esporta come', body, okLabel: 'Esporta…',
      onOk: r => { P.cmd.exportImage(r.querySelector('#ex-f').value, +r.querySelector('#ex-q').value / 100, +r.querySelector('#ex-s').value / 100, r.querySelector('#ex-bg').value); }
    });
    const r = dlg.root;
    const upd = () => {
      const f = r.querySelector('#ex-f').value, s = +r.querySelector('#ex-s').value / 100;
      r.querySelector('#ex-q-row').style.display = f === 'png' ? 'none' : '';
      r.querySelector('#ex-bg-row').style.display = f === 'jpeg' ? '' : 'none';
      r.querySelector('#ex-qv').textContent = r.querySelector('#ex-q').value;
      r.querySelector('#ex-dim').textContent = `${Math.max(1, Math.round(d.width * s))} × ${Math.max(1, Math.round(d.height * s))} px`;
    };
    r.querySelectorAll('input,select').forEach(i => i.addEventListener('input', upd));
    upd();
  },

  adjust() {
    const layer = P.Doc.active(); if (!layer) return;
    const vals = { brightness: 100, contrast: 100, saturate: 100, hue: 0, blur: 0 };
    const rows = [['brightness', 'Luminosità', 0, 200, '%'], ['contrast', 'Contrasto', 0, 200, '%'], ['saturate', 'Saturazione', 0, 300, '%'], ['hue', 'Tonalità', -180, 180, '°'], ['blur', 'Sfocatura', 0, 50, 'px']];
    const body = rows.map(([k, l, a, b, u]) => `<div class="field"><label>${l}</label><input data-k="${k}" type="range" min="${a}" max="${b}" value="${vals[k]}"><span style="width:50px" data-v="${k}">${vals[k]}${u}</span></div>`).join('');
    const filterStr = () => `brightness(${vals.brightness}%) contrast(${vals.contrast}%) saturate(${vals.saturate}%) hue-rotate(${vals.hue}deg) blur(${vals.blur}px)`;
    const build = () => P.cmd.filteredLayer(layer, filterStr());
    let preview = null;
    const refresh = P.util.debounce(() => { preview = build(); P.render.override = { layerId: layer.id, draw: ctx => ctx.drawImage(preview, 0, 0) }; P.render.requestContent(); }, 30);
    const dlg = this.open({
      title: 'Regolazioni', body, okLabel: 'Applica',
      onOk: () => { P.render.override = null; layer.canvas = build(); P.Doc.markDirty(layer); P.history.commit('Regolazioni'); },
      onCancel: () => { P.render.override = null; P.render.requestContent(); }
    });
    dlg.root.querySelectorAll('input[type=range]').forEach(inp => inp.addEventListener('input', () => {
      const k = inp.dataset.k; vals[k] = +inp.value;
      const u = rows.find(r => r[0] === k)[4];
      dlg.root.querySelector(`[data-v="${k}"]`).textContent = inp.value + u;
      refresh();
    }));
  },

  shortcuts() {
    const list = Object.values(P.commands).filter(c => c.sc).map(c => `<tr><td style="padding:3px 16px 3px 0">${c.label}</td><td class="muted">${c.sc.join(' / ')}</td></tr>`).join('');
    const tools = P.tools.list.filter(t => !t.sep).map(t => `<tr><td style="padding:3px 16px 3px 0">${t.name}</td><td class="muted">${t.key}</td></tr>`).join('');
    this.open({
      title: 'Scorciatoie da tastiera', wide: true, cancelLabel: null, okLabel: 'Chiudi',
      body: `<div style="display:flex;gap:30px;max-height:60vh;overflow:auto"><table>${list}</table><table>${tools}<tr><td style="padding:3px 16px 3px 0">Scambia colori</td><td class="muted">X</td></tr><tr><td>Colori predefiniti</td><td class="muted">D</td></tr><tr><td>Dimensione pennello</td><td class="muted">[ ]</td></tr><tr><td>Sposta vista</td><td class="muted">Spazio + trascina</td></tr><tr><td>Zoom</td><td class="muted">Rotella</td></tr></table></div>`
    });
  },

  about() {
    this.open({
      title: 'Informazioni su Photo299', cancelLabel: null, okLabel: 'Chiudi',
      body: `<div style="text-align:center"><div class="logo" style="width:56px;height:56px;font-size:30px;margin:0 auto 10px;border-radius:12px">P</div>
        <h3 style="margin:4px 0">Photo299 1.0.0</h3><p class="muted" style="margin:0">Editor di immagini leggero.<br>Il lavoro viene salvato automaticamente nella cache locale.</p></div>`
    });
  }
};
