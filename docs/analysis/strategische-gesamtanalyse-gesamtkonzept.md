# Strategische Gesamtanalyse - Gesamtkonzept

**Status:** Zusammenfassungsdokument
**Datum:** 2026-01-11
**Kontext:** Langfristige Projektausrichtung - Konsolidierung aller strategischen Analysen

---

## Einleitung

Dieses Dokument konsolidiert alle strategischen Analysen zu einem Gesamtkonzept. Es fasst die wichtigsten Entscheidungen zusammen, prüft Konsistenz zwischen den Analysen und erstellt eine Entscheidungs-Matrix.

**Basierend auf:**
- Datenmodell & Schema-Strategie Analyse
- Foundry-Integration & Kompatibilität Analyse
- UI-Architektur & Sheets Analyse
- Erweiterbarkeits-Strategie Analyse
- Performance- & Skalierungs-Strategie Analyse
- Migration- & Kompatibilitäts-Strategie Analyse
- Node-Daten-Erweiterbarkeit Analyse (bereits vorhanden)
- JournalEntryPageSheet-Registrierung Analyse (bereits vorhanden)

---

## Zusammenfassung der Analysen

### 1. Datenmodell & Schema-Strategie

**Empfehlung:** System-Struktur beibehalten + systematisches Schema-Versioning

**Kernentscheidungen:**
- Graph-Daten bleiben in `JournalEntryPage.system` (Single Source of Truth)
- Schema-Versioning mit einfachem Versions-Upgrade (sequenzielle Versionsnummern: 1, 2, 3...)
- Graph-Level Erweiterungen in system erweitern (nicht flags)
- **Klarstellung:** Flags können optional als Marker für Filterung verwendet werden, aber system bleibt Single Source of Truth

**Begründung:**
- Foundry-native Struktur
- Typsicherheit
- Konsistenz mit Foundry-Best-Practices

**Referenz:** `data-model-schema-strategy.md`

---

### 2. Foundry-Integration & Kompatibilität

**Empfehlung:** N-1, N, N+1 Version Support + Sofort-Deprecation + Port-Versioning

**Kernentscheidungen:**
- Unterstütze vorherige (N-1), aktuelle (N) und nächste (N+1) Foundry-Version (3 Versionen)
- Sofort-Deprecation: N-1 nur critical updates, älter als N-1 = kein Support (Ports bleiben im Code)
- Port-Versioning: Jede Version hat ihren Port
- Vollständige Tests für jeden Port-Version

**Begründung:**
- Pragmatisch (berücksichtigt, dass User auf System-/Modul-Kompatibilität warten)
- User-freundlich (unterstützt User, die auf Kompatibilität warten müssen)
- Realitätsnah (v12 wird noch verwendet, obwohl v13 aktuell ist)
- Klare Support-Politik (sofortige Deprecation, keine langen Übergangsphasen)

**Referenz:** `foundry-integration-compatibility.md`

---

### 3. UI-Architektur & Sheets

**Empfehlung:** Window-System für Graph-Editor + Window-basierte Form-UI

**Kernentscheidungen:**
- Graph-Editor im Window-System mit Cytoscape
- Node-Editor als Window-basierte Form-UI
- View-Modus optional im JournalEntryPageSheet

**Begründung:**
- Konsistente Architektur
- Erweiterbar durch Extension-Points
- Wartbar durch klare Trennung

**Referenz:** `ui-architecture-sheets.md`

---

### 4. Erweiterbarkeits-Strategie

**Empfehlung:** Extension-Points System (moderat) + Stable Public API

**Kernentscheidungen:**
- Registry-basierte Extension-Points (Pattern bereits vorhanden: HealthCheckRegistry, RendererRegistry, etc.)
- Stable Public API mit Semantic Versioning
- Einfache Plugin-Registry (kein vollständiges Plugin-System)
- **Extension-Points-Bereiche:** Window-System (Renderer, Controls, Actions), Node/Edge-Rendering, Validierung, Graph-Transformation
- **Deprecation-Mechanismus:** Bereits vorhanden (`deprecated-token.ts`) für interne API, kann für Public API genutzt werden

**Begründung:**
- Ausreichend für erste Erweiterungen
- Nicht zu komplex (Registry-Pattern bereits etabliert)
- Klare Grenzen für Wartbarkeit
- Kann zu Plugin-System erweitert werden
- Deprecation-Mechanismus ermöglicht sichere API-Evolution

**Referenz:** `extensibility-strategy.md`

---

### 5. Performance- & Skalierungs-Strategie

**Empfehlung:** Hybrid (Caching + Cytoscape-Optimierungen) + Adaptive Memory-Management

**Kernentscheidungen:**
- Graph-Level Caching mit LRU-Eviction (bereits vorhanden)
- Cytoscape-Optimierungen für große Graphen:
  - WebGL-Renderer aktivieren (GPU-Beschleunigung)
  - Level-of-Detail (LOD) Settings anpassen
  - Optional Filtering/Clustering für sehr große Graphen (> 1000 Nodes)
- Adaptive Memory-Management (LRU-basiert)
- Layout-Precomputation für häufig verwendete Graphen

**Begründung:**
- Skalierbar für große Graphen (WebGL + LOD)
- Performance-optimiert (GPU-Beschleunigung)
- Memory-effizient (Caching + LRU)
- **Klarstellung:** Cytoscape nutzt kein klassisches Virtualisierung-Pattern, sondern LOD/WebGL/Filtering

**Referenz:** `performance-scalability-strategy.md`

---

### 6. Migration- & Kompatibilitäts-Strategie

**Empfehlung:** Hybrid (Automatisch + Backup) + Sequenzielle Schema-Migration

**Kernentscheidungen:**
- Schema-Migration automatisch beim Laden + Backup in `system.lastVersion` (bereits vorhanden)
- Foundry-Version-Migration durch Port-Adapter-Pattern
- Modul-Version-Migration automatisch beim ersten Laden nach Update
- Backup-Mechanismus: N-1 Version wird in `system.lastVersion` gespeichert (bereits implementiert)

**Begründung:**
- Sicherheit durch Backup (bereits vorhanden)
- User-Freundlichkeit durch Automatik
- Kompatibilität durch Port-Adapter
- Rollback möglich durch `system.lastVersion`

**Referenz:** `migration-compatibility-strategy.md`

---

## Konsistenz-Check

### ✅ Konsistente Entscheidungen

1. **System-Struktur (Datenmodell) + Port-Adapter (Foundry-Integration):**
   - System-Struktur nutzt Foundry-native APIs
   - Port-Adapter-Pattern abstrahiert Foundry-Versionen
   - ✅ Konsistent: Port-Adapter ermöglicht Kompatibilität ohne Daten-Migration

2. **Schema-Versioning (Datenmodell) + Migration-Strategie:**
   - Schema-Versioning erfordert Migration
   - Automatische Migration mit Backup
   - ✅ Konsistent: Migration-System unterstützt Schema-Versioning

3. **Window-System (UI) + Extension-Points (Erweiterbarkeit):**
   - Window-System für UI
   - Extension-Points für Erweiterungen
   - ✅ Konsistent: Window-System kann Extension-Points nutzen

4. **Caching (Performance) + Migration (Kompatibilität):**
   - Caching für Performance
   - Migration für Kompatibilität
   - ✅ Konsistent: Cache-Invalidation bei Migration

### ⚠️ Potenzielle Konflikte / Abhängigkeiten

1. **Cytoscape-Optimierungen (Performance) + Window-System (UI):**
   - Cytoscape nutzt LOD/WebGL/Filtering statt klassischer Virtualisierung
   - Window-System nutzt Svelte
   - ✅ Konsistent: Cytoscape-Wrapper-Komponente im Window-System kann WebGL/LOD aktivieren

2. **Extension-Points (Erweiterbarkeit) + Public API (Erweiterbarkeit):**
   - Extension-Points benötigen Public API
   - Stable Public API kann sich langsam entwickeln
   - ⚠️ Abhängigkeit: Extension-Points müssen mit Public API kompatibel sein
   - **Mitigation:** API-Versioning für Extension-Points

3. **Schema-Versioning (Datenmodell) + Backup (Migration):**
   - Schema-Versioning erfordert Migration
   - Backup vor Migration in `system.lastVersion` (bereits vorhanden)
   - ✅ Konsistent: Backup-System ist bereits implementiert und speichert N-1 Version

---

## Entscheidungs-Matrix

| Bereich | Empfehlung | Alternativen | Begründung |
|---------|-----------|--------------|------------|
| **Datenmodell-Persistenz** | System-Struktur | Flags, Hybrid | Foundry-native, Typsicherheit |
| **Schema-Versioning** | Einfaches Upgrade | Semantisches Versioning, Lazy Migration | Einfach, klar strukturiert |
| **Foundry-Version-Support** | N-1, N, N+1 (3 Versionen) | N+1, LTS | Pragmatisch, User-freundlich (berücksichtigt Kompatibilitäts-Wartezeiten) |
| **Deprecation-Strategie** | Graduell (6 Monate) | Sofort, LTS | User haben Zeit für Migration |
| **UI-Architektur** | Window-System | Direkt im Sheet, Hybrid | Konsistent, erweiterbar |
| **Erweiterbarkeit** | Extension-Points | Minimal, Vollständiges Plugin-System | Balance zwischen Komplexität und Flexibilität |
| **Public API** | Stable (Semantic Versioning) | Evolving, Internal+Public | Community-Sicherheit |
| **Performance** | Hybrid (Caching + Cytoscape-Optimierungen) | Nur Caching, Nur WebGL/LOD | Skalierbar, Performance-optimiert (WebGL + LOD) |
| **Memory-Management** | Adaptive (LRU) | Aggressive Cleanup, Conservative | Balance zwischen Performance und Memory |
| **Schema-Migration** | Automatisch + Backup | Explizit, Nur Automatisch | Sicherheit + User-Freundlichkeit |
| **Foundry-Migration** | Port-Adapter | Migration-Scripts | Keine Daten-Migration nötig |

---

## Gesamt-Architektur-Vision

### Kurzfristig (MVP, 0-6 Monate)

**Fokus:** Stabile Basis, Core-Features

- System-Struktur für Datenpersistenz
- Schema-Versioning (Version 1-2)
- Port-Adapter für Foundry v12, v13, v14 (N-1, N, N+1)
- Window-System für UI
- Caching für Performance
- Automatische Migration

### Mittelfristig (1-2 Jahre)

**Fokus:** Erweiterbarkeit, Performance-Optimierung

- Extension-Points System (basierend auf Registry-Pattern)
- Public API Stabilisierung (minimal für MVP, dann erweitern)
- Cytoscape-Optimierungen (WebGL + LOD + Filtering) für große Graphen
- Layout-Precomputation
- Backup-System (bereits vorhanden, dokumentieren)
- Foundry v14 Support (N+1 wird N, v12 deprecated)

### Langfristig (3-5 Jahre)

**Fokus:** Skalierung, Community

- Vollständiges Plugin-System (wenn nötig)
- Multi-Version-Support (wenn nötig)
- Performance-Optimierungen
- Community-Erweiterungen
- Langfristige Kompatibilität

---

## Offene Entscheidungspunkte

### Geklärt:

1. **Cytoscape-"Virtualisierung":**
   - **Klarstellung:** Cytoscape nutzt kein klassisches Virtualisierung-Pattern (wie in Listen/Tabellen)
   - Stattdessen verwendet Cytoscape:
     - **Level-of-Detail (LOD)**: Automatische Detail-Reduktion bei großen Graphen (z.B. Labels nur bei < 200 Nodes)
     - **WebGL-Rendering**: GPU-beschleunigtes Rendering für bessere Performance
     - **Filtering/Clustering**: Anzeige nur relevanter Subsets des Graphen
   - **Empfehlung:** Für große Graphen (> 1000 Nodes) WebGL-Renderer aktivieren, LOD-Settings anpassen, und optional Filtering/Clustering implementieren
   - **Performance-Ziele:**
     - Graphen bis 500 Nodes: 60 FPS
     - Graphen bis 1000 Nodes: 30 FPS (mit LOD/WebGL)
     - Graphen > 1000 Nodes: Filtering/Clustering empfohlen

2. **Extension-Points-Bereiche:**
   - **Bereiche, wo Extension-Points Sinn machen:**
     1. **Window-System**: Renderer-Registry (bereits vorhanden), Window-Definition-Registry
     2. **Node/Edge-Rendering**: Custom Renderer für Node-Typen (z.B. verschiedene Visualisierungen)
     3. **Validierung**: Node/Edge-Validatoren (z.B. custom Validation-Rules)
     4. **Graph-Transformation**: Pre/Post-Processing bei Load/Save (z.B. Daten-Transformation)
     5. **UI-Components**: Custom Controls/Actions in Window-Definitions
     6. **Health-Checks**: HealthCheckRegistry (bereits vorhanden) - Beispiel für Registry-Pattern
   - **Bereiche, wo Extension-Points NICHT nötig sind:**
     - Core-Datenmodell (Node/Edge-Struktur) - nutzt bereits Extensions-Pattern
     - Foundry-Ports (bereits abstrahiert durch Port-Adapter-Pattern)
     - Caching (intern, keine Erweiterung nötig)
   - **Mitdenken bei:**
     - Window-System-Erweiterungen (Custom Renderer, Controls, Actions)
     - Graph-Editor-Features (Custom Layout-Algorithmen, Filter)
     - Validierung/Transformation (Custom Rules, Pre/Post-Processing)

3. **Backup-Mechanismus (bereits vorhanden):**
   - **Implementierung:** Im `JournalEntryPage.system` wird die N-1 Version in einem Backup-Zweig vorgehalten: `system.lastVersion`
   - **Zweck:** Ermöglicht Rollback auf vorherige Schema-Version bei Problemen
   - **Aktualisierung:** Bei jeder Migration wird die vorherige Version in `system.lastVersion` gespeichert
   - **Konsequenz für Migration-Strategie:** Backup-System ist bereits implementiert, Migration-Strategie sollte dies nutzen

4. **Deprecation-Mechanismus (bereits vorhanden):**
   - **Implementierung:** `src/infrastructure/di/types/utilities/deprecated-token.ts`
   - **Funktionalität:**
     - `markAsDeprecated()` markiert DI-Tokens als deprecated
     - Warnungen werden bei Token-Resolution angezeigt
     - Unterstützt Replacement-Tokens und Removal-Version
   - **Anwendung:** Wird bereits für interne API-Deprecation verwendet
   - **Konsequenz für Public API:** Deprecation-Mechanismus kann für Public API-Entwicklung genutzt werden

### Minimal-Definitionen (für MVP-Planung ausreichend):

1. **Extension-Points-API-Design:**
   - **Für MVP:** Registry-Pattern ist bereits etabliert (HealthCheckRegistry, RendererRegistry, etc.)
   - **Nach MVP:** Konkrete Extension-Points definieren (z.B. Node-Renderer, Graph-Transformers)
   - **Entscheidung:** Vollständiges API-Design wird nach MVP erarbeitet, Registry-Pattern ist ausreichend für Planung

2. **Public API-Design:**
   - **Für MVP:** Minimale Public API (Graph-Zugriff, Version-Info)
   - **Basis:** ModuleAPI-System ist bereits vorhanden (`module-api.ts`)
   - **Deprecation:** Deprecation-Mechanismus vorhanden (`deprecated-token.ts`)
   - **Entscheidung:** Minimal-API für MVP, vollständiges Design nach MVP basierend auf Erfahrungen

**Begründung für Minimal-Definitionen:**
- Registry-Pattern ist etabliert und kann für Extension-Points wiederverwendet werden
- ModuleAPI-System existiert bereits, kann schrittweise erweitert werden
- Vollständiges Design nach MVP ermöglicht Lernen aus Erfahrungen
- MVP kann mit Minimal-Definitionen geplant und implementiert werden

---

## Nächste Schritte

### Priorität 1 (Kritisch, vor MVP):

1. ✅ Datenmodell-Strategie finalisieren
2. ✅ Foundry-Integration-Strategie finalisieren
3. ✅ UI-Architektur-Strategie finalisieren

### Priorität 2 (Wichtig, vor MVP):

4. ✅ Erweiterbarkeits-Strategie definieren
5. ✅ Performance-Strategie definieren
6. ✅ Migration-Strategie definieren

### Priorität 3 (Nach MVP):

7. Extension-Points definieren und implementieren (basierend auf Registry-Pattern)
8. Cytoscape-Optimierungen implementieren (WebGL + LOD + Filtering)
9. Backup-System dokumentieren (bereits vorhanden)
10. Public API erweitern und dokumentieren (minimal für MVP vorhanden)

---

## Referenzen

- [Strategische Gesamtanalyse - Rahmen](./strategische-gesamtanalyse-rahmen.md)
- [Datenmodell & Schema-Strategie](./data-model-schema-strategy.md)
- [Foundry-Integration & Kompatibilität](./foundry-integration-compatibility.md)
- [UI-Architektur & Sheets](./ui-architecture-sheets.md)
- [Erweiterbarkeits-Strategie](./extensibility-strategy.md)
- [Performance- & Skalierungs-Strategie](./performance-scalability-strategy.md)
- [Migration- & Kompatibilitäts-Strategie](./migration-compatibility-strategy.md)
- [Node-Daten-Erweiterbarkeit](./node-data-extension-deep-analysis.md)
- [JournalEntryPageSheet-Registrierung](./journal-entry-page-sheet-registration-analyse.md)
