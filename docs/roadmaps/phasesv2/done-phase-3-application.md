# Phase 3 – Application: UseCases + Services + Schema-Migration

**Ziel:** Stabile Business-Flows (Create/Load/Save) für Node/Graph. Schema-Migration implementiert.

**Status:** Geplant
**Abhängigkeiten:** Phase 2
**Nachfolger:** Phase 4

**Basierend auf:** Finalisierte strategische Analyse
- ✅ Migration-Strategie: Hybrid (Automatisch + Backup)
- ✅ Rollback-Mechanismus: Bei fehlgeschlagener Migration (Graceful Degradation)

---

## Übersicht

Diese Phase implementiert die Application-Layer-Logik mit UseCases und Services. Zusätzlich wird die Schema-Migration-Strategie implementiert.

**Kernentscheidungen (finalisiert):**
- **Schema-Migration:** Hybrid (Automatisch + Backup)
- **Backup-Strategie:** system.lastVersion beibehalten
- **Rollback-Mechanismus:** Bei fehlgeschlagener Migration - Daten wiederherstellen, Fehlermeldung, Modulladen abbrechen (Graceful Degradation)

---

## Tasks

### 1. UseCases

**Location:** `src/application/use-cases/`

#### 1.1 CreateNodePage

**Ziel:** Neue Node-Page erstellen

**Input:**
- Journal Entry ID (optional: neue Page in existierendem Journal)
- Initial Node Data (Name, Kind, etc.)

**Output:** Result<JournalEntryPage, UseCaseError>

**Steps:**
1. Journal Entry laden/validieren
2. Node Data validieren (Schema, Phase 1)
3. Page erstellen (Type: `relationship_app_node`)
4. Content setzen (JSON in `system`)
5. Marker Flag setzen
6. Page zurückgeben

#### 1.2 CreateGraphPage

**Ziel:** Neue Graph-Page erstellen

**Input:**
- Journal Entry ID
- Initial Graph Data (GraphKey, leere nodeKeys/edges)

**Output:** Result<JournalEntryPage, UseCaseError>

**Steps:**
1. Journal Entry laden/validieren
2. Graph Data validieren (Schema, Phase 1)
3. Page erstellen (Type: `relationship_app_graph`)
4. Content setzen (JSON in `system`, `lastVersion` initial leer)
5. Marker Flag setzen
6. Page zurückgeben

#### 1.3 AddNodeToGraph / RemoveNodeFromGraph

**Ziel:** Node-Mitgliedschaft in Graph verwalten

**Input:**
- Graph Page ID
- Node Page ID (UUID)
- Operation: "add" | "remove"

**Output:** Result<void, UseCaseError>

**Steps (Add):**
1. Graph Page laden
2. Graph Data migrieren (wenn nötig, siehe Migration)
3. Graph Data parsen/validieren
4. Node Page validieren (existiert, ist Node-Type)
5. NodeKey zu `nodeKeys` Array hinzufügen (wenn nicht vorhanden)
6. Graph Data speichern (Repository Adapter, Phase 2)

**Steps (Remove):**
1. Graph Page laden
2. Graph Data migrieren (wenn nötig)
3. Graph Data parsen/validieren
4. NodeKey aus `nodeKeys` Array entfernen
5. Alle Edges mit diesem NodeKey entfernen (Cleanup)
6. Graph Data speichern

#### 1.4 UpsertEdge / RemoveEdge

**Ziel:** Edges in Graph verwalten

**Input:**
- Graph Page ID
- Edge Data (id, source, target, knowledge, label)
- Operation: "upsert" | "remove"

**Output:** Result<void, UseCaseError>

**Steps:**
1. Graph Page laden
2. Graph Data migrieren (wenn nötig)
3. Edge hinzufügen/entfernen/aktualisieren
4. Graph Data speichern

---

### 2. Services

**Location:** `src/application/services/`

#### 2.1 NodeDataService

**Ziel:** Node Data laden/speichern/validieren

**Methods:**
```typescript
interface NodeDataService {
  loadNodeData(pageId: string): Promise<Result<RelationshipNodeData, ServiceError>>
  saveNodeData(pageId: string, data: RelationshipNodeData): Promise<Result<void, ServiceError>>
  validateNodeData(data: RelationshipNodeData): Result<void, ValidationError>
}
```

**Features:**
- Schema-Validierung (Valibot, Phase 1)
- Migration-Integration (siehe Abschnitt 3)
- Error-Handling (Result-Pattern)

#### 2.2 GraphDataService

**Ziel:** Graph Data laden/speichern/validieren

**Methods:**
```typescript
interface GraphDataService {
  loadGraphData(pageId: string): Promise<Result<RelationshipGraphData, ServiceError>>
  saveGraphData(pageId: string, data: RelationshipGraphData): Promise<Result<void, ServiceError>>
  validateGraphData(data: RelationshipGraphData): Result<void, ValidationError>
}
```

**Features:**
- Schema-Validierung (Valibot, Phase 1)
- Migration-Integration (siehe Abschnitt 3)
- Error-Handling (Result-Pattern)

---

### 3. Schema-Migration implementieren

**Ziel:** Automatische Schema-Migration mit Backup + Rollback

**Strategische Entscheidung:** Hybrid (Automatisch + Backup)

#### 3.1 Migration-Service

**Location:** `src/application/services/MigrationService.ts`

**Methods:**
```typescript
interface MigrationService {
  migrateToLatest(data: unknown, schemaType: "node" | "graph"): Promise<Result<RelationshipNodeData | RelationshipGraphData, MigrationError>>
  getCurrentSchemaVersion(data: unknown): number
  needsMigration(data: unknown, schemaType: "node" | "graph"): boolean
}
```

**Features:**
- Sequenzielle Migration (Version 1 → 2 → 3...)
- Backup in `system.lastVersion` (N-1 Version)
- Rollback bei Fehlern (siehe 3.3)

#### 3.2 Migration-Implementierung

**Location:** `src/application/migrations/`

**Structure:**
- `migrations/node-data/` - Node-Migrations
- `migrations/graph-data/` - Graph-Migrations

**MVP:** Schema Version 1 (keine Migration nötig, aber Framework vorhanden)

**Migration-Pattern:**
```typescript
// Beispiel für zukünftige Migration (Post-MVP)
async function migrateNodeV1ToV2(data: NodeDataV1): Promise<NodeDataV2> {
  return {
    ...data,
    schemaVersion: 2,
    // Neue Felder hinzufügen/konvertieren
  };
}
```

#### 3.3 Rollback-Mechanismus

**Ziel:** Graceful Degradation bei fehlgeschlagener Migration

**Strategische Entscheidung:** Rollback bei fehlgeschlagener Migration

**Implementation:**
```typescript
async function migrateGraphWithRollback(graph: GraphModel): Promise<GraphModel> {
  try {
    // Backup ist bereits in system.lastVersion vorhanden
    const migrated = await migrateToLatest(graph);
    return migrated;
  } catch (error) {
    // Migration fehlgeschlagen → Rollback
    console.error('Migration failed:', error);

    // 1. Daten wiederherstellen (Backup aus system.lastVersion)
    if (graph.system.lastVersion) {
      const rolledBack = restoreFromBackup(graph);
      await saveGraph(graph.id, rolledBack); // Backup-Version speichern
    }

    // 2. Fehlermeldung anzeigen
    ui.notifications.error(
      'Migration fehlgeschlagen',
      'Die Migration der Graph-Daten ist fehlgeschlagen. Das Modul wurde deaktiviert. Bitte kontaktieren Sie den Support.'
    );

    // 3. Modulladen abbrechen (graceful degradation)
    throw new MigrationError('Migration failed, module disabled', error);
  }
}
```

**Integration in Init-Hook:**
- Migration beim Laden prüfen
- Rollback bei Fehlern
- Modul deaktivieren bei kritischen Fehlern

---

### 4. "Conflict Policy" (MVP)

**Ziel:** Konflikt-Strategie für gleichzeitige Updates

**MVP-Strategie:** Last-write-wins + Warning Banner

**Implementation:**
- Version-Mismatch-Detection (optional)
- Warning Banner wenn Version mismatch erkannt wird
- Last-write-wins (einfach für MVP)

---

## Deliverables

- ✅ UseCases (CreateNodePage, CreateGraphPage, AddNodeToGraph, RemoveNodeFromGraph, UpsertEdge, RemoveEdge)
- ✅ Services (NodeDataService, GraphDataService)
- ✅ Migration-Service (Framework, MVP: Version 1)
- ✅ Rollback-Mechanismus (Graceful Degradation)
- ✅ Conflict Policy (MVP: Last-write-wins)
- ✅ Stable APIs für UI Layer
- ✅ Unit/Integration Tests

---

## Risiken

- **Migration-Komplexität:** → Framework in MVP, erste Migration später
- **Conflict Policy:** → MVP einfach (Last-write-wins), erweiterbar später
- **Rollback-Mechanismus:** → Getestet, aber seltene Edge-Cases

---

## Stop / Decision Points

- ✅ Konfliktstrategie finalisiert (MVP: einfach)
- ✅ Migration-Framework implementiert (erste Migration später)
- ✅ Rollback-Mechanismus getestet

---

## Referenzen

- [Migration- & Kompatibilitäts-Strategie](../../analysis/migration-compatibility-strategy.md)
- [Datenmodell & Schema-Strategie](../../analysis/data-model-schema-strategy.md)
