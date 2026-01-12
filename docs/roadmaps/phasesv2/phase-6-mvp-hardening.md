# Phase 6 – MVP Hardening + Public API

**Ziel:** Stabil, testbar, releasefähig. Initiale Public API bereitgestellt.

**Status:** Geplant
**Abhängigkeiten:** Phase 5
**Nachfolger:** Release (1.0.0)

**Basierend auf:** Finalisierte strategische Analyse
- ✅ Erweiterbarkeit: Public API (Stable, Semantic Versioning)
- ✅ Extension-Points: Automatisch verfügbar durch Service-Exposure

---

## Übersicht

Diese Phase fokussiert sich auf die Stabilisierung des MVPs, umfassende Tests, Dokumentation, Release-Vorbereitung und die initiale Public API.

**Kernentscheidungen (finalisiert):**
- **Public API:** Stable (Semantic Versioning)
- **Extension-Points:** Automatisch verfügbar, sobald Services in der API exposed sind
- **Registry-Methoden:** `registerServiceOverride` / `registerServiceExtension` in API

---

## Tasks

### 1. E2E Tests: Core Flows

**Ziel:** End-to-End Tests für kritische User-Flows

#### 1.1 Create Node/Graph Flow

**Test-Szenario:**
1. GM erstellt Node Page
2. GM erstellt Graph Page
3. GM fügt Node zu Graph hinzu
4. GM erstellt Edge zwischen Nodes
5. Graph wird korrekt gespeichert/geladen

**Expected:**
- Pages werden korrekt erstellt
- Data wird korrekt gespeichert
- Graph zeigt Nodes/Edges korrekt

#### 1.2 Player View Flow

**Test-Szenario:**
1. GM erstellt Node mit `reveal.public: true`
2. GM erstellt Graph mit Nodes/Edges
3. Spieler öffnet Graph (Player View)
4. Spieler sieht nur freigegebenes Wissen
5. Spieler fügt Notes hinzu (Overlay)
6. Notes werden korrekt gespeichert/geladen

**Expected:**
- Filtering funktioniert korrekt
- Keine Data Leaks (GM-Only Data nicht sichtbar)
- Overlay funktioniert (Notes speichern/laden)

#### 1.3 Edit/Save Flow (Autosave)

**Test-Szenario:**
1. GM öffnet Graph
2. GM dragt Node (Layout-Änderung)
3. Autosave triggert → Position wird gespeichert
4. Graph wird neu geladen → Position korrekt

**Expected:**
- Autosave funktioniert (Layout)
- Autosave funktioniert (Structure: Edges, etc.)
- Keine Datenverlust

---

### 2. Regression: Invalid JSON Handling

**Ziel:** Robuste Fehlerbehandlung bei ungültigen JSON-Daten

**Test-Szenarien:**
- Ungültiges JSON in Page Content → Graceful Degradation
- Schema-Validation-Fehler → Error-Notifications
- Partial Data (fehlende Felder) → Defaults oder Error

**Implementation:**
- Parser (Phase 1) → Result-Pattern
- Schema-Validator (Phase 1) → Result-Pattern
- UI: Error-Notifications
- JSON-Editor (Phase 4): Recovery-Möglichkeit

---

### 3. Dokumentation

**Ziel:** Umfassende Dokumentation für Release

#### 3.1 Quick Start Guide

**Inhalt:**
- Installation
- Erste Schritte (Node erstellen, Graph erstellen)
- Grundlegende Features

#### 3.2 Recovery Guide (JSON)

**Inhalt:**
- Was tun bei ungültigem JSON?
- JSON-Editor verwenden
- Backup wiederherstellen (falls nötig)

#### 3.3 API-Dokumentation (Public API)

**Inhalt:**
- Public API Übersicht
- Verfügbare Services/Tokens
- Registry-Methoden (`registerServiceOverride`, `registerServiceExtension`)
- Beispiel-Usage

---

### 4. Public API (Initial)

**Ziel:** Initiale Public API für MVP bereitstellen

**Strategische Entscheidung:** Stable Public API (Semantic Versioning)

#### 4.1 ModuleAPI erweitern

**Location:** `src/framework/core/api/`

**Erweiterungen:**
- Services in API exposed machen (basierend auf UseCases/Services aus Phase 3)
- Registry-Methoden hinzufügen:
  - `registerServiceOverride<TService>(token: ApiSafeToken<TService>, factory: () => TService): void`
  - `registerServiceExtension<TService>(token: ApiSafeToken<TService>, wrapper: (original: TService) => TService): void`

#### 4.2 ServiceWrapperFactory erweitern

**Location:** `src/framework/core/api/wrappers/service-wrapper-factory.ts`

**Erweiterungen:**
- Override-Registry integrieren (nur für API-Auflösungen)
- `wrapSensitiveService` prüft Override-Registry
- Intern: Container bleibt unverändert
- Extern: API nutzt Override-Registry

**Referenz:** [UI-Architektur Analyse](../../analysis/ui-architecture-sheets.md)

#### 4.3 Services in API exposed machen

**Services für MVP:**
- GraphDataService (Token: `api.tokens.graphDataServiceToken`)
- NodeDataService (Token: `api.tokens.nodeDataServiceToken`)
- Version-Info (Token: `api.tokens.versionToken`)

**Hinweis:** Extension-Points sind automatisch verfügbar, sobald Services exposed sind.

#### 4.4 API-Dokumentation

**Inhalt:**
- Verfügbare Services/Tokens
- Registry-Methoden-Usage
- Beispiele

---

### 5. Performance-Tests

**Ziel:** Performance-Ziele überprüfen

**Performance-Ziele (finalisiert):**
- Initial Load: < 200ms (≤100 Nodes), < 500ms (≤500 Nodes), < 1000ms (≤1000 Nodes)
- Interaktivitäts-FPS: ≥60 FPS (≤100 Nodes), ≥30 FPS (≤500 Nodes), ≥20 FPS (≤1000 Nodes)

**Tests:**
- Load-Performance messen
- FPS während Interaktionen messen
- Performance-Ziele erreicht?

---

### 6. Release-Vorbereitung

**Tasks:**
- Version-Numbering (1.0.0)
- Changelog erstellen
- Release-Notes
- Build-Prozess finalisieren

---

## Deliverables

- ✅ E2E Tests (Core Flows)
- ✅ Regression Tests (Invalid JSON Handling)
- ✅ Dokumentation (Quick Start, Recovery Guide, API-Docs)
- ✅ Public API (Initial: Services exposed, Registry-Methoden)
- ✅ Performance-Tests (Ziele erreicht?)
- ✅ Release-Vorbereitung (Version, Changelog, Release-Notes)
- ✅ MVP bereit für Release

---

## Risiken

- **Performance-Ziele nicht erreicht:** → Optimierungen oder Ziele anpassen
- **Public API-Komplexität:** → MVP minimal, erweiterbar später

---

## Stop / Decision Points

- ✅ Alle Tests bestanden
- ✅ Dokumentation vollständig
- ✅ Public API initial bereitgestellt
- ✅ Performance-Ziele erreicht
- ✅ Release-Vorbereitung abgeschlossen

---

## Referenzen

- [Erweiterbarkeits-Strategie](../../analysis/extensibility-strategy.md)
- [UI-Architektur & Sheets](../../analysis/ui-architecture-sheets.md)
- [Performance- & Skalierungs-Strategie](../../analysis/performance-scalability-strategy.md)
