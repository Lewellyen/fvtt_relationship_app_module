# Bundle Size Analysis

**Status:** ⚠️ TODO  
**Priorität:** 🥉 Niedrige Priorität  
**Aufwand:** 1-2 Stunden  
**Tool:** vite-bundle-visualizer (neu installieren)

---

## Übersicht

Bundle Size Analysis prüft die Größe des kompilierten Bundles. Sie hilft, Bundle-Bloat zu verhindern und Performance zu optimieren.

**Warum wichtig:**
- Schnellere Ladezeiten in Foundry
- Geringerer Speicherverbrauch
- Bessere User Experience
- Verhindert Bundle-Bloat

---

## Was wird getestet?

### 1. Bundle-Größe

**Szenario:** Kompiliertes Bundle analysieren

**Schritte:**
1. Bundle bauen
2. Größe messen
3. Schwellenwerte prüfen

**Erwartetes Ergebnis:**
- Bundle-Größe < 500KB (ungzip)
- Gzip-Größe < 150KB

---

### 2. Tree-Shaking-Effektivität

**Szenario:** Unused Code wird entfernt

**Schritte:**
1. Bundle analysieren
2. Prüfen ob unused Code entfernt wurde

**Erwartetes Ergebnis:**
- Unused Code wird entfernt
- Tree-Shaking funktioniert

---

### 3. Dependency-Analyse

**Szenario:** Welche Dependencies tragen zur Größe bei?

**Schritte:**
1. Bundle visualisieren
2. Größte Dependencies identifizieren

**Erwartetes Ergebnis:**
- Größte Dependencies bekannt
- Optimierungsmöglichkeiten identifiziert

---

## Warum wichtig?

- ✅ Schnellere Ladezeiten
- ✅ Geringerer Speicherverbrauch
- ✅ Bessere User Experience
- ✅ Verhindert Bundle-Bloat

---

## Implementierungsanleitung

### Voraussetzungen

**Installation:**
```bash
npm install --save-dev vite-bundle-visualizer
```

**Tools:**
- ✅ vite-bundle-visualizer (neu installieren)
- ✅ Vite (bereits vorhanden)

---

### Pattern 1: Bundle Visualizer

```typescript
// vite.config.ts
import { visualizer } from 'vite-bundle-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

---

### Pattern 2: Bundle Size Check

```bash
# Bundle bauen
npm run build

# Bundle-Größe prüfen
ls -lh dist/*.js
```

---

## Detaillierte Implementierung

### Schritt 1: vite-bundle-visualizer installieren

```bash
npm install --save-dev vite-bundle-visualizer
```

---

### Schritt 2: Vite-Konfiguration anpassen

**Datei:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import { visualizer } from 'vite-bundle-visualizer';

export default defineConfig({
  plugins: [
    // ... andere Plugins
    visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // oder 'sunburst', 'network'
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Optional: Manuelle Chunks für bessere Tree-Shaking
        },
      },
    },
  },
});
```

---

### Schritt 3: NPM-Script hinzufügen

**`package.json`:**

```json
{
  "scripts": {
    "build:analyze": "vite build",
    "build:stats": "vite build --mode production && open dist/stats.html"
  }
}
```

---

### Schritt 4: Bundle analysieren

```bash
# Bundle bauen und analysieren
npm run build:analyze

# Stats-Report öffnen
open dist/stats.html
```

---

### Schritt 5: Bundle Size Limits (Optional)

**Alternative:** `bundlesize` für automatische Checks

```bash
npm install --save-dev bundlesize
```

**`package.json`:**

```json
{
  "bundlesize": [
    {
      "path": "./dist/index.js",
      "maxSize": "500kb"
    },
    {
      "path": "./dist/index.js.gz",
      "maxSize": "150kb"
    }
  ]
}
```

**NPM-Script:**

```json
{
  "scripts": {
    "test:size": "bundlesize"
  }
}
```

---

## Was wird analysiert?

**Bundle-Stats zeigen:**
- Gesamtgröße des Bundles
- Größe pro Dependency
- Gzip/Brotli-Kompression
- Tree-Shaking-Effektivität
- Chunk-Aufteilung

---

## Referenzen

**vite-bundle-visualizer:**
- [vite-bundle-visualizer GitHub](https://github.com/naver/vite-bundle-visualizer)

**bundlesize:**
- [bundlesize GitHub](https://github.com/siddharthkp/bundlesize)

---

## Checkliste

### Vorbereitung
- [ ] vite-bundle-visualizer installiert
- [ ] Vite-Konfiguration angepasst
- [ ] NPM-Script hinzugefügt

### Implementierung
- [ ] Bundle analysieren
- [ ] Bundle-Größe prüfen
- [ ] Tree-Shaking-Effektivität prüfen
- [ ] Dependency-Analyse durchführen

### Validierung
- [ ] Bundle-Größe < Schwellenwerte
- [ ] Tree-Shaking funktioniert
- [ ] Optimierungsmöglichkeiten identifiziert

---

**Fertig:** Alle Test-TODOs sind implementiert!

