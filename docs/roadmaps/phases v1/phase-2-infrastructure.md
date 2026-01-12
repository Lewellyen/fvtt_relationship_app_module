# Phase 2 – Infrastructure: Foundry Adapters + DI

**Ziel:** Pages lassen sich sauber finden, laden, speichern (ohne UI).

**Status:** Geplant
**Abhängigkeiten:** Phase 1
**Nachfolger:** Phase 3

---

## Übersicht

Diese Phase implementiert die Foundry-spezifischen Adapter, die die Domain-Layer von Foundry-VTT-Implementierungsdetails abstrahieren. Die Adapter ermöglichen das Finden, Laden und Speichern von JournalEntryPages ohne UI-Komponenten.

---

## Tasks

### 1. Foundry Runtime Casts / Type Guards für JournalEntryPage Types

**Ziel:** Type-Safe Erkennung von Node/Graph Pages

**Location:** `src/infrastructure/adapters/foundry/runtime-casts.ts` (eventuell erweitern)

**Funktionen:**
```typescript
function isRelationshipGraphPage(page: JournalEntryPage): boolean
function isRelationshipNodePage(page: JournalEntryPage): boolean
function castRelationshipGraphPage(page: JournalEntryPage): Result<JournalEntryPage, CastError>
function castRelationshipNodePage(page: JournalEntryPage): Result<JournalEntryPage, CastError>
```

**Verwendung:**
- Type Guards für Filterung
- Runtime-Validierung
- Error-Handling mit Result-Pattern

---

### 2. Repository Adapter

**Ziel:** Page Content (JSON) laden/speichern + Marker Flags setzen/lesen

#### 2.1 Page Content Operations

**Location:** `src/infrastructure/adapters/foundry/repository-adapters/` (eventuell neue Dateien)

**Interface/Methods:**
```typescript
interface RelationshipPageRepositoryAdapter {
  // Node Operations
  getNodePageContent(pageId: string): Promise<Result<RelationshipNodeData, RepositoryError>>
  updateNodePageContent(pageId: string, data: RelationshipNodeData): Promise<Result<void, RepositoryError>>

  // Graph Operations
  getGraphPageContent(pageId: string): Promise<Result<RelationshipGraphData, RepositoryError>>
  updateGraphPageContent(pageId: string, data: RelationshipGraphData): Promise<Result<void, RepositoryError>>
}
```

**Features:**
- JSON → Domain Type (mit Schema-Validierung, Phase 1)
- Domain Type → JSON
- Error-Handling (Result-Pattern)
- Marker Flags setzen/lesen

#### 2.2 Marker Flags

**Flags (aus Phase 1):**
- `hasRelationshipNode` / `isRelationshipNode`
- `hasRelationshipGraph` / `isRelationshipGraph`

**Setter:**
```typescript
setNodeMarker(pageId: string, hasNode: boolean): Promise<Result<void, RepositoryError>>
setGraphMarker(pageId: string, hasGraph: boolean): Promise<Result<void, RepositoryError>>
getNodeMarker(pageId: string): Promise<Result<boolean, RepositoryError>>
getGraphMarker(pageId: string): Promise<Result<boolean, RepositoryError>>
```

**Storage:** JournalEntry Flags (`flags.fvtt_relationship_app_module.*`)

---

### 3. Collection Adapter

**Ziel:** Query-Operations für Pages

#### 3.1 Find by Type

**Location:** `src/infrastructure/adapters/foundry/collection-adapters/` (eventuell erweitern)

**Methods:**
```typescript
findPagesByType(type: "node" | "graph"): Promise<Result<JournalEntryPage[], CollectionError>>
findNodePages(): Promise<Result<JournalEntryPage[], CollectionError>>
findGraphPages(): Promise<Result<JournalEntryPage[], CollectionError>>
```

**Implementation:**
- Filter über Page-Type (`page.type`)
- Optional: Marker Flags als Fallback/Performance-Optimierung
- Result-Pattern für Fehlerbehandlung

#### 3.2 Find by Journal Entry

**Methods:**
```typescript
findPagesByJournalEntry(journalId: string): Promise<Result<JournalEntryPage[], CollectionError>>
findNodePagesByJournalEntry(journalId: string): Promise<Result<JournalEntryPage[], CollectionError>>
findGraphPagesByJournalEntry(journalId: string): Promise<Result<JournalEntryPage[], CollectionError>>
```

**Implementation:**
- Zugriff auf `journal.pages`
- Filter nach Type/Marker
- Result-Pattern

---

### 4. DI Registration (Tokens)

**Ziel:** Integration in Dependency Injection Container

**Location:** `src/application/tokens/` oder `src/infrastructure/di/`

**Tokens:**
```typescript
export const relationshipPageRepositoryAdapterToken = createToken<RelationshipPageRepositoryAdapter>("RelationshipPageRepositoryAdapter");
export const relationshipPageCollectionAdapterToken = createToken<RelationshipPageCollectionAdapter>("RelationshipPageCollectionAdapter");
```

**Registration:**
- Service-Lifecycle (vermutlich SINGLETON)
- Dependency-Graph prüfen
- Integration in Framework-Config (analog zu `foundry-services.config.ts`)

**Location:** `src/framework/config/modules/relationship-page-services.config.ts` (neu)

---

## Deliverables

1. ✅ Runtime Casts / Type Guards (Node + Graph)
2. ✅ Repository Adapter:
   - Page Content Operations (get/update für Node + Graph)
   - Marker Flags (set/get)
3. ✅ Collection Adapter:
   - Find by Type (Node/Graph)
   - Find by Journal Entry
4. ✅ DI Registration:
   - Tokens
   - Service-Registrierung
   - Integration in Framework-Config

---

## Risiken

### Query-Performance

**Problem:** Große Journal-Entries mit vielen Pages → langsame Queries

**Mitigation (MVP):**
- Einfache Iteration über Pages (ausreichend für MVP)
- Optional: Index später (Post-MVP)
- Marker Flags als Performance-Optimierung

**Monitoring:**
- Performance-Tests für große Datensätze (optional, nicht MVP-blocking)

---

## Stop / Decision Points

1. **Minimal API für UseCases festlegen:**
   - Repository-Interface final
   - Collection-Interface final
   - UseCases können integriert werden (Phase 3)

2. **Type Safety gewährleistet:**
   - Runtime Casts funktionieren
   - Type Guards robust
   - Error-Handling konsistent

---

## Abhängigkeiten zu anderen Phasen

- **Phase 1:** Domain Types + Schemas werden verwendet
- **Phase 1:** Marker Flags werden gesetzt
- **Phase 3:** UseCases nutzen Repository + Collection Adapters
- **Phase 4:** UI nutzt UseCases (indirekt Adapters)

---

## Referenzen

- [Roadmap v2 - Phase 2](../../mvp-roadmap-variante-2.md#phase-2--infrastructure-foundry-adapters--di)
- [Roadmap v2 - Leitentscheidungen](../../mvp-roadmap-variante-2.md#0-leitentscheidungen-fix)
- Bestehende Adapter-Patterns in `src/infrastructure/adapters/foundry/`
