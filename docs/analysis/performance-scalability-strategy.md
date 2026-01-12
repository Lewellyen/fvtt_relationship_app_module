# Tiefenanalyse: Performance- & Skalierungs-Strategie - Strategische Entscheidungen

**Status:** Diskussionsdokument
**Datum:** 2026-01-11
**Kontext:** Langfristige Projektausrichtung - Entscheidungen mit langfristigen Konsequenzen

---

## Einleitung

Diese Analyse untersucht tiefgreifend die Performance- und Skalierungs-Strategie für das Relationship Graph Modul. Während Caching bereits implementiert ist, fehlt noch eine umfassende Strategie für große Graphen, Memory-Management und Performance-Optimierungen.

**Wichtige Überlegung:** Performance und Skalierbarkeit prägen die User-Experience, besonders bei großen Graphen. Entscheidungen hier haben Konsequenzen für UX, Wartbarkeit und zukünftige Features.

---

## Aktuelle Situation

### Was ist bereits implementiert/entschieden?

**Caching:**
- ✅ Cache-System vorhanden
- ✅ Cache-Invalidation implementiert
- ✅ LRU Eviction Strategy

**Observability:**
- ✅ Metrics-System vorhanden
- ✅ Performance-Tracking

**Code-Referenzen:**
- `src/infrastructure/cache/` - Cache-System
- `src/infrastructure/observability/` - Observability

### Was funktioniert gut/schlecht?

**Gut:**
- ✅ Caching-System vorhanden
- ✅ Observability für Performance-Tracking

**Schlecht:**
- ⚠️ Keine Strategie für große Graphen
- ⚠️ Keine Cytoscape-Optimierungen (WebGL, LOD)
- ⚠️ Keine Memory-Management-Strategie
- ⚠️ Keine Performance-Optimierungen für Cytoscape definiert

**Klarstellung:**
- Cytoscape nutzt kein klassisches Virtualisierung-Pattern (wie in Listen/Tabellen)
- Stattdessen: Level-of-Detail (LOD), WebGL-Rendering, Filtering/Clustering

---

## Optionen & Alternativen

### Ansatz 1: Cytoscape-Optimierungen (WebGL + LOD + Filtering)

#### Vollständige Beschreibung

**Prinzip:** Cytoscape-native Optimierungen statt klassischer Virtualisierung:
- **Canvas-Rendering**: Cytoscape.js nutzt standardmäßig HTML5 Canvas (ausreichend performant)
- ⚠️ **WebGL-Rendering**: Cytoscape.js 3.31.0+ hat EXPERIMENTAL WebGL-Renderer (KEIN zusätzliches npm-Paket nötig!)
- **Level-of-Detail (LOD)**: Automatische Detail-Reduktion (z.B. Labels nur bei < 200 Nodes)
- **Filtering/Clustering**: Anzeige nur relevanter Subsets für sehr große Graphen

**Implementation-Details:**

```typescript
// Cytoscape.js 3.31.0+ hat EXPERIMENTAL WebGL-Renderer (seit Januar 2025)
// Wir nutzen Cytoscape 3.33.1 → WebGL ist verfügbar (aber experimentell)
// KEIN zusätzliches npm-Paket nötig - WebGL ist in Cytoscape.js enthalten

// Standard: Canvas-Renderer (ausreichend für die meisten Fälle)
const cy = cytoscape({
  container: element,
  // renderer wird weggelassen → Canvas (Standard)
  // ...
});

// Optional: Experimental WebGL-Renderer (in Cytoscape 3.31.0+ enthalten)
// KEIN zusätzliches npm-Paket nötig!
const cy = cytoscape({
  container: element,
  renderer: { name: 'webgl' }, // Experimental, aber in Cytoscape enthalten
  // ...
});

// LOD-Settings (automatisch oder konfigurierbar)
cy.on('viewport', () => {
  // Cytoscape passt automatisch LOD an
  // Labels werden nur bei < 200 Nodes angezeigt
});

// Filtering für sehr große Graphen
function filterGraph(graph: GraphModel, filter: Filter) {
  const filteredNodes = filterNodes(graph.nodes, filter);
  cy.elements().remove();
  cy.add(filteredNodes);
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Performance:** Canvas-Rendering ist bereits performant
- ✅ **Keine Dependencies:** Beide Renderer (Canvas + WebGL) sind bereits in Cytoscape.js enthalten
- ✅ **WebGL verfügbar:** Cytoscape 3.31.0+ hat EXPERIMENTAL WebGL-Renderer (KEIN npm-Paket nötig)
- ✅ **Skalierbarkeit:** LOD passt automatisch an
- ✅ **Memory:** Filtering reduziert Memory-Verbrauch
- ✅ **Native:** Nutzt Cytoscape-eigene Optimierungen

**Nachteile:**
- ⚠️ **WebGL experimental:** WebGL-Renderer ist noch experimentell (seit Cytoscape 3.31.0, Jan 2025)
- ⚠️ **Feature-Limitierungen:** Experimental WebGL unterstützt möglicherweise nicht alle Visual Styles
- ❌ **Komplexität:** Filtering-Logik muss implementiert werden
- ❌ **UX:** LOD kann bei großen Graphen Details verbergen

---

### Ansatz 2: Graph-Level Caching + Precomputation

#### Vollständige Beschreibung

**Prinzip:** Graphen werden gecacht, Layout wird precomputed, nur Updates werden neu berechnet.

**Implementation-Details:**

```typescript
// Graph-Caching
const graphCache = new Cache<GraphModel>();

// Precomputed Layout
const layoutCache = new Cache<Layout>();

// Nur Updates neu berechnen
function updateGraph(graph: GraphModel, changes: Change[]) {
  const cached = graphCache.get(graph.id);
  const updated = applyChanges(cached, changes);
  graphCache.set(graph.id, updated);
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Performance:** Precomputation reduziert Latenz
- ✅ **Caching:** Bereits berechnete Layouts wiederverwenden
- ✅ **Einfach:** Weniger komplex als Virtualisierung

**Nachteile:**
- ❌ **Memory:** Cache verbraucht Memory
- ❌ **Initialisierung:** Precomputation kann langsam sein
- ❌ **Updates:** Cache-Invalidation bei Updates

---

### Ansatz 3: Hybrid (Caching + Selective Virtualisierung)

#### Vollständige Trade-offs

**Prinzip:** Kombination aus Caching und Virtualisierung, optimiert für verschiedene Szenarien.

**Vorteile:**
- ✅ Best of both worlds
- ✅ Flexibel für verschiedene Größen

**Nachteile:**
- ❌ Komplexer
- ❌ Mehr Code zu warten

---

## Memory-Management Strategie

### Option A: Aggressive Cleanup

**Prinzip:** Unbenutzte Ressourcen werden sofort freigegeben.

**Vorteile:**
- Geringerer Memory-Verbrauch
- Gute für kleine Systeme

**Nachteile:**
- Mehr Recomputations
- Mögliche Performance-Einbußen

### Option B: Conservative Caching

**Prinzip:** Ressourcen werden länger gecacht, auch wenn nicht aktiv verwendet.

**Vorteile:**
- Bessere Performance
- Weniger Recomputations

**Nachteile:**
- Höherer Memory-Verbrauch
- Mögliche Memory-Leaks

### Option C: Adaptive (LRU-basiert)

**Prinzip:** Cache mit LRU-Eviction, automatische Cleanup basierend auf Nutzung.

**Vorteile:**
- Balance zwischen Performance und Memory
- Automatische Optimierung

**Nachteile:**
- Komplexer als einfaches Caching

---

## Offene Fragen & Entscheidungspunkte

### 1. Cytoscape-Optimierungen

**Frage:** Welche Cytoscape-Optimierungen sollen implementiert werden?

**✅ Entscheidung: Canvas + LOD + Filtering (optional)**

**Strategie:**
- **Canvas-Renderer:** Standard nutzen (empfohlen für MVP)
- **LOD:** Automatisch von Cytoscape (Level-of-Detail Optimierungen)
- **Filtering/Clustering:** Optional für sehr große Graphen (> 1000 Nodes)
- **WebGL:** Experimental verfügbar (Cytoscape 3.31.0+), wird später evaluiert wenn Performance-Probleme auftreten

**Begründung:**
- Canvas-Renderer ist Standard und ausreichend performant für die meisten Fälle
- LOD funktioniert automatisch mit Canvas-Renderer
- Filtering/Clustering nur wenn nötig (progressive enhancement)
- WebGL kann später evaluiert werden (kein zusätzliches npm-Paket nötig)

---

### 2. Memory-Management

**Frage:** Wie aggressiv soll Memory-Management sein?

**✅ Entscheidung: Adaptive (LRU-basiert)**

**Strategie:**
- **Adaptive Memory-Management:** LRU-basiert (bereits vorhanden)
- **Automatische Cleanup:** Basierend auf Nutzung
- **Balance:** Zwischen Performance und Memory-Verbrauch

**Begründung:**
- Bereits vorhanden und implementiert
- Automatische Optimierung basierend auf Nutzung
- Balance zwischen Performance (Caching) und Memory (Cleanup)
- Bewährtes Pattern (LRU Cache)

---

### 3. Performance-Ziele

**Frage:** Was sind die Performance-Ziele?

**✅ Entscheidung: Realistische Performance-Ziele (basierend auf Cytoscape.js Benchmarks)**

**Performance-Ziele:**

1. **Initial Load-Zeit** (Zeit bis Graph gerendert ist):
   - Graphen bis 100 Nodes: < 200ms
   - Graphen bis 500 Nodes: < 500ms
   - Graphen bis 1000 Nodes: < 1000ms (1 Sekunde)
   - Graphen > 1000 Nodes: Filtering/Clustering empfohlen (nur Teilgraph laden)

2. **Interaktivitäts-FPS** (FPS während Pan/Zoom/Drag, Canvas-Renderer Standard):
   - Graphen bis 100 Nodes: ≥ 60 FPS (flüssig)
   - Graphen bis 500 Nodes: ≥ 30 FPS (akzeptabel)
   - Graphen bis 1000 Nodes: ≥ 20 FPS (verwendbar, mit LOD-Optimierungen)
   - Graphen > 1000 Nodes: Filtering/Clustering erforderlich für akzeptable Performance

3. **Optional: WebGL-Renderer** (experimental, Cytoscape 3.31.0+):
   - Kann Performance für große Graphen deutlich verbessern (z.B. 20 FPS → 100+ FPS bei ~1200 Nodes)
   - Wird später evaluiert, wenn Performance-Probleme auftreten

4. **Memory-Verbrauch:**
   - Adaptive LRU-Cache mit angemessener Größe (bereits vorhanden)
   - Große Graphen (> 1000 Nodes) sollten gefiltert/clustered werden, um Memory-Verbrauch zu reduzieren

**Begründung:**
- Basierend auf Cytoscape.js Benchmarks (Canvas: ~20 FPS bei 1,200 Nodes/16,000 Edges)
- Realistisch für Foundry VTT Umgebung (verschiedene Hardware-Konfigurationen)
- Progressive Enhancement: Filtering/Clustering für sehr große Graphen
- Canvas-Renderer ist Standard (empfohlen für MVP), WebGL optional

---

## Empfehlung & Begründung

### Empfehlung: Hybrid (Caching + Cytoscape-Optimierungen) + Adaptive Memory-Management

**Komponenten:**
1. **Caching:** Graph-Level Caching mit LRU-Eviction (bereits vorhanden)
2. **Cytoscape-Optimierungen:**
   - Canvas-Renderer nutzen (Standard, empfohlen für MVP)
   - Optional: Experimental WebGL-Renderer (Cytoscape 3.31.0+, KEIN zusätzliches npm-Paket nötig)
   - LOD-Settings anpassen (automatisch von Cytoscape)
   - Optional Filtering/Clustering für sehr große Graphen (> 1000 Nodes)
3. **Memory-Management:** Adaptive (LRU-basiert, bereits vorhanden)
4. **Precomputation:** Layout-Precomputation für häufig verwendete Graphen

**Performance-Ziele (✅ definiert):**
- **Initial Load:** < 200ms (≤100 Nodes), < 500ms (≤500 Nodes), < 1000ms (≤1000 Nodes)
- **Interaktivitäts-FPS:** ≥60 FPS (≤100 Nodes), ≥30 FPS (≤500 Nodes), ≥20 FPS (≤1000 Nodes, mit LOD)
- **Große Graphen (>1000 Nodes):** Filtering/Clustering empfohlen/erforderlich

**Begründung:**

**Für MVP:**
- ✅ Caching ist bereits vorhanden und ausreichend
- ✅ Canvas-Renderer ist Standard in Cytoscape.js (kein zusätzliches npm-Paket nötig)
- ✅ LOD funktioniert automatisch mit Canvas-Renderer
- ✅ Adaptive Memory-Management balanciert Performance und Memory

**Für Langzeit:**
- ✅ Skalierbar für große Graphen (Canvas/WebGL + LOD + Filtering)
- ✅ Performance-optimiert (Caching + Rendering + Precomputation)
- ✅ Memory-effizient (Adaptive Management + Filtering)

**Risiken:**
- ✅ **Kein zusätzliches npm-Paket:** Beide Renderer (Canvas + WebGL experimental) sind bereits in Cytoscape.js enthalten
- ⚠️ **WebGL experimental:** WebGL-Renderer ist experimentell (seit Cytoscape 3.31.0, Jan 2025)
- ⚠️ **Feature-Limitierungen:** Experimental WebGL unterstützt möglicherweise nicht alle Visual Styles
- ⚠️ Canvas-Rendering ist für die meisten Fälle ausreichend performant
- ⚠️ Filtering-Logik kann komplex sein
- ⚠️ Precomputation kann initial langsam sein
- ⚠️ Cache-Invalidation kann komplex werden

**Mitigation:**
- **Rendering:** ✅ Canvas-Renderer ist Standard (empfohlen für MVP)
- **Optional WebGL:** Experimental WebGL-Renderer verfügbar (Cytoscape 3.31.0+, kein npm-Paket nötig)
- **Performance:** Canvas-Rendering ist für die meisten Anwendungsfälle ausreichend
- **WebGL später:** Experimental WebGL kann später evaluiert werden, wenn Performance-Probleme auftreten
- **Progressive Enhancement:** Filtering nur wenn nötig (> 1000 Nodes)
- **Background Precomputation:** Precomputation im Hintergrund
- **Cache-Strategien:** Klare Invalidation-Strategien

**Abweichungskriterien:**
- Wenn Caching + WebGL + LOD ausreicht → Filtering nicht nötig
- Wenn Performance-Probleme → Filtering früher evaluieren

---

## Nächste Schritte

1. ✅ **Performance-Ziele:** Ziele definiert (siehe Abschnitt "Performance-Ziele")
2. **Performance-Benchmarks:** Aktuelle Performance messen und mit Zielen vergleichen
3. **Filtering/Clustering:** Implementierung für große Graphen (> 1000 Nodes)
4. **Precomputation:** Layout-Precomputation evaluieren
5. **Memory-Profiling:** Memory-Usage analysieren
6. **Optional: WebGL-Evaluation:** Experimental WebGL-Renderer testen, wenn Performance-Probleme auftreten

---

## Referenzen

- `src/infrastructure/cache/` - Cache-System
- `src/infrastructure/observability/` - Observability
- Cytoscape Performance-Dokumentation (externe Recherche nötig)
