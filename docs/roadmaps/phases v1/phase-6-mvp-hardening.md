# Phase 6 – MVP Hardening

**Ziel:** Stabil, testbar, releasefähig.

**Status:** Geplant
**Abhängigkeiten:** Phase 5
**Nachfolger:** Release (1.0.0)

---

## Übersicht

Diese Phase fokussiert sich auf die Stabilisierung des MVPs, umfassende Tests, Dokumentation und Release-Vorbereitung. Alle kritischen Flows werden getestet, Regression-Tests durchgeführt und Dokumentation erstellt.

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

**Location:** `src/__tests__/e2e/` (eventuell neue Dateien)

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

**Location:** `src/__tests__/e2e/` (eventuell neue Dateien)

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

**Location:** `src/__tests__/e2e/` (eventuell neue Dateien)

---

### 2. Regression: Invalid JSON Handling

**Ziel:** Robuste Fehlerbehandlung bei ungültigen JSON-Daten

#### 2.1 Test-Szenarien

**Szenario 1: Ungültiges JSON in Page Content**
- Page Content enthält ungültiges JSON
- System muss graceful degradieren (Error-Notification, kein Crash)
- Recovery möglich (JSON-Editor, Phase 4)

**Szenario 2: Schema-Validation-Fehler**
- JSON ist gültig, aber Schema-Validation schlägt fehl
- System muss Error anzeigen
- Recovery möglich (JSON-Editor, Phase 4)

**Szenario 3: Partial Data (fehlende Felder)**
- Page Content enthält unvollständige Data
- System muss mit Defaults arbeiten oder Error anzeigen

#### 2.2 Implementation

**Error-Handling:**
- Parser (Phase 1) → Result-Pattern (Error statt Exception)
- Schema-Validator (Phase 1) → Result-Pattern
- UI: Error-Notifications (bestehendes System)
- JSON-Editor (Phase 4): Recovery-Möglichkeit

**Tests:**
- Unit Tests: Parser/Validator mit invalid Data
- Integration Tests: Load-UseCases mit invalid Data
- E2E Tests: JSON-Editor Recovery-Flow

---

### 3. Docs: Quick Start + Recovery Guide

**Ziel:** Dokumentation für End-User

#### 3.1 Quick Start Guide

**Inhalt:**
- Installation (Standard Foundry-Modul-Installation)
- Erste Schritte:
  - Node Page erstellen
  - Graph Page erstellen
  - Node zu Graph hinzufügen
  - Edge erstellen
- Basis-Workflows (GM + Player)

**Location:** `docs/guides/quick-start.md` (neu)

#### 3.2 Recovery Guide (JSON)

**Ziel:** Hilfe bei JSON-Fehlern

**Inhalt:**
- Was tun bei "Invalid JSON" Error?
- JSON-Editor (Advanced Tab, Phase 4) verwenden
- Schema-Validation-Fehler verstehen
- Backup/Restore (Foundry-Standard)

**Location:** `docs/guides/recovery-guide.md` (neu)

#### 3.3 API-Dokumentation (optional)

**Ziel:** Dokumentation für externe Module (falls Public API vorhanden)

**Inhalt:**
- Public API Endpoints (falls vorhanden)
- Beispiel-Usage
- Versioning (Public API Version, Phase 1)

**Location:** `docs/reference/api-reference.md` (eventuell erweitern)

---

### 4. Performance Testing (optional, nicht MVP-blocking)

**Ziel:** Performance bei größeren Datenmengen prüfen

**Szenarien:**
- Graph mit 50+ Nodes
- Graph mit 100+ Edges
- Cytoscape Performance (Phase 4)
- Save/Load Performance

**Ergebnis:**
- Performance-Akzeptanz-Kriterien definieren
- Optional: Optimierungen (nicht MVP-blocking)
- Post-MVP: Performance-Optimierungen für Riesengraphen (>1000 nodes)

---

### 5. Release-Vorbereitung

#### 5.1 Versionierung

**Version:** 1.0.0 (MVP)

**Semantic Versioning:**
- MAJOR: 1 (Breaking Changes möglich in 2.0.0)
- MINOR: 0 (Feature-Releases in 1.1.0, 1.2.0, etc.)
- PATCH: 0 (Bug-Fixes in 1.0.1, 1.0.2, etc.)

**Location:** `module.json`, `package.json` (falls vorhanden)

#### 5.2 Changelog

**Inhalt:**
- Alle Features seit letzter Version (oder seit 0.55.3)
- Breaking Changes (falls vorhanden)
- Known Issues (falls vorhanden)

**Location:** `CHANGELOG.md` (eventuell erweitern)

#### 5.3 Release-Notes

**Inhalt:**
- Zusammenfassung der MVP-Features
- Installation/Upgrade-Anleitung
- Bekannte Einschränkungen

**Location:** GitHub Release Notes (bei Release)

---

## Deliverables

1. ✅ E2E Tests:
   - Create Node/Graph Flow
   - Player View Flow
   - Edit/Save Flow (Autosave)

2. ✅ Regression Tests:
   - Invalid JSON Handling
   - Schema-Validation-Fehler
   - Partial Data

3. ✅ Dokumentation:
   - Quick Start Guide
   - Recovery Guide (JSON)
   - Optional: API-Dokumentation

4. ✅ Performance Testing (optional):
   - Performance-Akzeptanz-Kriterien
   - Optional: Optimierungen

5. ✅ Release-Vorbereitung:
   - Versionierung (1.0.0)
   - Changelog
   - Release-Notes

---

## Risiken

### Performance-Probleme bei größeren Graphen

**Mitigation:**
- Performance-Testing (Task 4)
- Akzeptanz-Kriterien definieren
- Post-MVP: Optimierungen (nicht MVP-blocking)

### Unentdeckte Bugs

**Mitigation:**
- Umfassende E2E Tests (Task 1)
- Regression Tests (Task 2)
- Code-Review vor Release

---

## Stop / Decision Points

1. **Alle E2E Tests erfolgreich:**
   - Core Flows funktionieren
   - Player View funktioniert
   - Autosave funktioniert
   - Keine Data Leaks

2. **Regression Tests erfolgreich:**
   - Invalid JSON Handling robust
   - Schema-Validation robust
   - Recovery möglich

3. **Dokumentation vollständig:**
   - Quick Start Guide vorhanden
   - Recovery Guide vorhanden
   - Optional: API-Dokumentation

4. **Release-ready:**
   - Version final
   - Changelog vollständig
   - Release-Notes vorbereitet

---

## Abhängigkeiten zu anderen Phasen

- **Phase 1-5:** Alle Phasen müssen abgeschlossen sein
- **Phase 1:** Parser/Validator werden getestet
- **Phase 3:** UseCases werden getestet
- **Phase 4:** JSON-Editor wird dokumentiert (Recovery Guide)
- **Phase 5:** Player View wird getestet

---

## Definition of Done (MVP) - Final Check

Aus Roadmap v2, Abschnitt 5:

- ✅ GM kann Node-Pages erstellen und pflegen (public/hidden/gm)
- ✅ GM kann Graph-Pages erstellen, Nodes referenzieren, Edges pflegen (knowledge)
- ✅ Cytoscape Editor funktioniert + Autosave verhindert Datenverlust
- ✅ Spieler sehen nur freigegebenes Wissen + können Notes als Overlay speichern
- ✅ Tests: core flows + leak prevention

---

## Referenzen

- [Roadmap v2 - Phase 6](../../mvp-roadmap-variante-2.md#phase-6--mvp-hardening)
- [Roadmap v2 - Definition of Done](../../mvp-roadmap-variante-2.md#5-definition-of-done-mvp)
- Bestehende Test-Patterns in `src/__tests__/`
- Bestehende Dokumentation in `docs/`
