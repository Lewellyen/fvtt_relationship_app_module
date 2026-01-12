# Analyse: JournalEntryPageSheet-Registrierung

Diese Analyse basiert auf dem Vorgängerprojekt `relationship-app` und identifiziert alle Komponenten, die für die Registrierung einer eigenen `JournalEntryPageSheet` im `fvtt_relationship_app_module` benötigt werden.

## Übersicht

Die Registrierung einer `JournalEntryPageSheet` erfordert:
1. **Konstanten** für Module-ID, Sheet-Type, etc.
2. **Lokalisierungs-Keys** für die Sheet-Bezeichnung
3. **RegistrationService** mit Sheet- und Model-Registrierung
4. **JournalEntryPageSheet-Klasse** (die eigentliche Sheet-Implementierung)
5. **DataModel-Klasse** für den Page-Type
6. **Integration** in den Bootstrap/Initialisierungs-Prozess

---

## 1. Konstanten

### Vorgängerprojekt (`relationship-app`)

**Datei:** `src/constants.ts`

```typescript
export const MODULE_ID = "relationship-app";
export const MODULE_METADATA_KEY = "metadata";

// Sheet-Type (wird in RegistrationService verwendet)
const GRAPH_SHEET_TYPE = "relationship-app.relationship-graph";
```

### Aktuelles Projekt (`fvtt_relationship_app_module`)

**Datei:** `src/application/constants/app-constants.ts`

**Anpassungen notwendig:**
- `MODULE_ID`: Bereits vorhanden als `MODULE_METADATA.ID = "fvtt_relationship_app_module"`
- `MODULE_METADATA_KEY`: Optional, nur wenn Metadaten-Registrierung benötigt wird
- **Sheet-Type**: Neue Konstante hinzufügen: `"fvtt_relationship_app_module.relationship_app_graph"`
  - **Wichtig:** Muss mit `module.json` übereinstimmen:
    ```json
    "documentTypes": {
      "JournalEntryPage": {
        "relationship_app_graph": {}
      }
    }
    ```

**Empfohlene Ergänzung in `app-constants.ts`:**
```typescript
/**
 * JournalEntryPageSheet-Type für Beziehungsgraph.
 * Muss mit module.json "documentTypes.JournalEntryPage.relationship_app_graph" übereinstimmen.
 */
export const JOURNAL_PAGE_SHEET_TYPE = {
  RELATIONSHIP_GRAPH: "fvtt_relationship_app_module.relationship_app_graph",
} as const;
```

---

## 2. Lokalisierung

### Vorgängerprojekt (`relationship-app`)

**Datei:** `lang/de.json`

```json
{
  "TYPES.JournalEntryPage.relationship-graph": "Beziehungsgraph",
  "TYPES.JournalEntryPage.relationship-app.relationship-graph": "Beziehungsgraph"
}
```

### Aktuelles Projekt (`fvtt_relationship_app_module`)

**Datei:** `lang/de.json`

**Bereits vorhanden:**
```json
{
  "TYPES.JournalEntryPage.relationship_app_graph": "Beziehungsgraph",
  "TYPES.JournalEntryPage.fvtt_relationship_app_module.relationship_app_graph": "Beziehungsgraph"
}
```

**Status:** ✅ Bereits korrekt vorhanden!

**Verwendung im RegistrationService:**
```typescript
label: () => {
  return (
    game?.i18n?.format("TYPES.JournalEntryPage.relationship_app_graph", {
      page: game?.i18n?.localize("TYPES.JournalEntryPage.relationship_app_graph"),
    }) || "Beziehungsgraph"
  );
}
```

---

## 3. RegistrationService

### Vorgängerprojekt (`relationship-app`)

**Datei:** `src/services/RegistrationService.ts`

**Wichtigste Methoden:**

#### 3.1 `registerSheet()`

```typescript
private async registerSheet(): Promise<void> {
  this.logger.info("🚀 Relationship App: Registering JournalEntryPageRelationshipGraphSheet...");
  const DocumentSheetConfig = foundry.applications.apps.DocumentSheetConfig;
  DocumentSheetConfig.registerSheet(
    JournalEntryPage,
    "relationship-app",
    JournalEntryPageRelationshipGraphSheet,
    {
      types: ["relationship-app.relationship-graph"],
      makeDefault: true,
      label: () => {
        return (
          game?.i18n?.format("TYPES.JournalEntryPage.relationship-graph", {
            page: game?.i18n?.localize("TYPES.JournalEntryPage.relationship-graph"),
          }) || "Relationship Graph"
        );
      },
    }
  );
}
```

**Erklärung:**
- `DocumentSheetConfig.registerSheet()` registriert die Sheet-Klasse
- **Parameter 1:** `JournalEntryPage` (Foundry Document-Klasse)
- **Parameter 2:** Module-ID als Namespace (`"relationship-app"`)
- **Parameter 3:** Die Sheet-Klasse (`JournalEntryPageRelationshipGraphSheet`)
- **Parameter 4:** Konfiguration:
  - `types`: Array mit dem Sheet-Type (muss mit `module.json` übereinstimmen)
  - `makeDefault`: `true` = Standard-Sheet für diesen Type
  - `label`: Funktion, die die lokalisierte Bezeichnung zurückgibt

#### 3.2 `registerModel()`

```typescript
private async registerModel(): Promise<void> {
  this.logger.info("🚀 Relationship App: Registering RelationshipGraphModel...");
  CONFIG.JournalEntryPage.dataModels["relationship-app.relationship-graph"] =
    RelationshipGraphModel;
}
```

**Erklärung:**
- Registriert das DataModel für den Sheet-Type
- **Wichtig:** Der Key muss exakt mit dem Sheet-Type übereinstimmen
- Das Model wird verwendet, wenn eine JournalEntryPage mit diesem Type erstellt wird

#### 3.3 `registerMetadata()` (Optional)

```typescript
private async registerMetadata(): Promise<void> {
  this.logger.info("🚀 Relationship App: Registering metadata...");
  game?.settings?.register(MODULE_ID as any, MODULE_METADATA_KEY as any, {
    name: "Relationship App Metadata",
    hint: "Metadata for the Relationship App",
    scope: "world",
    config: false,
    type: Object,
  });
}
```

**Status:** Optional, nur wenn Metadaten über Settings verwaltet werden sollen

### Anpassungen für aktuelles Projekt

**Neue Datei:** `src/application/services/JournalEntryPageSheetRegistrationService.ts` (oder ähnlich)

**Anpassungen:**
1. Module-ID: `"fvtt_relationship_app_module"` statt `"relationship-app"`
2. Sheet-Type: `"fvtt_relationship_app_module.relationship_app_graph"`
3. Lokalisierungs-Key: `"TYPES.JournalEntryPage.relationship_app_graph"`
4. Logger: Verwendung des bestehenden Notification/Logging-Systems
5. Error-Handler: Verwendung des bestehenden Error-Handling-Systems

**Abhängigkeiten:**
- Logger/Notification-Service
- Error-Handler
- Eventuell i18n-Service (falls vorhanden)

---

## 4. JournalEntryPageSheet-Klasse

### Vorgängerprojekt (`relationship-app`)

**Datei:** `src/applications/JournalEntryPageRelationshipGraphSheet.ts`

**Wichtige Aspekte:**

#### 4.1 Basis-Klasse

```typescript
export default class JournalEntryPageRelationshipGraphSheet
  extends foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet {
  // ...
}
```

**Erklärung:**
- Erweitert `JournalEntryPageHandlebarsSheet` (Foundry V13)
- Handlebars-basiertes Template-System

#### 4.2 Sheet-Type-Konstante

```typescript
const GRAPH_SHEET_TYPE = "relationship-app.relationship-graph" as const;
```

#### 4.3 DEFAULT_OPTIONS

```typescript
static override DEFAULT_OPTIONS = {
  id: "journal-entry-relationship-graph",
  classes: ["journal-entry-page", "relationship-graph"],
  type: GRAPH_SHEET_TYPE,
  position: { width: 800, height: 600 },
  window: { title: "Beziehungsgraph" },
  resizable: true,
  includeTOC: true,
};
```

**Erklärung:**
- `type`: Muss mit dem Sheet-Type übereinstimmen
- `id`: Eindeutige ID für die Sheet-Instanz
- `classes`: CSS-Klassen für Styling

#### 4.4 Template-Parts (EDIT_PARTS / VIEW_PARTS)

```typescript
static EDIT_PARTS = (() => {
  const parts: Record<string, HandlebarsTemplatePart> = JOURNAL_BASE_SHEET.EDIT_PARTS ?? {};
  const { header, footer, ...rest } = parts;
  return {
    header,
    content: {
      template: GRAPH_SHEET_TEMPLATES.EDIT,
    },
    ...rest,
    footer,
  };
})();

static VIEW_PARTS = (() => {
  const parts: Record<string, HandlebarsTemplatePart> = JOURNAL_BASE_SHEET.VIEW_PARTS ?? {};
  return {
    ...parts,
    content: {
      template: GRAPH_SHEET_TEMPLATES.VIEW,
    },
  };
})();
```

**Erklärung:**
- Definiert die Handlebars-Templates für Edit- und View-Modus
- `GRAPH_SHEET_TEMPLATES`: Pfade zu den Template-Dateien

#### 4.5 Template-Pfade

```typescript
const GRAPH_SHEET_TEMPLATES = {
  EDIT: "modules/relationship-app/templates/journal-entry-relationship-graph-edit-part.hbs",
  VIEW: "modules/relationship-app/templates/journal-entry-relationship-graph-view-part.hbs",
} as const;
```

**Anpassung:** Pfade müssen auf `modules/fvtt_relationship_app_module/templates/...` angepasst werden

#### 4.6 Lifecycle-Methoden

- `_prepareContext()`: Vorbereitung des Render-Kontexts
- `_onRender()`: Wird beim Rendern aufgerufen (Svelte-Komponente mounten)
- `_onClose()`: Cleanup beim Schließen (Svelte-Komponente unmounten)

### Anpassungen für aktuelles Projekt

1. **Sheet-Type:** `"fvtt_relationship_app_module.relationship_app_graph"`
2. **Template-Pfade:** `"modules/fvtt_relationship_app_module/templates/..."`
3. **CSS-Klassen:** Anpassung an bestehende Naming-Conventions
4. **Service-Integration:** Anpassung an DI-Container/Service-Architektur

---

## 5. DataModel-Klasse

### Vorgängerprojekt (`relationship-app`)

**Datei:** `src/models/RelationsShipGraphModel.ts`

```typescript
export class RelationshipGraphModel extends foundry.abstract.TypeDataModel<any, any, any, any> {
  static override defineSchema() {
    return {
      version: new fields.NumberField({
        required: true,
        initial: 1,
        min: 1,
        integer: true,
      }),
      nodes: new fields.ObjectField({
        required: true,
        initial: {},
      }),
      edges: new fields.ObjectField({
        required: true,
        initial: {},
      }),
      policy: new fields.ObjectField({
        required: true,
        initial: {},
      }),
    };
  }
}
```

**Erklärung:**
- Erweitert `foundry.abstract.TypeDataModel`
- Definiert das Daten-Schema für den Page-Type
- Wird automatisch verwendet, wenn eine JournalEntryPage mit diesem Type erstellt wird

### Anpassungen für aktuelles Projekt

1. **Klassenname:** Beibehaltung oder Anpassung an Naming-Conventions
2. **Schema:** Abhängig von den Anforderungen
3. **Location:** Vermutlich `src/infrastructure/adapters/foundry/models/` oder ähnlich

---

## 6. Integration in Bootstrap/Initialisierung

### Vorgängerprojekt (`relationship-app`)

Die `RegistrationService.registerAll()` wird vermutlich im `init`-Hook aufgerufen.

**Typischer Ablauf:**
```typescript
Hooks.once("init", async () => {
  const registrationService = // ... resolve from DI
  await registrationService.registerAll();
});
```

### Aktuelles Projekt

**Zu prüfen:**
1. Wo wird die Initialisierung durchgeführt?
2. Gibt es bereits einen Registration-Service oder ähnliches?
3. Wie werden andere Foundry-Integrationen (Hooks, Settings, etc.) registriert?

**Mögliche Integrationspunkte:**
- Bootstrap-Datei
- Init-Hook-Handler
- Framework-Config-Module (analog zu `foundry-services.config.ts`)

---

## 7. Checkliste für Implementierung

### Konstanten
- [ ] Sheet-Type-Konstante in `app-constants.ts` hinzufügen
- [ ] MODULE_ID prüfen (bereits vorhanden)
- [ ] MODULE_METADATA_KEY prüfen (falls benötigt)

### Lokalisierung
- [ ] Lokalisierungs-Keys in `lang/de.json` prüfen (bereits vorhanden ✅)
- [ ] Englische Übersetzung in `lang/en.json` hinzufügen (falls nicht vorhanden)

### RegistrationService
- [ ] Service erstellen oder erweitern
- [ ] `registerSheet()` implementieren
- [ ] `registerModel()` implementieren
- [ ] `registerMetadata()` implementieren (falls benötigt)
- [ ] Logger/Notification-Integration
- [ ] Error-Handler-Integration

### JournalEntryPageSheet-Klasse
- [ ] Sheet-Klasse erstellen
- [ ] Template-Parts definieren (EDIT_PARTS/VIEW_PARTS)
- [ ] Template-Dateien erstellen (.hbs)
- [ ] DEFAULT_OPTIONS konfigurieren
- [ ] Lifecycle-Methoden implementieren
- [ ] Service-Integration (falls Svelte-Komponente verwendet wird)

### DataModel
- [ ] Model-Klasse erstellen
- [ ] Schema definieren
- [ ] TypeScript-Typen prüfen

### Integration
- [ ] RegistrationService in Bootstrap/Init integrieren
- [ ] Hooks prüfen (init/ready)
- [ ] Abhängigkeiten prüfen (DI-Container)

### Testing
- [ ] Sheet-Registrierung testen
- [ ] Model-Registrierung testen
- [ ] Template-Rendering testen
- [ ] Lokalisierung testen

---

## 8. Wichtige Unterschiede zwischen Vorgänger- und aktuellem Projekt

### Vorgängerprojekt (`relationship-app`)
- Einfache Service-Architektur
- Direkte Verwendung von `game?.i18n`, `game?.settings`
- Eigenes Logger-System (`FoundryLogger`)
- Eigenes Error-Handler-System

### Aktuelles Projekt (`fvtt_relationship_app_module`)
- Komplexere DI-Container-Architektur
- Abstrakte Ports/Adapters für Foundry-API
- Notification-System statt direktem Logger
- Framework-basierte Service-Registrierung
- Domain-Driven-Design-Struktur

**Konsequenz:**
Die Registrierung muss an die bestehende Architektur angepasst werden. Vermutlich:
- Verwendung von Foundry-Ports/Adapters statt direkter `game`-Zugriffe
- Integration in Framework-Config-Module
- Verwendung des Notification-Systems
- Eventuell eigener Registrar-Service

---

## 9. Referenzen

### Vorgängerprojekt
- `src/services/RegistrationService.ts` - Hauptregistrierung
- `src/applications/JournalEntryPageRelationshipGraphSheet.ts` - Sheet-Implementierung
- `src/models/RelationsShipGraphModel.ts` - DataModel
- `src/constants.ts` - Konstanten
- `lang/de.json` - Lokalisierung

### Aktuelles Projekt
- `src/application/constants/app-constants.ts` - Konstanten
- `lang/de.json` - Lokalisierung
- `module.json` - Document-Type-Definition
- `src/framework/config/modules/` - Framework-Config-Module (Referenz für Integration)
