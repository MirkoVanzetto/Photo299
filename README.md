# Photo299 🎨

**Photo299** è un editor di immagini desktop leggero e performante in stile Photoshop, sviluppato con **Electron**, **HTML5 Canvas** e **JavaScript moderno**.

Progettato per offrire un flusso di lavoro rapido e privo di distrazioni con tutte le funzioni essenziali di fotoritocco, gestione a livelli, trasformazione libera e salvataggio automatico locale anti-perdita.

---

## ✨ Funzionalità Principali

### 📄 Documento e Dimensioni
- **Nuovo documento**: impostazione libera di larghezza e altezza con preset rapidi (HD 1080p, 4K, A4 300dpi / 150dpi, Instagram Post, Instagram Story, Web 720p). Sfondo personalizzabile (Bianco, Trasparente, Colore di primo piano o Sfondo).
- **Dimensione Immagine (Ctrl+Alt+I)**: ricampionamento bicubico con mantenimento delle proporzioni o in percentuale.
- **Dimensione Quadro (Ctrl+Alt+C)**: estensione o riduzione dell'area di lavoro con ancoraggio direzionale su griglia 3×3 e colore di riempimento.
- **Taglierina / Crop (C)**: ritaglio visivo interattivo con griglia a terzi e conferma con Invio.
- **Rifila (Trim)**: eliminazione automatica dei bordi trasparenti eccedenti.
- **Rotazione e Riflessione**: rotazione 90° CW/CCW, 180°, specchiamento orizzontale e verticale dell'intero documento o del singolo livello.

### 🖼️ Inserisci Foto e Trasformazione Libera ("Ctrl+T")
- **Inserimento Immagine**: tramite menu (*File → Inserisci immagine...* / `Ctrl+Shift+O`), **Drag & Drop** diretto dei file sulla finestra o **Incolla da appunti di sistema** (`Ctrl+V`).
- **Trasformazione Libera (Ctrl+T)**:
  - 8 maniglie per ridimensionare il livello o la selezione.
  - Ridimensionamento proporzionale predefinito (tieni premuto `Maiusc` per scalatura libera).
  - Rotazione libera trascinando all'esterno del riquadro di selezione (scatti a 15° con `Maiusc`).
  - Spostamento con mouse o di precisione con i tasti freccia (1px, o 10px con `Maiusc`).
  - Barra opzioni con controlli numerici (L %, A %, Angolo °) e pulsanti per riflettere e ruotare.
  - Conferma con `Invio` o annulla con `Esc` senza alcuna perdita di qualità durante l'anteprima.

### 🖌️ Pennelli, Gomme e Strumenti di Disegno
- **Pennello (B)**: tratto fluido con calcolo della pressione per tavolette grafiche, durezza regolabile (0-100%), dimensione (1-500px, regolabile rapidamente con i tasti `[` e `]`) e opacità.
- **Linee rette**: tieni premuto `Maiusc` e clicca per tracciare una linea retta perfetta dal punto precedente.
- **Gomma (E)**: cancellazione precisa con regolazione del raggio, durezza e opacità.
- **Gomma Magica (Shift+E)**: cancellazione istantanea del colore campionato con soglia di tolleranza regolabile (0-255) e modalità contigua / globale.
- **Secchiello (G)**: riempimento con colore di primo piano basato su tolleranza.
- **Contagocce (I)**: campionamento del colore dallo schermo (clic per colore di primo piano, `Alt+clic` per colore di sfondo).

### 🎨 Gestione Colori
- Palette a 24 colori rapidi.
- Doppio selettore Primario / Secondario.
- Tasto rapido `X` per scambiare primo piano e sfondo.
- Tasto rapido `D` per ripristinare i colori predefiniti (nero e bianco).
- Input codice esadecimale HEX e Color Picker del sistema operativo.

### ✂️ Selezione e Taglia
- **Strumenti di selezione**: Rettangolare (`M`), Ellittica (`Shift+M`), Lazo a mano libera (`L`), Bacchetta Magica (`W`).
- **Modalità di selezione**: Nuova, Aggiungi (`Maiusc`), Sottrai (`Alt`), Interseca (`Maiusc+Alt`).
- Contorno animato con effetto *"formiche in marcia"* (marching ants).
- **Taglia (`Ctrl+X`)**, **Copia (`Ctrl+C`)**, **Copia unito (`Ctrl+Shift+C`)**, **Incolla (`Ctrl+V`)**, **Cancella (`Del` / `Backspace`)**.
- **Riempi selezione**: `Alt+Backspace` (colore primo piano), `Ctrl+Backspace` (colore di sfondo).
- **Deseleziona (`Ctrl+D`)**, **Seleziona tutto (`Ctrl+A`)**, **Inverti selezione (`Ctrl+Shift+I`)**.

### 🥞 Livelli (Layers)
- Multi-livello senza limiti.
- Riordino su e giù (`Ctrl+]` / `Ctrl+[`).
- Duplica livello (`Ctrl+J`) e Nuovo livello (`Ctrl+Shift+N`).
- Unisci con il livello sottostante (`Ctrl+E`) o unisci tutti i livelli (`Ctrl+Shift+E`).
- Controllo opacità da 0% a 100% per singolo livello.
- Visibilità livello (icona occhio 👁).
- Rinomina rapida del livello con doppio clic sul nome.
- Miniature generate in tempo reale.

### 🎛️ Filtri e Regolazioni
- **Regolazioni (Ctrl+U)** con anteprima in tempo reale:
  - Luminosità
  - Contrasto
  - Saturazione
  - Tonalità (Hue)
  - Sfocatura (Blur)
- **Inverti Colori (`Ctrl+I`)**.
- **Bianco e Nero / Grayscale (`Ctrl+Shift+U`)**.

### ⏱️ Cronologia e Cache Locale Anti-Perdita
- **Cronologia Visiva**: pannello con tutti i passaggi eseguiti; clicca su qualsiasi punto per viaggiare nel tempo.
- **Annulla (`Ctrl+Z`)** e **Ripeti (`Ctrl+Y` o `Ctrl+Shift+Z`)**.
- **Cache Locale IndexedDB**: ogni operazione viene salvata in modo asincrono in locale con deduplicazione dei layer immutati.
- **Ripristino Sessione Automatico**: se chiudi l'applicazione o si riavvia il computer, alla riapertura Photo299 ripristina istantaneamente l'intero documento con tutti i suoi livelli e l'intera cronologia.
- **Formato Progetto `.p299`**: salva e riapri progetti nativi completi in formato multipiattaforma.

### 💾 Esportazione
- **Esporta come (`Ctrl+Shift+S`)**:
  - **PNG** (mantiene trasparenza e canale alfa).
  - **JPEG** (qualità personalizzabile da 10% a 100% e colore di sfondo personalizzato).
  - **WebP** (ottimizzato per il web).
  - Riscalatura dell'esportazione (es. 25%, 50%, 100%, 200%).
- **Esportazione Rapida PNG (`Ctrl+Shift+Alt+S`)**: salvataggio al 100% in un clic.

---

## ⌨️ Tabella Scorciatoie Principali

| Azione | Scorciatoia |
|---|---|
| **Nuovo documento** | `Ctrl + N` |
| **Apri file / progetto** | `Ctrl + O` |
| **Inserisci immagine** | `Ctrl + Shift + O` |
| **Salva progetto** | `Ctrl + S` |
| **Salva con nome** | `Ctrl + Alt + S` |
| **Esporta come** | `Ctrl + Shift + S` |
| **Esportazione rapida PNG** | `Ctrl + Shift + Alt + S` |
| **Annulla** | `Ctrl + Z` |
| **Ripeti** | `Ctrl + Y` / `Ctrl + Shift + Z` |
| **Taglia** | `Ctrl + X` |
| **Copia** | `Ctrl + C` |
| **Incolla** | `Ctrl + V` |
| **Trasformazione Libera** | `Ctrl + T` |
| **Seleziona tutto** | `Ctrl + A` |
| **Deseleziona** | `Ctrl + D` |
| **Inverti selezione** | `Ctrl + Shift + I` |
| **Nuovo livello** | `Ctrl + Shift + N` |
| **Duplica livello** | `Ctrl + J` |
| **Unisci sotto** | `Ctrl + E` |
| **Regolazioni colore/luce** | `Ctrl + U` |
| **Inverti colori** | `Ctrl + I` |
| **Bianco e nero** | `Ctrl + Shift + U` |
| **Zoom avanti / indietro** | `Ctrl + +` / `Ctrl + -` (o rotella mouse) |
| **Adatta allo schermo** | `Ctrl + 0` |
| **Pixel reali (100%)** | `Ctrl + 1` |
| **Sposta vista** | `Spazio + trascina` |
| **Scambia colori / Predefiniti** | `X` / `D` |
| **Dimensione pennello** | `[` / `]` |

---

## 📦 Download Eseguibili per Windows

I file eseguibili per Windows x64 sono disponibili nella sezione [Releases](https://github.com/MirkoVanzetto/Photo299/releases):

1. **`Photo299-Setup-1.0.0.exe`**: programma di installazione standard guidato (NSIS) con creazione collegamenti sul desktop e menu Start, associazione file `.p299`.
2. **`Photo299-Portable-1.0.0.exe`**: versione portabile "zero install" pronta all'uso senza privilegi amministrativi (ideale per chiavette USB).

---

## 🛠️ Sviluppo e Compilazione dai Sorgenti

### Prerequisiti
- [Node.js](https://nodejs.org/) (versione 18 o superiore raccomandata)
- npm

### Installazione
```bash
git clone https://github.com/MirkoVanzetto/Photo299.git
cd Photo299
npm install
```

### Avvio in modalità sviluppo
```bash
npm start
```

### Compilazione eseguibili Windows
```bash
# Compila sia l'installer NSIS che il portable
npm run dist

# Solo Portable
npm run dist:portable

# Solo Installer
npm run dist:installer
```

Gli eseguibili generati saranno posizionati nella cartella `dist/`.

---

## 📄 Licenza
Rilasciato sotto licenza MIT.
