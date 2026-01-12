# Phase 1 – Foundation: Document Types, Schemas, Parser (Domain)

**Ziel:** Zwei Page Types sind registriert, validierbar, und Schema-Versioning ist implementiert.

**Status:** Geplant
**Abhängigkeiten:** Keine
**Nachfolger:** Phase 2 (Infrastructure)

**Basierend auf:** Finalisierte strategische Analyse
- ✅ Datenmodell & Schema-Strategie: System-Struktur, einfaches Schema-Versioning
- ✅ UI-Architektur: Sheet-Registrierung vorbereitet (WindowSystemBridgeMixin in Phase 4)

---

## Übersicht

Diese Phase legt die Grundlagen für beide JournalEntryPage-Types:
- `relationship_app_node` → Knoten/Wissensobjekt
- `relationship_app_graph` → Graph (Mitgliedschaft/Edges/Layout)

**Kernentscheidungen (finalisiert):**
- **Persistenz:** System-Struktur (Single Source of Truth in `JournalEntryPage.system`)
- **Schema-Versioning:** Einfaches Versions-Upgrade (sequenzielle Versionsnummern: 1, 2, 3...)
- **Graph-Erweiterbarkeit:** In system erweitern

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

---

### 2. i18n Labels für beide Types

**Datei:** `lang/de.json` (und `lang/en.json`)

**Erforderliche Keys:**
- `TYPES.JournalEntryPage.relationship_app_graph`: "Beziehungsgraph"
- `TYPES.JournalEntryPage.relationship_app_node`: "Beziehungsknoten"
- `TYPES.JournalEntryPage.fvtt_relationship_app_module.relationship_app_graph`: "Beziehungsgraph"
- `TYPES.JournalEntryPage.fvtt_relationship_app_module.relationship_app_node`: "Beziehungsknoten"

---

### 3. Domain Types + Valibot Schemas

**Ziel:** Platform-agnostische Domain-Models mit Schema-Validierung

**Strategische Entscheidung:** System-Struktur (Single Source of Truth)

#### 3.1 RelationshipNodeData (Page type: `relationship_app_node`)

**Schema-Struktur:**
- Daten werden in `JournalEntryPage.system` gespeichert
- Schema-Version: `schemaVersion: 1` (für MVP)

**Core-Fields (typsicher, validiert):**
```typescript
interface RelationshipNodeData {
  schemaVersion: 1;
  nodeKey: string; // Foundry Page.uuid
  name: string;
  kind: "person" | "place" | "object";
  factionId?: string;
  relation: "friend" | "enemy" | "neutral";
  icon?: string;
  descriptions: { public?: string; hidden?: string; gm?: string };
  reveal: { public: boolean; hidden: boolean };
  effects?: { friend?: string; enemy?: string; neutral?: string };
  linkedEntityUuid?: string;
}
```

**Valibot Schema:** `src/domain/schemas/node-data.schema.ts`

#### 3.2 RelationshipGraphData (Page type: `relationship_app_graph`)

**Schema-Struktur:**
- Daten werden in `JournalEntryPage.system` gespeichert
- Schema-Version: `schemaVersion: 1` (für MVP)
- Backup-Mechanismus: `lastVersion` (für Migration, Phase 3)

**Core-Fields:**
```typescript
interface RelationshipGraphData {
  schemaVersion: 1;
  graphKey: string; // Foundry Page.uuid
  nodeKeys: string[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    knowledge: "public" | "hidden" | "secret";
    label?: string;
  }>;
  layout?: {
    positions?: Record<string, { x: number; y: number }>;
    zoom?: number;
    pan?: { x: number; y: number };
  };
  // Backup für Migration (wird in Phase 3 verwendet)
  lastVersion?: {
    schemaVersion: number;
    // ... N-1 Version Daten
  };
}
```

**Valibot Schema:** `src/domain/schemas/graph-data.schema.ts`

**Wichtig:** Backup-Struktur (`lastVersion`) ist Teil des Schemas, wird aber erst in Phase 3 (Migration) aktiv genutzt.

---

### 4. JSON Parser/Serializer Utilities (Result-Pattern)

**Ziel:** Robuste JSON-Verarbeitung mit Fehlerbehandlung

**Implementation:**
- `src/domain/utils/json-parser.ts`
- Result-Pattern für Fehlerbehandlung
- Invalid JSON → Error-Result, kein Crash
- Validation-Errors → Klare Fehlermeldungen

**Features:**
- Parse JSON-String → Result<T, ParseError>
- Validate gegen Valibot-Schema → Result<T, ValidationError>
- Serialize Domain-Object → JSON-String
- Error-Messages für User (i18n)

---

### 5. Marker Flags (best effort)

**Zweck:** Schnelle Identifikation von Relationship-Pages (optional für Filterung)

**Implementation:**
- `JournalEntry.flags.fvtt_relationship_app_module.hasRelationshipNode`
- `JournalEntry.flags.fvtt_relationship_app_module.hasRelationshipGraph`
- `JournalEntryPage.flags.fvtt_relationship_app_module.isRelationshipNode`
- `JournalEntryPage.flags.fvtt_relationship_app_module.isRelationshipGraph`

**Hinweis:** Flags sind optional (Marker), System-Struktur ist Single Source of Truth.

---

### 6. JournalEntryPageSheet-Registrierung (Stubs)

**Ziel:** Sheet-Klassen und DataModel-Klassen vorbereiten (vollständige Implementation in Phase 4)

**Tasks:**
- DataModel-Klassen erstellen (Stubs):
  - `RelationshipGraphDataModel` (extends `JournalEntryPageDataModel`)
  - `RelationshipNodeDataModel` (extends `JournalEntryPageDataModel`)
- Sheet-Klassen erstellen (Stubs):
  - `RelationshipGraphSheet` (wird in Phase 4 mit WindowSystemBridgeMixin erweitert)
  - `RelationshipNodeSheet` (wird in Phase 4 mit WindowSystemBridgeMixin erweitert)
- RegistrationService erweitern:
  - Beide Sheets registrieren
  - Beide DataModels registrieren

**Referenz:** [JournalEntryPageSheet-Registrierung Analyse](../../analysis/journal-entry-page-sheet-registration-analyse.md)

**Hinweis:** Vollständige Sheet-Implementation (inkl. WindowSystemBridgeMixin) erfolgt in Phase 4.

---

## Deliverables

- ✅ `module.json` erweitert (beide Document Types)
- ✅ i18n Labels für beide Types
- ✅ Domain Types (TypeScript Interfaces)
- ✅ Valibot Schemas (für beide Types)
- ✅ JSON Parser/Serializer Utilities (Result-Pattern)
- ✅ Marker Flags (optional)
- ✅ Sheet-Registrierung (Stubs für Phase 4)
- ✅ Unit-Tests (Schema-Validierung, Parser)

---

## Risiken

- **JSON-Text-Editing kann Daten brechen:** → Klare Error-UX (Result-Pattern)
- **Schema-Erweiterungen:** → Schema-Versioning ermöglicht Migration (Phase 3)

---

## Stop / Decision Points

- ✅ Schema-Felder final check (MVP minimal; spätere Erweiterungen über schemaVersion)
- ✅ Sheet-Stubs sind ausreichend für Phase 2 (vollständige Implementation in Phase 4)

---

## Referenzen

- [Datenmodell & Schema-Strategie](../../analysis/data-model-schema-strategy.md)
- [UI-Architektur & Sheets](../../analysis/ui-architecture-sheets.md)
- [JournalEntryPageSheet-Registrierung Analyse](../../analysis/journal-entry-page-sheet-registration-analyse.md)
