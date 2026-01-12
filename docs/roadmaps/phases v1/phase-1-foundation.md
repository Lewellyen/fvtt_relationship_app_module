# Phase 1 – Foundation: Document Types, Schemas, Parser (Domain)

**Ziel:** Zwei Page Types sind registriert und validierbar. JSON Load/Save steht.

**Status:** Geplant
**Abhängigkeiten:** Keine
**Nachfolger:** Phase 2

---

## Übersicht

Diese Phase legt die Grundlagen für beide JournalEntryPage-Types:
- `relationship_app_node` → Knoten/Wissensobjekt (Lastenheft-Tabellenmodell)
- `relationship_app_graph` → Graph (Mitgliedschaft/Edges/Layout)

Beide Types benötigen:
1. Document Type-Registrierung in `module.json`
2. Lokalisierungs-Labels (i18n)
3. Domain Types + Valibot Schemas
4. JSON Parser/Serializer Utilities
5. Marker Flags (best effort)
6. **JournalEntryPageSheet-Registrierung** (Sheet + DataModel)

---

## Tasks

### 1. `module.json` erweitern: JournalEntryPage Document Types

**Aktueller Stand:**
```json
"documentTypes": {
  "JournalEntryPage": {
    "relationship_app_graph": {}
  }
}
```

**Ergänzung:**
```json
"documentTypes": {
  "JournalEntryPage": {
    "relationship_app_graph": {},
    "relationship_app_node": {}
  }
}
```

**Referenz:** Bereits vorhanden in Phase 0.2 der Roadmap v2

---

### 2. i18n Labels für beide Types

**Datei:** `lang/de.json`

**Erforderliche Keys:**

Für Graph-Type (`relationship_app_graph`):
```json
{
  "TYPES.JournalEntryPage.relationship_app_graph": "Beziehungsgraph",
  "TYPES.JournalEntryPage.fvtt_relationship_app_module.relationship_app_graph": "Beziehungsgraph"
}
```

**Status:** ✅ Bereits vorhanden

Für Node-Type (`relationship_app_node`):
```json
{
  "TYPES.JournalEntryPage.relationship_app_node": "Beziehungsknoten",
  "TYPES.JournalEntryPage.fvtt_relationship_app_module.relationship_app_node": "Beziehungsknoten"
}
```

**Status:** ❌ Noch zu ergänzen

**Englische Übersetzung:** `lang/en.json` entsprechend ergänzen

---

### 3. Domain Types + Valibot Schemas

**Ziel:** Platform-agnostische Domain-Models mit Schema-Validierung

#### 3.1 RelationshipNodeData (Page type: `relationship_app_node`)

**Erweiterbarkeits-Strategie: Hybrid-Ansatz**

Die Node-Datenstruktur verwendet einen Hybrid-Ansatz für maximale Flexibilität:

1. **Core-Fields per Schema-Versioning:** Typsichere, validierte Felder (Schema-Versioning)
2. **User-defined Fields per Extension Properties:** Flexible Key-Value-Store für Erweiterungen
3. **Plugin/Template-System (Post-MVP):** Für strukturierte Erweiterungen durch externe Module

**Schema (MVP):**

**Core-Fields (typsicher, validiert):**
- `schemaVersion: 1`
- `nodeKey: string` (Foundry Page.uuid)
- `name: string`
- `kind: "person" | "place" | "object"`
- `factionId?: string`
- `relation: "friend" | "enemy" | "neutral"`
- `icon?: string`
- `descriptions: { public?: string; hidden?: string; gm?: string }`
- `reveal: { public: boolean; hidden: boolean }` (gm implizit)
- `effects?: { friend?: string; enemy?: string; neutral?: string }`
- `linkedEntityUuid?: string`

**Extension Properties (flexibel, MVP):**
- `extensions?: Record<string, unknown>`
  - Key-Value-Store für user-defined/system-spezifische Felder
  - Keine Schema-Validierung (flexibel)
  - Beispiel: `extensions: { "dnd5e.stats": { strength: 18 }, "customTags": ["wizard"] }`

**TypeScript Interface:**
```typescript
interface RelationshipNodeData {
  // Core-Fields (typsicher)
  schemaVersion: 1;
  nodeKey: string;
  name: string;
  kind: "person" | "place" | "object";
  factionId?: string;
  relation: "friend" | "enemy" | "neutral";
  icon?: string;
  descriptions: { public?: string; hidden?: string; gm?: string };
  reveal: { public: boolean; hidden: boolean };
  effects?: { friend?: string; enemy?: string; neutral?: string };
  linkedEntityUuid?: string;

  // Extension Properties (flexibel, MVP)
  extensions?: Record<string, unknown>;
}
```

**Erweiterbarkeit (Post-MVP vorgesehen):**
- **Plugin-System:** Externe Module können Felder registrieren (Schema + UI)
- **Template-System:** Strukturierte Feld-Sets für verschiedene Use-Cases (z.B. "Person (D&D 5e)")
- **Plugin-Data:** Separate Storage für Plugin-spezifische Daten (Namespace nach Plugin-ID)
- **Template-ID:** Identifier für verwendetes Template

**Hinweis:** Plugin/Template-System wird nicht im MVP implementiert, aber im Schema-Design berücksichtigt (z.B. Platzhalter-Felder, wenn nötig).

**Location:** `src/domain/types/` oder `src/domain/schemas/`

**Schema-Definition:** Valibot Schema für Validierung (Core-Fields), Extensions optional validierbar

#### 3.2 RelationshipGraphData (Page type: `relationship_app_graph`)

**Minimal Schema (MVP):**
- `schemaVersion: 1`
- `graphKey: string` (Foundry Page.uuid)
- `nodeKeys: string[]`
- `edges: Array<{ id: string; source: string; target: string; knowledge: "public"|"hidden"|"secret"; label?: string }>`
- `layout?: { positions?: Record<string,{x:number;y:number}>; zoom?: number; pan?: {x:number;y:number} }>`

**Location:** `src/domain/types/` oder `src/domain/schemas/`

**Schema-Definition:** Valibot Schema für Validierung

---

### 4. JSON Parser/Serializer Utilities (Result-Pattern)

**Ziel:** Robuste JSON-Verarbeitung mit Error-Handling

**Features:**
- JSON → Domain Type (mit Schema-Validierung)
- Domain Type → JSON
- Invalid JSON → Error/Notification, kein Crash
- Result-Pattern für Fehlerbehandlung

**Location:** `src/domain/utils/` oder `src/infrastructure/parsers/`

**Beispiel:**
```typescript
parseNodeData(json: string): Result<RelationshipNodeData, ParseError>
serializeNodeData(data: RelationshipNodeData): Result<string, SerializeError>
```

---

### 5. Marker Flags (best effort)

**Ziel:** Marker am JournalEntry / Page für schnelle Erkennung

**Flags:**
- `hasRelationshipNode` / `isRelationshipNode` (für Node-Pages)
- `hasRelationshipGraph` / `isRelationshipGraph` (für Graph-Pages)

**Verwendung:**
- Schnelle Filterung/Query
- Optional: Index später (nicht MVP)

**Location:** Flag-Setter in Repository Adapters (Phase 2)

---

### 6. JournalEntryPageSheet-Registrierung

**Wichtig:** Diese Komponente ist kritisch für die Funktionsfähigkeit der Sheets!

Basierend auf der [Analyse zur JournalEntryPageSheet-Registrierung](../../analysis/journal-entry-page-sheet-registration-analyse.md) sind folgende Komponenten erforderlich:

#### 6.1 Konstanten

**Datei:** `src/application/constants/app-constants.ts`

**Ergänzung:**
```typescript
/**
 * JournalEntryPageSheet-Types für Beziehungsnetzwerke.
 * Müssen mit module.json "documentTypes.JournalEntryPage.*" übereinstimmen.
 */
export const JOURNAL_PAGE_SHEET_TYPE = {
  RELATIONSHIP_GRAPH: "fvtt_relationship_app_module.relationship_app_graph",
  RELATIONSHIP_NODE: "fvtt_relationship_app_module.relationship_app_node",
} as const;
```

**Referenz:** Analyse Abschnitt 1

#### 6.2 RegistrationService

**Neue Datei:** `src/application/services/JournalEntryPageSheetRegistrationService.ts`

**Aufgabe:**
- Registrierung beider Sheets (`relationship_app_graph` + `relationship_app_node`)
- Registrierung beider DataModels
- Integration in DI-Container/Notification-System

**Methoden:**

**6.2.1 `registerGraphSheet()`**
```typescript
private async registerGraphSheet(): Promise<void> {
  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
  DocumentSheetConfig.registerSheet(
    JournalEntryPage,
    MODULE_METADATA.ID, // "fvtt_relationship_app_module"
    JournalEntryPageRelationshipGraphSheet,
    {
      types: [JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH],
      makeDefault: true,
      label: () => {
        return (
          game?.i18n?.format("TYPES.JournalEntryPage.relationship_app_graph", {
            page: game?.i18n?.localize("TYPES.JournalEntryPage.relationship_app_graph"),
          }) || "Beziehungsgraph"
        );
      },
    }
  );
}
```

**6.2.2 `registerNodeSheet()`**
```typescript
private async registerNodeSheet(): Promise<void> {
  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
  DocumentSheetConfig.registerSheet(
    JournalEntryPage,
    MODULE_METADATA.ID,
    JournalEntryPageRelationshipNodeSheet,
    {
      types: [JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE],
      makeDefault: true,
      label: () => {
        return (
          game?.i18n?.format("TYPES.JournalEntryPage.relationship_app_node", {
            page: game?.i18n?.localize("TYPES.JournalEntryPage.relationship_app_node"),
          }) || "Beziehungsknoten"
        );
      },
    }
  );
}
```

**6.2.3 `registerGraphModel()`**
```typescript
private async registerGraphModel(): Promise<void> {
  CONFIG.JournalEntryPage.dataModels[JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH] =
    RelationshipGraphDataModel;
}
```

**6.2.4 `registerNodeModel()`**
```typescript
private async registerNodeModel(): Promise<void> {
  CONFIG.JournalEntryPage.dataModels[JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE] =
    RelationshipNodeDataModel;
}
```

**Integration:**
- Verwendung des Notification-Systems statt direktem Logger
- Error-Handler-Integration
- DI-Container-Registrierung (Token, Lifecycle)
- Aufruf im `init`-Hook (Bootstrap/Initialisierung)

**Referenz:** Analyse Abschnitte 3, 6

#### 6.3 DataModel-Klassen

**6.3.1 RelationshipGraphDataModel**

**Datei:** `src/infrastructure/adapters/foundry/models/RelationshipGraphDataModel.ts`

```typescript
import { fields } from "foundry.data.fields";

export class RelationshipGraphDataModel extends foundry.abstract.TypeDataModel<any, any, any, any> {
  static override defineSchema() {
    return {
      schemaVersion: new fields.NumberField({
        required: true,
        initial: 1,
        min: 1,
        integer: true,
      }),
      graphKey: new fields.StringField({
        required: true,
      }),
      nodeKeys: new fields.ArrayField(
        new fields.StringField({
          required: true,
        })
      ),
      edges: new fields.ArrayField(
        new fields.SchemaField({
          id: new fields.StringField({ required: true }),
          source: new fields.StringField({ required: true }),
          target: new fields.StringField({ required: true }),
          knowledge: new fields.StringField({
            required: true,
            choices: ["public", "hidden", "secret"],
          }),
          label: new fields.StringField({ required: false }),
        })
      ),
      layout: new fields.SchemaField({
        positions: new fields.ObjectField({ required: false }),
        zoom: new fields.NumberField({ required: false }),
        pan: new fields.SchemaField({
          x: new fields.NumberField({ required: false }),
          y: new fields.NumberField({ required: false }),
        }),
      }),
    };
  }
}
```

**6.3.2 RelationshipNodeDataModel**

**Datei:** `src/infrastructure/adapters/foundry/models/RelationshipNodeDataModel.ts`

```typescript
import { fields } from "foundry.data.fields";

export class RelationshipNodeDataModel extends foundry.abstract.TypeDataModel<any, any, any, any> {
  static override defineSchema() {
    return {
      schemaVersion: new fields.NumberField({
        required: true,
        initial: 1,
        min: 1,
        integer: true,
      }),
      nodeKey: new fields.StringField({
        required: true,
      }),
      name: new fields.StringField({
        required: true,
      }),
      kind: new fields.StringField({
        required: true,
        choices: ["person", "place", "object"],
      }),
      factionId: new fields.StringField({ required: false }),
      relation: new fields.StringField({
        required: true,
        choices: ["friend", "enemy", "neutral"],
      }),
      icon: new fields.StringField({ required: false }),
      descriptions: new fields.SchemaField({
        public: new fields.StringField({ required: false }),
        hidden: new fields.StringField({ required: false }),
        gm: new fields.StringField({ required: false }),
      }),
      reveal: new fields.SchemaField({
        public: new fields.BooleanField({ required: true, initial: false }),
        hidden: new fields.BooleanField({ required: true, initial: false }),
      }),
      effects: new fields.SchemaField({
        friend: new fields.StringField({ required: false }),
        enemy: new fields.StringField({ required: false }),
        neutral: new fields.StringField({ required: false }),
      }),
      linkedEntityUuid: new fields.StringField({ required: false }),
      // Extension Properties (flexibel, MVP)
      extensions: new fields.ObjectField({
        required: false,
        initial: {},
      }),
    };
  }
}
```

**Referenz:** Analyse Abschnitt 5

**Hinweis:** Das DataModel-Schema muss `extensions` als optionales ObjectField enthalten:

```typescript
extensions: new fields.ObjectField({
  required: false,
  initial: {},
}),
```

#### 6.4 JournalEntryPageSheet-Klassen (Stubs)

**Hinweis:** Vollständige Implementierung in Phase 4 (UI), hier nur Stubs für Registrierung

**6.4.1 JournalEntryPageRelationshipGraphSheet**

**Datei:** `src/infrastructure/adapters/foundry/sheets/JournalEntryPageRelationshipGraphSheet.ts`

```typescript
export default class JournalEntryPageRelationshipGraphSheet
  extends foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet {
  static override DEFAULT_OPTIONS = {
    id: "journal-entry-relationship-graph",
    classes: ["journal-entry-page", "relationship-graph"],
    type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
    position: { width: 800, height: 600 },
    window: { title: "Beziehungsgraph" },
    resizable: true,
    includeTOC: true,
  };

  // Stub: Vollständige Implementierung in Phase 4
  protected override async _onRender(...args: any[]): Promise<void> {
    await super._onRender(...args);
  }
}
```

**6.4.2 JournalEntryPageRelationshipNodeSheet**

**Datei:** `src/infrastructure/adapters/foundry/sheets/JournalEntryPageRelationshipNodeSheet.ts`

```typescript
export default class JournalEntryPageRelationshipNodeSheet
  extends foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet {
  static override DEFAULT_OPTIONS = {
    id: "journal-entry-relationship-node",
    classes: ["journal-entry-page", "relationship-node"],
    type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
    position: { width: 600, height: 800 },
    window: { title: "Beziehungsknoten" },
    resizable: true,
    includeTOC: true,
  };

  // Stub: Vollständige Implementierung in Phase 4
  protected override async _onRender(...args: any[]): Promise<void> {
    await super._onRender(...args);
  }
}
```

**Referenz:** Analyse Abschnitt 4

---

## Deliverables

1. ✅ `module.json` mit beiden Document Types
2. ✅ i18n Labels für beide Types (DE + EN)
3. ✅ Domain Types + Valibot Schemas (RelationshipNodeData mit Extensions, RelationshipGraphData)
4. ✅ JSON Parser/Serializer Utilities (Result-Pattern)
5. ✅ Marker Flags (Definition, Setter in Phase 2)
6. ✅ JournalEntryPageSheet-Registrierung:
   - Konstanten (JOURNAL_PAGE_SHEET_TYPE)
   - RegistrationService (beide Sheets + Models)
   - DataModel-Klassen (beide)
   - Sheet-Klassen (Stubs)

---

## Risiken

### JSON-Text-Editing kann Daten brechen
**Mitigation:**
- Robuste Schema-Validierung (Valibot)
- Klare Error-UX (Notifications)
- Recovery-Guide (Phase 6)

### Sheet-Registrierung schlägt fehl
**Mitigation:**
- Tests für Registrierung (Unit + Integration)
- Error-Handling in RegistrationService
- Fallback-Mechanismen prüfen

---

## Stop / Decision Points

1. **Schema-Felder final check:**
   - MVP minimal bestätigt (Core-Fields)
   - Extensions-Feld implementiert (für User-defined Fields)
   - Spätere Erweiterungen über `schemaVersion` dokumentiert
   - Plugin/Template-System für Post-MVP dokumentiert (nicht implementiert)

2. **Erweiterbarkeits-Strategie festgelegt:**
   - Hybrid-Ansatz bestätigt (Core + Extensions)
   - Extensions-Feld im Schema vorhanden
   - Plugin/Template-System als Post-MVP vorgesehen

3. **Sheet-Registrierung erfolgreich:**
   - Beide Sheets in Foundry registriert
   - Beide Models korrekt zugeordnet
   - Lokalisierung funktioniert

4. **Domain-Models validiert:**
   - Valibot-Schemas testen (valid/invalid)
   - Core-Fields validiert
   - Extensions optional (keine strenge Validierung)
   - JSON-Parser robust

---

## Abhängigkeiten zu anderen Phasen

- **Phase 2:** Repository Adapters nutzen Domain Types + Schemas
- **Phase 3:** UseCases nutzen Domain Types
- **Phase 4:** Sheet-Implementierung baut auf Stubs auf
- **Phase 6:** Recovery-Guide für JSON-Fehler

---

## Referenzen

- [Roadmap v2 - Phase 1](../../mvp-roadmap-variante-2.md#phase-1--foundation-document-types-schemas-parser-domain)
- [Analyse: JournalEntryPageSheet-Registrierung](../../analysis/journal-entry-page-sheet-registration-analyse.md)
- [Analyse: Node-Daten-Erweiterbarkeit (Hybrid-Ansatz)](../../analysis/node-data-extension-strategies.md) (falls Dokument erstellt)
- [Roadmap v2 - Leitentscheidungen](../../mvp-roadmap-variante-2.md#0-leitentscheidungen-fix)
