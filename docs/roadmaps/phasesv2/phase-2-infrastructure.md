# Phase 2 – Infrastructure: Foundry Adapters + DI + Port-Versioning

**Ziel:** Pages lassen sich sauber finden, laden, speichern (ohne UI). Port-Versioning für Foundry-Kompatibilität.

**Status:** Geplant
**Abhängigkeiten:** Phase 1
**Nachfolger:** Phase 3

**Basierend auf:** Finalisierte strategische Analyse
- ✅ Foundry-Integration: N-1, N, N+1 Version Support, Port-Versioning
- ✅ Datenmodell: System-Struktur (Single Source of Truth)

---

## Übersicht

Diese Phase implementiert die Foundry-spezifischen Adapter, die die Domain-Layer von Foundry-VTT-Implementierungsdetails abstrahieren. Zusätzlich wird das Port-Versioning-System für Foundry-Kompatibilität erweitert.

**Kernentscheidungen (finalisiert):**
- **Version-Support:** N-1, N, N+1 (3 Versionen)
- **Breaking Changes:** Port-Versioning (jede Version hat ihren Port)
- **Deprecation:** Sofort (N-1 nur critical updates, älter = kein Support)
- **Testing:** Vollständige Tests für jeden Port

---

## Tasks

### 1. Foundry Runtime Casts / Type Guards für JournalEntryPage Types

**Ziel:** Type-Safe Erkennung von Node/Graph Pages

**Location:** `src/infrastructure/adapters/foundry/runtime-casts.ts`

**Funktionen:**
```typescript
function isRelationshipGraphPage(page: JournalEntryPage): boolean
function isRelationshipNodePage(page: JournalEntryPage): boolean
function castRelationshipGraphPage(page: JournalEntryPage): Result<JournalEntryPage, CastError>
function castRelationshipNodePage(page: JournalEntryPage): Result<JournalEntryPage, CastError>
```

**Features:**
- Type Guards für Filterung
- Runtime-Validierung
- Error-Handling mit Result-Pattern

---

### 2. Repository Adapter

**Ziel:** Page Content (JSON) laden/speichern + Marker Flags setzen/lesen

**Strategische Entscheidung:** System-Struktur (Single Source of Truth in `JournalEntryPage.system`)

#### 2.1 Page Content Operations

**Location:** `src/infrastructure/adapters/foundry/repository-adapters/`

**Interface:**
```typescript
interface RelationshipPageRepositoryAdapter {
  // Node Operations (system.lastVersion wird in Phase 3 für Migration genutzt)
  getNodePageContent(pageId: string): Promise<Result<RelationshipNodeData, RepositoryError>>
  updateNodePageContent(pageId: string, data: RelationshipNodeData): Promise<Result<void, RepositoryError>>

  // Graph Operations (system.lastVersion wird in Phase 3 für Migration genutzt)
  getGraphPageContent(pageId: string): Promise<Result<RelationshipGraphData, RepositoryError>>
  updateGraphPageContent(pageId: string, data: RelationshipGraphData): Promise<Result<void, RepositoryError>>
}
```

**Features:**
- Daten aus `JournalEntryPage.system` lesen/schreiben
- JSON → Domain Type (mit Schema-Validierung, Phase 1)
- Domain Type → JSON
- Error-Handling (Result-Pattern)
- Backup-Struktur (`system.lastVersion`) wird in Phase 3 genutzt

#### 2.2 Marker Flags

**Flags (optional, aus Phase 1):**
- `hasRelationshipNode` / `isRelationshipNode`
- `hasRelationshipGraph` / `isRelationshipGraph`

**Setter:**
```typescript
setNodeMarker(pageId: string, hasNode: boolean): Promise<Result<void, RepositoryError>>
setGraphMarker(pageId: string, hasGraph: boolean): Promise<Result<void, RepositoryError>>
```

**Hinweis:** Flags sind optional (Marker), System-Struktur ist Single Source of Truth.

---

### 3. Collection Adapter

**Ziel:** Query-Operations für Pages

**Location:** `src/infrastructure/adapters/foundry/collection-adapters/`

**Methods:**
```typescript
findPagesByType(type: "node" | "graph"): Promise<Result<JournalEntryPage[], CollectionError>>
findNodePages(): Promise<Result<JournalEntryPage[], CollectionError>>
findGraphPages(): Promise<Result<JournalEntryPage[], CollectionError>>
findByJournalEntry(journalId: string): Promise<Result<JournalEntryPage[], CollectionError>>
```

**Implementation:**
- Filter nach Document Type
- Marker Flags nutzen (optional, für Performance)
- Error-Handling (Result-Pattern)

---

### 4. DI Registration (Tokens)

**Ziel:** Services im DI-Container registrieren

**Location:** Composition Root (`src/framework/core/composition-root.ts` oder ähnlich)

**Registrierungen:**
- Repository Adapters (Tokens)
- Collection Adapters (Tokens)
- Runtime Casts (falls als Service)

**Pattern:** DI-Container-Registrierung vor Validation

---

### 5. Port-Versioning erweitern (Foundry-Kompatibilität)

**Ziel:** Port-Versioning-System für N-1, N, N+1 Support erweitern

**Strategische Entscheidung:**
- **Version-Support:** N-1, N, N+1 (3 Versionen)
- **Breaking Changes:** Port-Versioning (jede Version hat ihren Port)
- **Deprecation:** Sofort (N-1 nur critical updates, älter = kein Support)

#### 5.1 Port-Registry erweitern

**Location:** `src/infrastructure/adapters/foundry/versioning/`

**Tasks:**
- Port-Registry für N-1, N, N+1 erweitern
- Port-Selector aktualisieren (wählt korrekten Port basierend auf Foundry-Version)
- Deprecation-Mechanismus implementieren (N-1 nur critical updates)

**Implementation:**
```typescript
// Port-Registry erweitern
PortRegistry.register({
  version: "v12", // N-1
  port: FoundryV12GamePort,
  deprecated: false, // N-1 noch unterstützt, aber nur critical updates
});

PortRegistry.register({
  version: "v13", // N (aktuell)
  port: FoundryV13GamePort,
  deprecated: false,
});

PortRegistry.register({
  version: "v14", // N+1 (wenn verfügbar)
  port: FoundryV14GamePort,
  deprecated: false,
});
```

#### 5.2 Port-Selector aktualisieren

**Tasks:**
- Port-Selector prüft Foundry-Version
- Wählt korrekten Port (N-1, N, oder N+1)
- Fallback-Mechanismus (wenn Version nicht unterstützt)

**Hinweis:** Vollständige Port-Implementierung für alle Versionen ist Post-MVP, hier nur Framework erweitern.

#### 5.3 Deprecation-Mechanismus

**Tasks:**
- Deprecation-Markierung für Ports
- N-1: Nur critical updates
- Älter als N-1: Kein Support (Ports bleiben im Code, aber keine Wartung)

---

## Deliverables

- ✅ Runtime Casts / Type Guards (beide Types)
- ✅ Repository Adapter (Node + Graph Operations, System-Struktur)
- ✅ Collection Adapter (Find-Operations)
- ✅ DI Registration (Tokens)
- ✅ Port-Versioning erweitert (N-1, N, N+1 Support, Framework)
- ✅ Unit/Integration Tests (Adapter + Port-Versioning)

---

## Risiken

- **Query-Performance:** → MVP ok, Index später optional
- **Port-Versioning Komplexität:** → Framework erweitern, vollständige Ports später

---

## Stop / Decision Points

- ✅ Minimal API für UseCases festgelegt
- ✅ Port-Versioning Framework erweitert (vollständige Ports in späteren Phasen)

---

## Referenzen

- [Foundry-Integration & Kompatibilität](../../analysis/foundry-integration-compatibility.md)
- [Datenmodell & Schema-Strategie](../../analysis/data-model-schema-strategy.md)
