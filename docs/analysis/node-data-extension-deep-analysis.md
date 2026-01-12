# Tiefenanalyse: Node-Daten Erweiterbarkeit - Strategische Entscheidungen

**Status:** Diskussionsdokument
**Datum:** 2026-01-11
**Kontext:** Langfristige Projektausrichtung - Entscheidungen mit langfristigen Konsequenzen

---

## Einleitung

Diese Analyse untersucht tiefgreifend verschiedene Strategien zur Erweiterbarkeit der Node-Datenstruktur. Die hier getroffenen Entscheidungen werden die Architektur des Projekts langfristig prägen und sollten daher sorgfältig durchdacht werden.

**Wichtige Überlegung:** Die Basis-Struktur wird über Jahre verwendet werden. Jede Entscheidung hat Konsequenzen für:
- Entwickler-Erfahrung (DX)
- User-Erfahrung (UX)
- Wartbarkeit
- Performance
- Migrationspfade
- Community-Erweiterungen

---

## Aktuelle Situation

### MVP Schema (Basis)
```typescript
interface RelationshipNodeData {
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
}
```

### Anforderungen an Erweiterbarkeit

1. **System-agnostisch:** Muss mit verschiedenen RPG-Systemen arbeiten (D&D 5e, PF2e, etc.)
2. **User-flexibel:** User sollen eigene Felder hinzufügen können
3. **Community-Erweiterungen:** Externe Module sollen erweitern können
4. **Zukunftssicher:** Neue Features ohne Breaking Changes
5. **Performance:** Keine signifikanten Performance-Einbußen
6. **Wartbarkeit:** Code muss langfristig wartbar bleiben

---

## Detaillierte Analyse der Ansätze

### Ansatz 1: Schema-Versioning mit Migration

#### Vollständige Beschreibung

**Prinzip:** Jede strukturelle Änderung führt zu neuer `schemaVersion`. Migration-Scripts konvertieren Daten automatisch.

**Implementation-Details:**

```typescript
// Version 1 (MVP)
interface RelationshipNodeDataV1 {
  schemaVersion: 1;
  // ... MVP-Felder
}

// Version 2 (Erweiterung)
interface RelationshipNodeDataV2 {
  schemaVersion: 2;
  // ... MVP-Felder
  customProperties?: Record<string, unknown>; // NEU
}

// Migration-Pipeline
type RelationshipNodeData = RelationshipNodeDataV1 | RelationshipNodeDataV2 | RelationshipNodeDataV3;

function migrateToLatest(data: RelationshipNodeData): RelationshipNodeDataV3 {
  let current = data;
  if (current.schemaVersion < 2) current = migrateV1ToV2(current);
  if (current.schemaVersion < 3) current = migrateV2ToV3(current);
  return current;
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Typsicherheit:** Vollständige TypeScript-Unterstützung für alle Versionen
- ✅ **Validierung:** Valibot-Schemas für jede Version ermöglichen strikte Validierung
- ✅ **Nachvollziehbarkeit:** Klare Versions-Historie, alle Änderungen dokumentiert
- ✅ **Automation:** Migration-Scripts ermöglichen automatische Konvertierung
- ✅ **Kontrolliert:** Alle Änderungen gehen durch Code-Review
- ✅ **Refactoring-freundlich:** Umbenennungen/Löschungen möglich mit Migration

**Nachteile:**
- ❌ **Breaking Changes:** Neue Felder erfordern Schema-Version-Update (Overhead)
- ❌ **Komplexität:** Migration-Scripts müssen geschrieben/getestet werden
- ❌ **Rigid:** Nicht flexibel für User-spezifische Erweiterungen zur Laufzeit
- ❌ **Wartung:** Alle Versionen müssen unterstützt werden (Backward Compatibility)
- ❌ **Langsam:** Bei vielen Versionen wird Migration-Pipeline komplexer
- ❌ **Overhead:** Kleine Änderungen erfordern große Migration (Version-Update)

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- 5-10 Schema-Versionen wahrscheinlich
- Migration-Pipeline mit 5-10 Schritten
- Alle Versionen müssen getestet werden
- Dokumentation für alle Versionen erforderlich

**Nach 5 Jahren:**
- 15-20 Schema-Versionen möglich
- Migration-Pipeline sehr komplex
- Performance-Impact bei Migration (viele Schritte)
- Wartbarkeit wird schwieriger

**Wartbarkeit:**
- Jede neue Version erfordert Migration-Script
- Tests für alle Versionen
- Dokumentation für Breaking Changes
- Risiko: Fehler in Migration-Scripts können Daten beschädigen

**Performance:**
- Migration läuft beim Laden (einmalig pro Page)
- Bei vielen Versionen: Sequenzielle Migration (kann langsam werden)
- Cache-Strategien nötig (gemigrated Data cachen)

**Entwickler-Erfahrung:**
- Gute DX für typsichere Felder
- Schlechte DX für schnelle Experimente (Version-Update nötig)
- Komplexität steigt mit Anzahl Versionen

**User-Erfahrung:**
- Transparent (Migration automatisch)
- Potenzielle Latenz beim ersten Laden nach Update
- Fehler bei Migration → Datenverlust möglich

#### Risiken & Mitigation

**Risiko 1: Migration-Fehler**
- **Wahrscheinlichkeit:** Mittel
- **Impact:** Hoch (Datenverlust)
- **Mitigation:** Umfassende Tests, Backup-Strategien, Rollback-Mechanismus

**Risiko 2: Performance-Problem bei vielen Versionen**
- **Wahrscheinlichkeit:** Hoch (nach 3+ Jahren)
- **Impact:** Mittel
- **Mitigation:** Cache gemigrated Data, Lazy Migration, Performance-Tests

**Risiko 3: Komplexität wächst überhand**
- **Wahrscheinlichkeit:** Hoch (nach 2+ Jahren)
- **Impact:** Hoch (Wartbarkeit)
- **Mitigation:** Regelmäßige Refactorings, Version-Consolidation, Automatisierung

---

### Ansatz 2: Extension Properties (Key-Value Store)

#### Vollständige Beschreibung

**Prinzip:** Ein flexibles `extensions`-Objekt erlaubt beliebige Key-Value-Paare. Core-Felder bleiben typsicher.

**Implementation-Details:**

```typescript
interface RelationshipNodeData {
  schemaVersion: 1;
  // Core-Felder (typsicher)
  name: string;
  kind: "person" | "place" | "object";
  // ...

  // Extension Properties (flexibel)
  extensions?: {
    [key: string]: unknown;
    // Beispiele:
    // "dnd5e.stats"?: { strength: 18, dexterity: 14 };
    // "pf2e.level"?: number;
    // "customTags"?: string[];
    // "userNotes"?: string;
  };
}

// Optional: Schema-Registry für Typsicherheit (opt-in)
interface ExtensionSchemaRegistry {
  "dnd5e.stats": { strength: number; dexterity: number; /* ... */ };
  "pf2e.level": number;
  "customTags": string[];
}

// Helper für typsicheren Zugriff (optional)
function getExtension<T extends keyof ExtensionSchemaRegistry>(
  data: RelationshipNodeData,
  key: T
): ExtensionSchemaRegistry[T] | undefined {
  return data.extensions?.[key] as ExtensionSchemaRegistry[T] | undefined;
}

// Validation (optional, zur Laufzeit)
function validateExtension(
  key: string,
  value: unknown,
  registry?: ExtensionSchemaRegistry
): Result<unknown, ValidationError> {
  if (registry && key in registry) {
    const schema = getSchemaForExtension(key); // Valibot Schema
    return validate(schema, value);
  }
  return ok(value); // Keine Validierung, wenn nicht registriert
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Flexibel:** Beliebige Felder zur Laufzeit hinzufügbar
- ✅ **Nicht-Breaking:** Keine Schema-Version-Änderung nötig für neue Felder
- ✅ **System-agnostisch:** System-spezifische Felder möglich (D&D 5e, PF2e, etc.)
- ✅ **User-Extensions:** User können eigene Felder hinzufügen
- ✅ **Einfach:** Keine Migration nötig für neue Felder
- ✅ **Schnell:** Experimentelle Felder möglich ohne Code-Änderung
- ✅ **Community:** Externe Module können Felder hinzufügen

**Nachteile:**
- ❌ **Keine Typsicherheit:** Extensions sind `unknown` (optional: Schema-Registry)
- ❌ **Keine Validierung:** Extensions werden nicht automatisch validiert
- ❌ **Namespace-Konflikte:** Key-Kollisionen möglich (z.B. "level" für verschiedene Systeme)
- ❌ **Dokumentation:** Extensions müssen separat dokumentiert werden
- ❌ **UI-Integration:** Dynamische UI-Generierung erforderlich (komplexer)
- ❌ **Refactoring:** Umbenennungen schwierig (keine automatische Migration)
- ❌ **Debugging:** Schwerer zu debuggen (keine Type-Hints)

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- Viele verschiedene Extension-Keys im System
- Namespace-Pollution möglich
- Dokumentation wird komplexer
- UI muss mit vielen verschiedenen Extension-Typen umgehen

**Nach 5 Jahren:**
- Extension-Keys unüberschaubar (wenn nicht organisiert)
- Performance: Große extensions-Objekte möglich
- Wartbarkeit: Schwer zu überblicken, welche Extensions wo verwendet werden
- Typ-Chaos: Viele `unknown`-Werte im Code

**Wartbarkeit:**
- Schwer zu refactoren (keine Type-Safety)
- Schwer zu finden, wo Extensions verwendet werden (keine Type-References)
- Dokumentation muss manuell gepflegt werden
- Risiko: Extension-Keys werden inkonsistent verwendet

**Performance:**
- Extensions-Objekt kann groß werden (viele Keys)
- Serialization/Deserialization: Größere JSON-Objekte
- Parsing: Mehr Daten zu parsen
- Cache: Größere Cache-Einträge

**Entwickler-Erfahrung:**
- Schlechte DX für Extension-Zugriff (keine Autocomplete)
- Gute DX für schnelle Experimente (kein Schema-Update nötig)
- Optional: Schema-Registry verbessert DX (aber Overhead)

**User-Erfahrung:**
- Flexibel: User können eigene Felder hinzufügen
- Potenzielle Verwirrung: Viele Felder, nicht klar strukturiert
- UI: Muss dynamisch generiert werden (komplexer)

#### Risiken & Mitigation

**Risiko 1: Namespace-Konflikte**
- **Wahrscheinlichkeit:** Mittel (bei vielen Extensions)
- **Impact:** Mittel (Verwirrung, Daten-Überschreibung)
- **Mitigation:** Naming-Conventions (z.B. "system.key"), Namespace-Registry

**Risiko 2: Type-Chaos**
- **Wahrscheinlichkeit:** Hoch (bei extensiver Nutzung)
- **Impact:** Hoch (Wartbarkeit, Bugs)
- **Mitigation:** Schema-Registry (opt-in), Type-Helpers, Dokumentation

**Risiko 3: Performance bei großen Extensions**
- **Wahrscheinlichkeit:** Mittel (bei vielen Extensions)
- **Impact:** Niedrig-Mittel
- **Mitigation:** Größen-Limits, Kompression, Lazy-Loading

**Risiko 4: Dokumentation wird unüberschaubar**
- **Wahrscheinlichkeit:** Hoch (nach 1+ Jahren)
- **Impact:** Mittel (User-Verwirrung)
- **Mitigation:** Auto-Generierte Docs, Extension-Registry mit Docs

---

### Ansatz 3: Plugin/Module-System für Feld-Registrierung

#### Vollständige Beschreibung

**Prinzip:** Externe Module/Plugins registrieren Felder mit Schema, UI-Komponente, Validierung. Felder erscheinen automatisch im Schema/UI.

**Implementation-Details:**

```typescript
// Plugin-Registry-Interface
interface NodeFieldDefinition {
  pluginId: string; // z.B. "dnd5e-relationship-extensions"
  fieldKey: string; // z.B. "stats"
  namespace: string; // z.B. "dnd5e" (für Namespace-Schutz)
  fullKey: string; // `${namespace}.${fieldKey}` -> "dnd5e.stats"
  schema: ValibotSchema; // Validierung
  uiComponent?: string; // Svelte-Komponente für UI
  defaultValue?: unknown;
  description?: string;
  metadata?: Record<string, unknown>;
}

// Registry
class NodeFieldRegistry {
  private fields = new Map<string, NodeFieldDefinition>();
  private byPlugin = new Map<string, NodeFieldDefinition[]>();

  registerField(def: NodeFieldDefinition): Result<void, RegistrationError> {
    // Namespace-Collision-Check
    const key = def.fullKey;
    if (this.fields.has(key)) {
      return err({ code: "FIELD_EXISTS", key, existingPlugin: this.fields.get(key)!.pluginId });
    }

    this.fields.set(key, def);

    // Index by plugin
    if (!this.byPlugin.has(def.pluginId)) {
      this.byPlugin.set(def.pluginId, []);
    }
    this.byPlugin.get(def.pluginId)!.push(def);

    return ok(undefined);
  }

  getField(key: string): NodeFieldDefinition | undefined {
    return this.fields.get(key);
  }

  getFieldsByPlugin(pluginId: string): NodeFieldDefinition[] {
    return this.byPlugin.get(pluginId) ?? [];
  }

  getAllFields(): NodeFieldDefinition[] {
    return Array.from(this.fields.values());
  }

  validateField(key: string, value: unknown): Result<unknown, ValidationError> {
    const def = this.fields.get(key);
    if (!def) return err({ code: "FIELD_NOT_FOUND", key });
    return validate(def.schema, value);
  }

  unregisterPlugin(pluginId: string): void {
    const fields = this.byPlugin.get(pluginId) ?? [];
    for (const field of fields) {
      this.fields.delete(field.fullKey);
    }
    this.byPlugin.delete(pluginId);
  }
}

// Data-Structure
interface RelationshipNodeData {
  schemaVersion: 1;
  // Core-Felder
  name: string;
  // ...

  // Plugin-Data (Namespace nach Plugin-ID)
  pluginData?: {
    [namespace: string]: Record<string, unknown>;
    // Beispiel:
    // "dnd5e": {
    //   "stats": { strength: 18, dexterity: 14 },
    //   "class": "wizard"
    // },
    // "pf2e": {
    //   "level": 5
    // }
  };
}

// Plugin-Registrierung (z.B. in Init-Hook)
Hooks.once("init", () => {
  const registry = getNodeFieldRegistry();

  const result = registry.registerField({
    pluginId: "dnd5e-relationship-extensions",
    fieldKey: "stats",
    namespace: "dnd5e",
    schema: object({
      strength: number(),
      dexterity: number(),
      // ...
    }),
    uiComponent: "Dnd5eStatsEditor",
    defaultValue: {},
    description: "D&D 5e Ability Scores",
  });

  if (!result.ok) {
    console.error("Failed to register field:", result.error);
  }
});

// UI-Integration (dynamisch)
function renderPluginFields(data: RelationshipNodeData) {
  const registry = getNodeFieldRegistry();
  const fields = registry.getAllFields();

  for (const field of fields) {
    const namespace = field.namespace;
    const fieldData = data.pluginData?.[namespace]?.[field.fieldKey];

    if (field.uiComponent) {
      // Render Svelte component dynamically
      renderFieldComponent(field.uiComponent, fieldData);
    }
  }
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Erweiterbar:** Externe Module können Felder hinzufügen
- ✅ **Typsicherheit (opt-in):** Plugin-definierte Schemas ermöglichen Validierung
- ✅ **UI-Integration:** Plugins können UI-Komponenten bereitstellen
- ✅ **Modular:** Clean Separation of Concerns
- ✅ **Validierung:** Plugin-definierte Validierung möglich
- ✅ **Namespace-Schutz:** Kollisionen vermeidbar durch Namespaces
- ✅ **Dokumentation:** Plugin kann eigene Dokumentation mitbringen
- ✅ **Lifecycle:** Plugins können Felder registrieren/deregistrieren

**Nachteile:**
- ❌ **Komplexität:** Registry-System, Plugin-API erforderlich
- ❌ **UI-Komplexität:** Dynamische UI-Generierung nötig
- ❌ **Dependencies:** Plugins müssen Modul-API kennen
- ❌ **Wartung:** Plugin-API muss stabil sein (Breaking Changes problematisch)
- ❌ **Performance:** Registry-Lookups, dynamische UI-Rendering
- ❌ **Testing:** Plugin-Integration schwer zu testen
- ❌ **Versionierung:** Plugin-API-Versionierung nötig

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- Plugin-API muss stabil sein (Breaking Changes problematisch)
- Viele Plugins möglich (Community-Erweiterungen)
- API-Versionierung wird wichtig
- Dokumentation der Plugin-API erforderlich

**Nach 5 Jahren:**
- Plugin-API-Evolution schwierig (Backward Compatibility)
- Viele Plugins → Maintenance-Burden
- Performance: Registry wird größer
- Testing: Integration-Tests mit Plugins komplex

**Wartbarkeit:**
- Plugin-API-Änderungen erfordern sorgfältige Planung
- Breaking Changes in API → Alle Plugins müssen aktualisiert werden
- Dokumentation muss aktuell gehalten werden
- Risiko: Plugin-API wird zu komplex

**Performance:**
- Registry-Lookups bei jedem Zugriff
- Dynamische UI-Rendering (langsamer als statisch)
- Plugin-Initialisierung beim Start (kann langsam werden)

**Entwickler-Erfahrung:**
- Gute DX für Plugin-Entwickler (wenn API gut designed)
- Schlechte DX für Core-Entwickler (mehr Komplexität)
- Learning Curve für Plugin-API

**User-Erfahrung:**
- Flexibel: Viele Erweiterungen möglich
- Potenzielle Verwirrung: Viele Felder, nicht klar welche Plugin
- Performance: Kann langsamer werden bei vielen Plugins

#### Risiken & Mitigation

**Risiko 1: Plugin-API wird zu komplex**
- **Wahrscheinlichkeit:** Hoch (Feature-Creep)
- **Impact:** Hoch (Wartbarkeit, Entwickler-Erfahrung)
- **Mitigation:** Klare API-Grenzen, Design-Reviews, Minimal API

**Risiko 2: Breaking Changes in Plugin-API**
- **Wahrscheinlichkeit:** Mittel (bei API-Evolution)
- **Impact:** Hoch (Alle Plugins müssen aktualisiert werden)
- **Mitigation:** API-Versionierung, Deprecation-Strategie, Migration-Guides

**Risiko 3: Performance bei vielen Plugins**
- **Wahrscheinlichkeit:** Mittel (bei Community-Adoption)
- **Impact:** Mittel
- **Mitigation:** Lazy-Loading, Registry-Optimierung, Performance-Tests

---

### Ansatz 4: Template/Profile-System

#### Vollständige Beschreibung

**Prinzip:** Verschiedene Node-Templates/Profiles definieren unterschiedliche Feld-Sets. User wählt Template beim Erstellen.

**Implementation-Details:**

```typescript
// Template-Definition
interface NodeTemplate {
  id: string; // z.B. "person-dnd5e", "location-generic"
  name: string;
  description?: string;
  baseKind: "person" | "place" | "object";
  fields: NodeFieldDefinition[];
  defaultValues?: Record<string, unknown>;
  validationSchema?: ValibotSchema;
}

interface NodeFieldDefinition {
  key: string; // z.B. "name", "stats.strength"
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  defaultValue?: unknown;
  validation?: ValibotSchema;
  uiComponent?: string;
  label?: string;
  hint?: string;
}

// Templates
const templates: NodeTemplate[] = [
  {
    id: "person-generic",
    name: "Person (Generic)",
    baseKind: "person",
    fields: [
      { key: "name", type: "string", required: true, label: "Name" },
      { key: "description", type: "string", required: false, label: "Description" },
      // Core-Felder
    ],
  },
  {
    id: "person-dnd5e",
    name: "Person (D&D 5e)",
    baseKind: "person",
    fields: [
      { key: "name", type: "string", required: true, label: "Name" },
      { key: "description", type: "string", required: false, label: "Description" },
      // D&D 5e-spezifische Felder
      { key: "stats.strength", type: "number", required: false, label: "Strength", defaultValue: 10 },
      { key: "stats.dexterity", type: "number", required: false, label: "Dexterity", defaultValue: 10 },
      { key: "class", type: "string", required: false, label: "Class" },
      { key: "level", type: "number", required: false, label: "Level", defaultValue: 1 },
    ],
    defaultValues: {
      "stats.strength": 10,
      "stats.dexterity": 10,
      level: 1,
    },
  },
];

// Data-Structure
interface RelationshipNodeData {
  schemaVersion: 1;
  templateId?: string; // Template-ID (wenn Template verwendet wird)
  // Core-Felder (immer vorhanden)
  name: string;
  kind: "person" | "place" | "object";
  // ...

  // Template-spezifische Felder (in extensions oder flat)
  [key: string]: unknown; // Oder: extensions wie Ansatz 2
}

// Validation basierend auf Template
function validateNodeData(data: RelationshipNodeData): Result<void, ValidationError> {
  if (data.templateId) {
    const template = templates.find(t => t.id === data.templateId);
    if (!template) return err({ code: "TEMPLATE_NOT_FOUND", templateId: data.templateId });
    return validateTemplateFields(data, template);
  }
  // Fallback: Core-Schema validieren
  return validateCoreSchema(data);
}

// UI: Template-Auswahl
function renderTemplateSelector(onSelect: (templateId: string) => void) {
  return templates.map(t => (
    <TemplateOption
      key={t.id}
      template={t}
      onSelect={() => onSelect(t.id)}
    />
  ));
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Strukturiert:** Klar definierte Feld-Sets pro Template
- ✅ **User-Freundlich:** Templates vereinfachen Node-Erstellung
- ✅ **Validierung:** Template-basierte Validierung möglich
- ✅ **Erweiterbar:** Neue Templates können hinzugefügt werden
- ✅ **Typsicherheit (opt-in):** Templates können Schemas definieren
- ✅ **UI-Simplification:** UI kann Template-spezifisch optimiert werden

**Nachteile:**
- ❌ **Komplexität:** Template-System, UI für Template-Auswahl
- ❌ **Rigid:** Felder müssen zu Template passen (weniger flexibel als Extensions)
- ❌ **Migration:** Template-Wechsel kann problematisch sein
- ❌ **Wartung:** Templates müssen verwaltet werden
- ❌ **User-Confusion:** Welches Template wählen? Was wenn falsch gewählt?
- ❌ **Template-Explosion:** Viele Templates → Unübersichtlichkeit

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- Viele Templates (verschiedene Systeme, Use-Cases)
- Template-Verwaltung wird komplexer
- User-Confusion: Welches Template?
- Migration zwischen Templates schwierig

**Nach 5 Jahren:**
- Template-Explosion (zu viele Templates)
- Wartung: Viele Templates zu pflegen
- User-Erfahrung: Overwhelming (zu viele Optionen)

**Wartbarkeit:**
- Templates müssen gepflegt werden
- Template-Änderungen erfordern Migration
- Risiko: Templates werden inkonsistent

**Performance:**
- Template-Validation bei jedem Save
- Template-Lookup bei jedem Load
- UI: Template-Auswahl-UI wird komplexer

**Entwickler-Erfahrung:**
- Gute DX für Template-Definition (wenn gut designed)
- Schlechte DX für Template-Migration
- Komplexität: Template-System

**User-Erfahrung:**
- Pro: Vereinfacht Erstellung (wenn richtiges Template gewählt)
- Contra: Verwirrung bei Template-Auswahl
- Contra: Template-Wechsel schwierig

#### Risiken & Mitigation

**Risiko 1: Template-Explosion**
- **Wahrscheinlichkeit:** Hoch (bei vielen Systemen/Use-Cases)
- **Impact:** Hoch (User-Overwhelm, Wartbarkeit)
- **Mitigation:** Template-Kategorien, Default-Templates, Template-Recommendations

**Risiko 2: Template-Migration schwierig**
- **Wahrscheinlichkeit:** Hoch (User wählt falsches Template)
- **Impact:** Mittel (User-Frustration)
- **Mitigation:** Template-Migration-Tools, Template-Merge-Strategien

---

### Ansatz 5: Hybrid-Ansatz (Core + Extensions + Plugin/Template-System)

#### Vollständige Beschreibung

**Prinzip:** Kombination mehrerer Ansätze für maximale Flexibilität.

**Komponenten:**
1. **Core-Schema (Schema-Versioning):** Typsichere, validierte Felder
2. **Extensions (Key-Value):** Flexible User-defined Fields
3. **Plugin-System (optional):** Für externe Module
4. **Template-System (optional):** Für strukturierte Feld-Sets

**Implementation-Details:**

```typescript
interface RelationshipNodeData {
  // Schema-Versioning (für Core-Felder)
  schemaVersion: 1;

  // Core-Felder (typsicher, validiert)
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

  // Extensions (flexibel, Key-Value)
  extensions?: {
    [key: string]: unknown;
  };

  // Plugin-Data (optional, für Plugin-System)
  pluginData?: {
    [pluginId: string]: Record<string, unknown>;
  };

  // Template-ID (optional, für Template-System)
  templateId?: string;
}

// Validation-Strategy
function validateNodeData(data: RelationshipNodeData): Result<void, ValidationError> {
  // 1. Core-Schema validieren (immer)
  const coreResult = validateCoreSchema(data);
  if (!coreResult.ok) return coreResult;

  // 2. Template-Validierung (wenn Template-ID vorhanden)
  if (data.templateId) {
    const templateResult = validateTemplateFields(data);
    if (!templateResult.ok) return templateResult;
  }

  // 3. Plugin-Validierung (wenn Plugin-Data vorhanden)
  if (data.pluginData) {
    const pluginResult = validatePluginData(data.pluginData);
    if (!pluginResult.ok) return pluginResult;
  }

  // 4. Extensions validieren (optional, falls Schema-Registry vorhanden)
  // (Extensions sind flexibel, keine strenge Validierung)

  return ok(undefined);
}

// Migration-Strategy
function migrateNodeData(data: unknown): Result<RelationshipNodeData, MigrationError> {
  // 1. Schema-Version erkennen
  const version = (data as any).schemaVersion ?? 1;

  // 2. Schrittweise Migration (nur Core-Felder)
  let migrated = data;
  if (version < 2) migrated = migrateV1ToV2(migrated);
  if (version < 3) migrated = migrateV2ToV3(migrated);
  // ...

  // 3. Normalisierung zu aktueller Version
  return normalizeToLatest(migrated);
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Maximale Flexibilität:** Alle Ansätze kombinierbar
- ✅ **Pragmatisch:** Passende Strategie für jeden Use-Case
- ✅ **Zukunftssicher:** Kann sich entwickeln (zunächst Extensions, später Templates)
- ✅ **Typsicherheit:** Core-Felder bleiben typsicher
- ✅ **Rückwärtskompatibel:** Schema-Versioning für Core, Extensions bleiben flexibel
- ✅ **Schrittweise Evolution:** Kann mit einfachen Ansätzen beginnen, später erweitern

**Nachteile:**
- ❌ **Komplexität:** Mehrere Systeme müssen koordiniert werden
- ❌ **Overhead:** Validierung/Migration mehrerer Systeme
- ❌ **Wartung:** Mehrere Erweiterbarkeits-Mechanismen zu dokumentieren
- ❌ **Konfusion:** Welche Strategie wann verwenden?
- ❌ **Performance:** Mehrere Validierungsschritte

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- Komplexes System mit mehreren Erweiterbarkeits-Mechanismen
- Dokumentation muss alle Mechanismen abdecken
- Entwickler müssen alle Mechanismen verstehen
- Risiko: Inconsistente Nutzung (wann welcher Mechanismus?)

**Nach 5 Jahren:**
- System wird sehr komplex
- Wartbarkeit schwieriger (mehrere Systeme)
- Performance: Mehrere Validierungsschritte
- Risiko: System wird unüberschaubar

**Wartbarkeit:**
- Sehr komplex (mehrere Systeme)
- Dokumentation muss alle abdecken
- Risiko: Entwickler verwenden falschen Mechanismus

**Performance:**
- Mehrere Validierungsschritte
- Größere Datenstruktur (mehr Felder)
- Serialization/Deserialization komplexer

**Entwickler-Erfahrung:**
- Schlechte DX: Zu viele Optionen, unklar wann welche
- Learning Curve: Alle Mechanismen verstehen
- Risiko: Confusion

**User-Erfahrung:**
- Potenzielle Verwirrung: Zu viele Optionen
- Performance: Kann langsamer werden

#### Risiken & Mitigation

**Risiko 1: System wird zu komplex**
- **Wahrscheinlichkeit:** Sehr hoch
- **Impact:** Sehr hoch (Wartbarkeit, Entwickler-Erfahrung)
- **Mitigation:** Klare Guidelines wann welcher Mechanismus, Minimal API, Schrittweise Einführung

**Risiko 2: Inconsistente Nutzung**
- **Wahrscheinlichkeit:** Hoch
- **Impact:** Hoch (Code-Qualität, Wartbarkeit)
- **Mitigation:** Klare Guidelines, Code-Reviews, Linter-Rules

---

## Offene Fragen & Entscheidungspunkte

### 1. UI/UX-Konsequenzen

**Frage:** Wie werden Extensions/Plugin-Data im UI dargestellt?

**Optionen:**
- A: Separate Section "Extensions" / "Plugin Data"
- B: Integriert in Haupt-Form (dynamisch)
- C: Tabs/Sections pro Extension/Plugin
- D: Collapsible Sections

**Konsequenzen:**
- A: Klare Trennung, aber mehr UI-Complexity
- B: Integriert, aber schwerer zu verstehen
- C: Übersichtlich, aber viele Tabs möglich
- D: Flexibel, aber UX kann komplex werden

**Entscheidungspunkt:** Wie soll UI strukturiert sein?

---

### 2. Migration-Strategie

**Frage:** Wie migrieren wir zwischen verschiedenen Erweiterbarkeits-Mechanismen?

**Szenario:** User hat Daten in Extensions, später wollen wir Plugin-System einführen.

**Optionen:**
- A: Automatische Migration (Extensions → Plugin-Data)
- B: Manuelle Migration (User muss migrieren)
- C: Beide parallel (Extensions + Plugin-Data)
- D: Keine Migration (Extensions bleiben)

**Konsequenzen:**
- A: Transparent für User, aber komplex
- B: User-Frustration, aber einfacher
- C: Flexibel, aber inkonsistent
- D: Einfach, aber Legacy-Code

**Entscheidungspunkt:** Welche Migration-Strategie?

---

### 3. Performance-Überlegungen

**Frage:** Welche Performance-Impact haben verschiedene Ansätze?

**Messgrößen:**
- Serialization/Deserialization-Zeit
- Validierung-Zeit
- UI-Rendering-Zeit
- Memory-Usage

**Vergleich:**
- Schema-Versioning: O(1) Validierung, aber Migration-Overhead
- Extensions: O(n) Validierung (n = Anzahl Extensions), größere JSON-Objekte
- Plugin-System: O(p) Validierung (p = Anzahl Plugins), Registry-Lookups
- Templates: O(1) Validierung, aber Template-Lookup

**Entscheidungspunkt:** Welche Performance-Anforderungen?

---

### 4. Namespace-Strategie

**Frage:** Wie organisieren wir Extension-Keys/Plugin-Namespaces?

**Optionen:**
- A: Flat (keine Namespaces)
- B: Hierarchisch ("system.field", "plugin.field")
- C: Registry-basiert (Plugin registriert Namespace)

**Konsequenzen:**
- A: Einfach, aber Kollisionen möglich
- B: Klar strukturiert, aber komplexer
- C: Sicher, aber Overhead

**Entscheidungspunkt:** Welche Namespace-Strategie?

---

### 5. Validierungs-Strategie

**Frage:** Wie validieren wir Extensions/Plugin-Data?

**Optionen:**
- A: Keine Validierung (flexibel)
- B: Opt-in Validierung (Schema-Registry)
- C: Strikte Validierung (immer)

**Konsequenzen:**
- A: Flexibel, aber Fehler möglich
- B: Best of both worlds, aber komplex
- C: Sicher, aber unflexibel

**Entscheidungspunkt:** Welche Validierungs-Strategie?

---

### 6. Dokumentations-Strategie

**Frage:** Wie dokumentieren wir Extensions/Plugin-Data?

**Optionen:**
- A: Manuelle Dokumentation
- B: Auto-generierte Docs (aus Schema-Registry)
- C: Inline-Docs (im Code/Schema)

**Konsequenzen:**
- A: Vollständig, aber Wartungs-Overhead
- B: Automatisch, aber möglicherweise unvollständig
- C: Integriert, aber schwer zu finden

**Entscheidungspunkt:** Welche Dokumentations-Strategie?

---

## Empfehlung & Begründung

### Empfehlung: Hybrid-Ansatz (vereinfacht für MVP)

**Komponenten:**
1. **Core-Schema + Schema-Versioning:** Für offizielle Modul-Erweiterungen
2. **Extensions:** Für User-defined/system-spezifische Felder (MVP)
3. **Plugin/Template-System:** Post-MVP (zu komplex für MVP)

**Begründung:**

**Für MVP:**
- ✅ Einfach zu implementieren (Core + Extensions)
- ✅ Flexibel genug für User-Anforderungen
- ✅ Zukunftssicher (kann später erweitert werden)
- ✅ Performance: Akzeptabel (nur Core + Extensions)
- ✅ Wartbarkeit: Überschaubar (zwei Mechanismen)

**Für Langzeit:**
- ✅ Kann schrittweise erweitert werden (Plugin/Template-System später)
- ✅ Rückwärtskompatibel (Extensions bleiben)
- ✅ Flexibel: Passende Strategie für jeden Use-Case

**Risiken:**
- ⚠️ System kann komplex werden (wenn später Plugins/Templates hinzugefügt)
- ⚠️ Dokumentation muss beide Mechanismen abdecken
- ⚠️ Entwickler müssen beide verstehen

**Mitigation:**
- Klare Guidelines: Wann Core-Schema, wann Extensions
- Dokumentation: Best Practices
- Code-Reviews: Konsistente Nutzung

---

## Nächste Schritte

1. **Diskussion:** Offene Fragen klären
2. **Prototyping:** MVP-Implementation testen
3. **Evaluation:** Nach MVP evaluieren, ob Plugin/Template-System nötig
4. **Iteration:** Basierend auf Erfahrungen anpassen

---

## Referenzen

- [Roadmap v2 - Datenmodelle](../roadmaps/mvp-roadmap-variante-2.md#2-datenmodelle-mvp)
- [Phase 1 - Foundation](../roadmaps/phases/phase-1-foundation.md)
- Best Practices: Schema-Evolution in anderen Projekten
