# Übersicht: Offene Entscheidungen in Subsystemen/Modulen

**Status:** Übersichtsdokument
**Datum:** 2026-01-11
**Zweck:** Systematische Übersicht über noch offene Entscheidungspunkte in den Analysen

---

## Zusammenfassung

**Status:** Die meisten strategischen Entscheidungen sind getroffen. Die "Offenen Fragen & Entscheidungspunkte" in den Analysen sind größtenteils bereits durch die Empfehlungen geklärt, müssen aber noch explizit dokumentiert werden.

---

## Systematische Übersicht nach Subsystemen

### 1. Datenmodell & Schema-Subsystem ✅ BESTÄTIGT

**Analyse:** `data-model-schema-strategy.md`

**Empfehlung getroffen:** ✅
- System-Struktur beibehalten (Single Source of Truth)
- Einfaches Schema-Versioning (sequenzielle Versionsnummern: 1, 2, 3...)
- Graph-Level Erweiterungen in system

**Entscheidungspunkte:**
- ✅ **Persistenz-Ort:** System-Struktur (Single Source of Truth)
  - **Klarstellung:** Flags können optional als Marker für Filterung verwendet werden, aber system bleibt Single Source of Truth
  - **Status:** ✅ Bestätigt und dokumentiert

- ✅ **Schema-Versioning-Strategie:** Einfaches Versions-Upgrade
  - **Erklärung:** Sequenzielle Versionsnummern (1, 2, 3...) ohne semantische Bedeutung, sequenzielle Migration
  - **Status:** ✅ Bestätigt und dokumentiert

- ✅ **Graph-Level Erweiterbarkeit:** In system erweitern
  - **Status:** ✅ Bestätigt und dokumentiert

**Fazit:** ✅ Alle Entscheidungen getroffen, dokumentiert und bestätigt.

---

### 2. Foundry-Integration & Kompatibilitäts-Subsystem ✅ BESTÄTIGT

**Analyse:** `foundry-integration-compatibility.md`

**Empfehlung getroffen:** ✅
- N-1, N, N+1 Version Support (3 Versionen)
- Sofort-Deprecation (N-1 nur critical updates, älter = kein Support)
- Port-Versioning (jede Version hat ihren Port)
- Vollständige Tests für jeden Port

**Entscheidungspunkte:**
- ✅ **Version-Support-Strategie:** N-1, N, N+1 (3 Versionen)
  - **Begründung:** Pragmatisch - User warten auf System-/Modul-Kompatibilität bevor sie updaten
  - **Beispiel:** v12 wird noch verwendet, obwohl v13 aktuell ist
  - **Status:** ✅ Bestätigt und dokumentiert

- ✅ **Breaking Changes Handling:** Port-Versioning (jede Version hat ihren Port)
  - **Status:** ✅ Bestätigt und dokumentiert

- ✅ **Deprecation-Strategie:** Sofort (N-1 nur critical updates, älter als N-1 = kein Support)
  - **Details:** N-1 erhält nur critical updates, N wird aktiv entwickelt, N+1 wird vorbereitet, älter als N-1 bleibt "as is" (Ports im Code, aber keine Wartung)
  - **Status:** ✅ Bestätigt und dokumentiert

- ✅ **Testing-Strategie:** Vollständige Tests für jeden Versioning-Port
  - **Status:** ✅ Bestätigt und dokumentiert

**Fazit:** ✅ Alle Entscheidungen getroffen, dokumentiert und bestätigt.

---

### 3. UI-Architektur & Sheets-Subsystem

**Analyse:** `ui-architecture-sheets.md`

**Empfehlung getroffen:** ✅
- Zwei JournalEntryPageSheets: Graph-Sheet und Node-Sheet (beide über WindowSystemBridgeMixin)
- Graph-Editor: JournalEntryPageSheet mit Cytoscape-Integration über Sheet-Mixin
- Node-Editor/Form-UI: JournalEntryPageSheet für Node-Editing über Sheet-Mixin

**Offene Entscheidungspunkte (in Analyse):**
- ✅ Cytoscape-Integration: Window-System vs Direkt im Sheet vs Hybrid
  - **Status:** ✅ Geklärt - Empfehlung: WindowSystemBridgeMixin (Graph-Sheet als JournalEntryPageSheet)
  - **Aktion:** Entscheidung explizit in Analyse dokumentieren

- ✅ Form-UI / Node-Sheet: Window vs Dialog/Modal vs Inline
  - **Status:** ✅ Geklärt - Empfehlung: Node-Sheet als JournalEntryPageSheet (über Sheet-Mixin)
  - **Aktion:** Entscheidung explizit in Analyse dokumentieren

- ✅ UI-Erweiterbarkeit: Extension-Points vs Plugin-Registry vs API-Registry-Methoden
  - **Status:** ✅ Geklärt - Option D: Registry-Methoden in API (Service-Override für API-Exposed Services)
  - **Entscheidung:** ServiceWrapperFactory erweitern um Override-Registry (nur für API-Auflösungen)
  - **Aktion:** Entscheidung explizit in Analyse dokumentieren

**Fazit:** ✅ Alle Entscheidungen getroffen, müssen explizit dokumentiert werden.

---

### 4. Erweiterbarkeits-Subsystem

**Analyse:** `extensibility-strategy.md`

**Empfehlung getroffen:** ✅
- Extension-Points System (moderat)
- Stable Public API

**Offene Entscheidungspunkte (in Analyse):**
- ✅ Plugin-System-Strategie: Minimal vs Extension-Points vs Vollständig
  - **Status:** ✅ Geklärt - Empfehlung: Extension-Points (moderat)
  - **Aktion:** Entscheidung explizit in Analyse dokumentieren

- ✅ Public API-Strategie: Stable vs Evolving vs Internal+Public
  - **Status:** ✅ Geklärt - Empfehlung: Stable (Semantic Versioning)
  - **Aktion:** Entscheidung explizit in Analyse dokumentieren

- ✅ Extension-Points: Welche zuerst implementieren?
  - **Status:** ✅ Geklärt - Registry-Methoden in API (wie UI-Erweiterbarkeit in Abschnitt 3)
  - **Entscheidung:** Extension-Points (Node-Renderer, Layouts, etc.) werden auch über API-Registry-Methoden registriert
  - **Klarstellung:** Extension-Points sind automatisch verfügbar, sobald der entsprechende Service fertig ist, im Composition Root verdrahtet und in der API exposed ist
  - **Aktion:** ✅ Erledigt - Entscheidung explizit in Analyse dokumentiert
  - **Hinweis:** Keine separate Priorisierung nötig - ergibt sich automatisch aus Service-Implementierung

**Fazit:** ✅ Alle strategischen Entscheidungen getroffen. Extension-Points sind automatisch verfügbar, sobald Services in der API exposed sind.

---

### 5. Performance & Skalierungs-Subsystem

**Analyse:** `performance-scalability-strategy.md`

**Empfehlung getroffen:** ✅
- Hybrid (Caching + Cytoscape-Optimierungen)
- Adaptive Memory-Management

**Offene Entscheidungspunkte (in Analyse):**
- ✅ Cytoscape-Optimierungen: Canvas+LOD vs +Filtering vs WebGL
  - **Status:** ✅ Geklärt und dokumentiert - Entscheidung: Canvas + LOD + Filtering (optional)
  - **Entscheidung:** Canvas-Renderer (Standard), LOD (automatisch), Filtering (optional für >1000 Nodes), WebGL (später evaluieren)
  - **Aktion:** ✅ Erledigt - Entscheidung explizit in Analyse dokumentiert

- ✅ Memory-Management: Aggressive vs Conservative vs Adaptive
  - **Status:** ✅ Geklärt und dokumentiert - Entscheidung: Adaptive (LRU-basiert)
  - **Entscheidung:** Adaptive Memory-Management mit LRU (bereits vorhanden)
  - **Aktion:** ✅ Erledigt - Entscheidung explizit in Analyse dokumentiert

- ✅ Performance-Ziele: Konkrete Zahlen
  - **Status:** ✅ Geklärt und dokumentiert - Realistische Performance-Ziele definiert
  - **Details:** Initial Load (< 200ms/500ms/1000ms), Interaktivitäts-FPS (≥60/≥30/≥20 FPS), Filtering für >1000 Nodes
  - **Aktion:** ✅ Erledigt - Performance-Ziele in Performance-Analyse explizit dokumentiert

**Fazit:** ✅ Alle Entscheidungen getroffen und dokumentiert.

---

### 6. Migration & Kompatibilitäts-Subsystem

**Analyse:** `migration-compatibility-strategy.md`

**Empfehlung getroffen:** ✅
- Hybrid (Automatisch + Backup)
- Sequenzielle Schema-Migration

**Offene Entscheidungspunkte (in Analyse):**
- ✅ Schema-Migration-Strategie: Automatisch vs Explizit vs Hybrid
  - **Status:** ✅ Geklärt und dokumentiert - Empfehlung: Hybrid (Automatisch + Backup)
  - **Entscheidung:** Automatische Migration beim Laden + Backup in system.lastVersion (bereits vorhanden)
  - **Aktion:** ✅ Erledigt - Entscheidung explizit in Analyse dokumentiert

- ✅ Backup-Strategie: Beibehalten vs Erweitern vs Optional
  - **Status:** ✅ Geklärt und dokumentiert - Empfehlung: Beibehalten (system.lastVersion)
  - **Entscheidung:** N-1 Version in system.lastVersion beibehalten (bereits vorhanden)
  - **Aktion:** ✅ Erledigt - Entscheidung explizit in Analyse dokumentiert

- ✅ Rollback-Mechanismen: Bei fehlgeschlagener Migration
  - **Status:** ✅ Geklärt und dokumentiert - Rollback-Strategie definiert
  - **Entscheidung:** Bei fehlgeschlagener Migration: Daten wiederherstellen (aus system.lastVersion), Fehlermeldung anzeigen, Modulladen abbrechen (Graceful Degradation)
  - **Aktion:** ✅ Erledigt - Rollback-Mechanismus-Strategie explizit dokumentiert

**Fazit:** ✅ Alle Entscheidungen getroffen und dokumentiert.

---

## Zusammenfassung: Offene Entscheidungen

### ✅ Vollständig geklärt und bestätigt:

1. **Datenmodell & Schema:** ✅ BESTÄTIGT
   - Persistenz-Ort: System-Struktur (Single Source of Truth, Flags optional für Marker) ✅
   - Schema-Versioning: Einfaches Upgrade (sequenzielle Versionsnummern) ✅
   - Graph-Erweiterbarkeit: system erweitern ✅

2. **UI-Architektur:**
   - Cytoscape-Integration: Graph-Sheet als JournalEntryPageSheet (WindowSystemBridgeMixin) ✅
   - Form-UI: Node-Sheet als JournalEntryPageSheet (WindowSystemBridgeMixin) ✅
   - Zwei Sheets: Graph-Sheet und Node-Sheet (beide über WindowSystemBridgeMixin) ✅
   - UI-Erweiterbarkeit: Registry-Methoden in API (Service-Override für API-Exposed Services) ✅

3. **Erweiterbarkeit:**
   - Plugin-System: Extension-Points (moderat) ✅
   - Public API: Stable (Semantic Versioning) ✅
   - Extension-Points Registrierung: Registry-Methoden in API ✅

4. **Performance:**
   - Cytoscape-Optimierungen: Canvas-Renderer + LOD + Filtering ✅ (WebGL experimental verfügbar in Cytoscape 3.31.0+, KEIN npm-Paket nötig)
   - Memory-Management: Adaptive (LRU) ✅
   - Performance-Ziele: ✅ Definiert - Initial Load (< 200ms/500ms/1000ms), Interaktivitäts-FPS (≥60/≥30/≥20 FPS), Filtering für >1000 Nodes

5. **Migration:**
   - Schema-Migration: Hybrid (Automatisch + Backup) ✅
   - Backup-Strategie: system.lastVersion beibehalten ✅
   - Rollback-Mechanismus: Bei fehlgeschlagener Migration - Daten wiederherstellen, Fehlermeldung, Modulladen abbrechen (Graceful Degradation) ✅

6. **Foundry-Integration:** ✅ BESTÄTIGT
   - Version-Support: N-1, N, N+1 (3 Versionen) ✅
   - Breaking Changes: Port-Versioning (jede Version hat ihren Port) ✅
   - Deprecation: Sofort (N-1 nur critical, älter = kein Support) ✅
   - Testing: Vollständige Tests für jeden Port ✅

### ⚠️ Teilweise geklärt (noch zu ergänzen):

Keine verbleibenden Teilbereiche - alle strategischen Entscheidungen sind geklärt.

---

## Empfehlung

### Priorität 1 (für Finalisierung):
1. ✅ Alle strategischen Entscheidungen sind getroffen
2. ✅ Entscheidungen explizit in Analysen dokumentieren (Status-Update) - Erledigt
3. ✅ Alle Teilbereiche ergänzt
   - ✅ Performance-Ziele: Erledigt
   - ✅ Rollback-Mechanismus: Erledigt
   - ✅ Extension-Points: Erledigt (automatisch durch Service-Exposure)

### Priorität 2 (für Implementation - Post-MVP):
- Konkrete Testing-Strategie definieren
- Rollback-Mechanismus-Implementation planen
- Services entwickeln und in API exposed machen (Extension-Points ergeben sich automatisch)

---

## Fazit

**Status:** ✅ Alle strategischen Entscheidungen sind getroffen und dokumentiert.

**Verbleibende Arbeit:**
1. ✅ **Dokumentation:** Entscheidungen explizit in Analysen markieren (Status-Update) - Erledigt
2. ✅ **Ergänzungen:** Alle Teilbereiche konkretisiert
   - ✅ Performance-Ziele: Erledigt
   - ✅ Rollback-Mechanismus: Erledigt
   - ✅ Extension-Points: Erledigt (automatisch durch Service-Exposure)

**Für MVP-Planung:** ✅ Ausreichend geklärt. Alle strategischen Entscheidungen sind getroffen und dokumentiert.
