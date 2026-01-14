# Prüfung: Voraussetzungen Phase 1-3 für Phase 4-6

**Datum:** 2025-01-13
**Status:** Analyse abgeschlossen

## Zusammenfassung

Prüfung aller Voraussetzungen aus Phase 1-3, die für Phase 4-6 benötigt werden.

---

## Phase 4 Voraussetzungen

### Anforderungen aus Phase 4 Roadmap:

1. **SaveGraphPage UseCase (Phase 3)** - Zeile 129
   - **Status:** ✅ Implementiert (GraphDataService.saveGraphData)
   - **Hinweis:** Phase 4 erwähnt "SaveGraphPage UseCase", aber in Phase 3 wurde `GraphDataService.saveGraphData()` implementiert, nicht ein separater UseCase. Dies ist konsistent mit der Architektur.

2. **Stable APIs für UI Layer** - Phase 3 Deliverable
   - **Status:** ✅ Implementiert
   - **Services:** NodeDataService, GraphDataService verfügbar
   - **UseCases:** Alle 6 UseCases verfügbar

3. **Schema-Validierung (Phase 1)**
   - **Status:** ✅ Implementiert
   - **Valibot Schemas:** Vorhanden für NodeData und GraphData

4. **Repository Adapter (Phase 2)**
   - **Status:** ✅ Implementiert
   - **RelationshipPageRepositoryAdapter:** Vorhanden

5. **Sheet-Registrierung (Phase 1)**
   - **Status:** ✅ Implementiert
   - **Sheet Stubs:** Vorhanden für Graph und Node

---

## Phase 5 Voraussetzungen

### Anforderungen aus Phase 5 Roadmap:

1. **Graph/Node Sheets (Phase 4)**
   - **Status:** ⏳ Phase 4 noch nicht implementiert
   - **Abhängigkeit:** Phase 4 muss vor Phase 5 abgeschlossen sein

2. **UseCases für Datenzugriff (Phase 3)**
   - **Status:** ✅ Implementiert
   - **Verfügbare UseCases:** CreateNodePage, CreateGraphPage, AddNodeToGraph, RemoveNodeFromGraph, UpsertEdge, RemoveEdge

3. **Services für Datenzugriff (Phase 3)**
   - **Status:** ✅ Implementiert
   - **NodeDataService:** ✅ Verfügbar
   - **GraphDataService:** ✅ Verfügbar

---

## Phase 6 Voraussetzungen

### Anforderungen aus Phase 6 Roadmap:

1. **Alle vorherigen Phasen (1-5)**
   - **Status:** ⏳ Phase 4 und 5 noch nicht implementiert
   - **Abhängigkeit:** Phase 6 benötigt vollständige MVP-Implementation

2. **Stabile APIs (Phase 3)**
   - **Status:** ✅ Implementiert
   - **Alle UseCases und Services:** ✅ Verfügbar

---

## Kritische Voraussetzungen für Phase 4

### Was Phase 4 EXPLIZIT benötigt:

1. ✅ **UseCases aus Phase 3:**
   - CreateNodePage ✅
   - CreateGraphPage ✅
   - AddNodeToGraph ✅
   - RemoveNodeFromGraph ✅
   - UpsertEdge ✅
   - RemoveEdge ✅

2. ✅ **Services aus Phase 3:**
   - NodeDataService ✅
   - GraphDataService ✅ (inkl. saveGraphData für Autosave)

3. ✅ **Repository Adapter aus Phase 2:**
   - RelationshipPageRepositoryAdapter ✅

4. ✅ **Schema-Validierung aus Phase 1:**
   - Valibot Schemas ✅

5. ✅ **Sheet-Stubs aus Phase 1:**
   - RelationshipGraphSheet (Stub) ✅
   - RelationshipNodeSheet (Stub) ✅

6. ⚠️ **Page-Erstellung:**
   - **Status:** ⚠️ Placeholder vorhanden
   - **Problem:** CreateNodePage und CreateGraphPage haben Placeholder für Page-Erstellung
   - **Auswirkung:** Phase 4 kann nicht vollständig funktionieren, wenn Pages nicht erstellt werden können
   - **Empfehlung:** Page-Erstellung MUSS vor Phase 4 implementiert werden

7. ⚠️ **Services in Public API:**
   - **Status:** ⚠️ NICHT in Public API exposed
   - **Problem:** GraphDataService und NodeDataService fehlen in `api.tokens`
   - **Auswirkung:** Phase 4 kann Services nicht über `api.resolve(api.tokens.graphDataServiceToken)` auflösen
   - **Empfehlung:** Services MÜSSEN vor Phase 4 in Public API aufgenommen werden (ApiSafeToken)

8. ⚠️ **Rollback-Mechanismus:**
   - **Status:** ⚠️ Teilweise implementiert (Backup-Strategie vorhanden, aber keine Init-Phase)
   - **Problem:** Init-Phase für Migration-Rollback fehlt
   - **Auswirkung:** Phase 4 wird funktionieren, aber Migration-Fehler beim Start könnten Probleme verursachen
   - **Empfehlung:** Sollte vor Phase 4 implementiert werden (kritisch für Stabilität)

---

## Fazit

### ✅ Voraussetzungen ERFÜLLT:

- Alle UseCases aus Phase 3 ✅
- Alle Services aus Phase 3 ✅
- Repository Adapter aus Phase 2 ✅
- Schema-Validierung aus Phase 1 ✅
- Sheet-Stubs aus Phase 1 ✅
- Stable APIs für UI Layer ✅

### ⚠️ Voraussetzungen TEILWEISE ERFÜLLT:

1. **Page-Erstellung (Phase 3):**
   - **Status:** Placeholder vorhanden, aber nicht funktional
   - **Kritikalität:** 🔴 HOCH - Phase 4 benötigt funktionierende Page-Erstellung
   - **Empfehlung:** MUSS vor Phase 4 implementiert werden

2. **Services in Public API (Phase 3):**
   - **Status:** Services existieren, aber NICHT in Public API exposed
   - **Kritikalität:** 🔴 HOCH - Phase 4 benötigt Services über `api.tokens.graphDataServiceToken` / `api.tokens.nodeDataServiceToken`
   - **Empfehlung:** MUSS vor Phase 4 in Public API aufgenommen werden (ApiSafeToken)

3. **Rollback-Mechanismus (Phase 3):**
   - **Status:** Backup-Strategie vorhanden, aber Init-Phase fehlt
   - **Kritikalität:** 🟡 MITTEL - Kann Probleme bei Migration-Fehlern verursachen
   - **Empfehlung:** Sollte vor Phase 4 implementiert werden (Stabilität)

---

## Empfehlungen

### Vor Phase 4:

1. **🔴 KRITISCH: Page-Erstellung implementieren**
   - CreateNodePage und CreateGraphPage müssen funktionieren
   - Ohne funktionierende Page-Erstellung kann Phase 4 nicht getestet werden

2. **🔴 KRITISCH: Services in Public API aufnehmen**
   - GraphDataService und NodeDataService als ApiSafeToken in `api.tokens` aufnehmen
   - Phase 4 benötigt Services über `api.resolve(api.tokens.graphDataServiceToken)`
   - Ohne API-Exposure können Sheets die Services nicht verwenden

3. **🟡 EMPFOHLEN: Rollback-Mechanismus vollständig implementieren**
   - Init-Phase für Migration-Rollback
   - Stabilität beim Modulstart

### Vor Phase 5:

- Phase 4 muss vollständig abgeschlossen sein (Graph/Node Sheets)

### Vor Phase 6:

- Phase 1-5 müssen vollständig abgeschlossen sein

---

## Detaillierte Analyse

### Phase 4 Abhängigkeiten:

| Voraussetzung | Phase | Status | Kritikalität | Notiz |
|---------------|-------|--------|--------------|-------|
| UseCases (alle 6) | 3 | ✅ | 🔴 HOCH | Erforderlich für Sheet-Operationen |
| NodeDataService | 3 | ✅ | 🔴 HOCH | Erforderlich für Node-Sheet |
| GraphDataService | 3 | ✅ | 🔴 HOCH | Erforderlich für Graph-Sheet (inkl. Autosave) |
| Repository Adapter | 2 | ✅ | 🔴 HOCH | Erforderlich für Datenzugriff |
| Schema-Validierung | 1 | ✅ | 🟡 MITTEL | Für Form-Validierung |
| Sheet-Stubs | 1 | ✅ | 🟡 MITTEL | Basis für Sheet-Implementation |
| Page-Erstellung | 3 | ⚠️ | 🔴 HOCH | **FEHLT: Placeholder, nicht funktional** |
| Services in Public API | 3 | ⚠️ | 🔴 HOCH | **FEHLT: GraphDataService/NodeDataService nicht exposed** |
| Rollback-Mechanismus | 3 | ⚠️ | 🟡 MITTEL | **FEHLT: Init-Phase nicht implementiert** |

---

## Zusammenfassung der fehlenden Voraussetzungen

### 🔴 Blockierend für Phase 4:

1. **Page-Erstellung via Foundry API**
   - CreateNodePage/CreateGraphPage müssen Pages erstellen können
   - Aktuell: Placeholder gibt Error zurück
   - **MUSS implementiert werden**

2. **Services in Public API aufnehmen**
   - GraphDataService und NodeDataService müssen als ApiSafeToken in `ModuleApiTokens` aufgenommen werden
   - Aktuell: Services existieren, aber nicht in `api.tokens` verfügbar
   - **MUSS implementiert werden** (WindowSystemBridgeMixin benötigt `api.resolve(api.tokens.graphDataServiceToken)`)

### 🟡 Empfohlen vor Phase 4:

1. **Rollback-Mechanismus (Init-Phase)**
   - Migration-Rollback bei Start
   - Backup-Strategie vorhanden, aber Init-Phase fehlt
   - **SOLLTE implementiert werden (Stabilität)**

---

## Nächste Schritte

1. ✅ Prüfung abgeschlossen
2. 🔴 Page-Erstellung implementieren (KRITISCH)
3. 🔴 Services in Public API aufnehmen (KRITISCH)
4. 🟡 Rollback-Mechanismus implementieren (EMPFOHLEN)
5. ✅ Danach kann Phase 4 starten

---

## Hinweis: Widerspruch zwischen Phase 4 und Phase 6 Roadmap

**Problem:**
- Phase 4 Roadmap erwähnt explizit, dass Sheets Services über Public API auflösen (`api.resolve(api.tokens.graphDataServiceToken)`)
- Phase 6 Roadmap plant, Services in Public API aufzunehmen ("Services in API exposed machen")

**Auflösung:**
- Services MÜSSEN bereits VOR Phase 4 in Public API aufgenommen werden
- Phase 6 sollte sich auf Registry-Methoden (`registerServiceOverride`, `registerServiceExtension`) konzentrieren, nicht auf Service-Exposure selbst
- Service-Exposure ist eine Voraussetzung für Phase 4, nicht Phase 6
