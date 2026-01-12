# Tiefenanalyse: UI-Architektur & Sheets - Strategische Entscheidungen

**Status:** Diskussionsdokument
**Datum:** 2026-01-11
**Kontext:** Langfristige Projektausrichtung - Entscheidungen mit langfristigen Konsequenzen

---

## Einleitung

Diese Analyse untersucht tiefgreifend die UI-Architektur-Strategie für das Relationship Graph Modul. Während die JournalEntryPageSheet-Integration bereits analysiert wurde, fehlt noch eine umfassende Betrachtung der UI-Strategie für Cytoscape-Integration, Form-UI (Node-Sheet) und das Window-System.

**Wichtige Überlegung:** Die UI-Architektur prägt die User-Experience und Entwickler-Erfahrung langfristig. Entscheidungen hier haben Konsequenzen für Wartbarkeit, Erweiterbarkeit und Performance.

---

## Aktuelle Situation

### Was ist bereits implementiert/entschieden?

**JournalEntryPageSheet:**
- ✅ Sheet-Integration analysiert (siehe `journal-entry-page-sheet-registration-analyse.md`)
- ✅ Handlebars-basierte Templates
- ✅ Svelte-Komponenten-Integration geplant

**Window-System (neu):**
- ✅ Window-Definition-Interface vorhanden
- ✅ Window-Controller-System
- ✅ Window-Registry
- ✅ Render-Engine (Svelte-basiert)
- ✅ Erweitert ApplicationV2 (FoundryApplicationWrapper)
- ⚠️ **Erweiterung nötig:** Mixin/Extension-Mechanismus, um Sheets mit Window-System-Features zu erweitern

**Cytoscape (Vorgängerprojekt):**
- ✅ Cytoscape wird im Vorgängerprojekt verwendet
- ✅ Graph-Visualisierung mit Cytoscape
- ✅ Sheets erben direkt von JournalEntryPageHandlebarsSheet
- ⚠️ Noch nicht im neuen Projekt integriert

**Form-UI:**
- ⚠️ Node-Sheet/Form-UI noch nicht implementiert
- ⚠️ Keine klare Strategie definiert

**Architektur-Überlegung (neu):**
- ✅ **Foundry-Vererbungshierarchie (verifiziert via API-Dokumentation):**
  - `ApplicationV2` (Base)
  - → `JournalEntryPageSheet` (erweitert ApplicationV2)
  - → `JournalEntryPageHandlebarsSheet` (erweitert JournalEntryPageSheet)
- ✅ **Window-System:** Erweitert ApplicationV2 (FoundryApplicationWrapper)
- ✅ **Vorgängerprojekt:** Erweitert JournalEntryPageHandlebarsSheet direkt
- 💡 **Frage:** Können wir das Window-System so adaptieren, dass es auch beliebige Sheets erweitern kann (wie ein Mixin/Extension)?
- 💡 **Ansatz:** Window-System als Erweiterung/Mixin für Sheets, um Window-System-Features (Methoden/Features/Funktionen) zu Sheets hinzuzufügen
- 💡 Sheets bleiben Sheets (erben von JournalEntryPageHandlebarsSheet), werden aber durch Window-System erweitert (Komposition statt Integration)
- 📖 **Referenz:** [Foundry API - Journal Entry Page](https://foundryvtt.com/api/#journal-entry-page)

**Code-Referenzen:**
- `src/domain/windows/` - Window-System Domain
- `src/application/windows/` - Window-System Application
- `src/infrastructure/windows/` - Window-System Infrastructure
- `relationship-app/src/svelte/RelationshipGraphView.svelte` - Vorgänger-Implementierung

### Was funktioniert gut/schlecht?

**Gut:**
- ✅ Window-System ist gut strukturiert (Clean Architecture)
- ✅ Svelte als Render-Engine ist moderne Wahl
- ✅ Sheet-Integration ist analysiert

**Schlecht:**
- ⚠️ Cytoscape-Integration noch nicht im neuen Projekt
- ⚠️ Keine klare Strategie für Graph-Editor-UI
- ⚠️ Form-UI/Node-Sheet noch nicht definiert
- ⚠️ Keine Strategie für UI-Erweiterbarkeit

---

## Optionen & Alternativen

### Ansatz 1: Cytoscape im Window-System + Window-System erweitert Sheets ✅ EMPFOHLEN

#### Vollständige Beschreibung

**Prinzip:** Cytoscape wird als Svelte-Komponente im Window-System integriert. Window-System wird so adaptiert, dass es auch Sheets erweitern kann (wie ein Mixin/Extension).

**Architektur-Überlegung:**
- **Foundry-Vererbungshierarchie (verifiziert):**
  - `ApplicationV2` ← `JournalEntryPageSheet` ← `JournalEntryPageHandlebarsSheet`
- Window-System erweitert ApplicationV2 (FoundryApplicationWrapper)
- **Neuer Ansatz:** Bridge-Mixin erweitert Sheets mit Window-System + DI-Services
  - Mixin erstellt Bridge zwischen Foundry-Lebenszyklus und unserem DI-Container
  - Sheets werden von Foundry instanziiert, können aber DI-Services nutzen (via Mixin)
  - Window-System-Features werden ebenfalls über Mixin hinzugefügt
- Sheets bleiben Sheets (erben von JournalEntryPageHandlebarsSheet), werden aber durch Bridge-Mixin erweitert
- Cytoscape-Integration erfolgt dann über Window-System (für Windows UND für erweiterte Sheets)
- 📖 **Referenz:** [Foundry API - Journal Entry Page](https://foundryvtt.com/api/#journal-entry-page)

**Implementation-Details (konzeptionell):**

**Ansatz 1A: Bridge-Mixin (Window-System + DI-Services) ✅ EMPFOHLEN**

**Konzept:** Mixin erstellt eine Bridge zwischen Foundry-Lebenszyklus und unserem DI-Container

```typescript
// ✅ WICHTIG: Sheets wie externe Komponenten behandeln → Public API verwenden
// Sheet wird von Foundry instanziiert → wie Drittsoftware → über module.api zugreifen

import type { ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import type { Result } from "@/domain/types/result";
import type { ContainerError } from "@/infrastructure/di/interfaces";
import type { ModuleApi } from "@/framework/core/api/module-api";
import { MODULE_METADATA } from "@/application/constants/app-constants";

// Bridge-Mixin: Verbindet Foundry-Klasse mit Public API + Window-System
function WindowSystemBridgeMixin<T extends typeof JournalEntryPageHandlebarsSheet>(
  BaseSheet: T,
  windowDefinition: WindowDefinition,
  moduleId: string = MODULE_METADATA.ID // z.B. "fvtt_relationship_app_module"
) {
  return class extends BaseSheet {
    // DI-Service-Zugriff über Public API (wie externe Komponenten)
    private get api(): ModuleApi {
      const mod = game.modules.get(moduleId);
      if (!mod?.api) throw new Error(`Module API not available: ${moduleId}`);
      return mod.api;
    }

    // Helper: Service über Public API auflösen (exception-based)
    private resolveService<TService>(token: ApiSafeToken<TService>): TService {
      return this.api.resolve(token); // Public API resolve() - type-safe über ApiSafeToken
    }

    // Alternative: Result-Pattern für explizite Fehlerbehandlung
    private resolveServiceWithError<TService>(
      token: ApiSafeToken<TService>
    ): Result<TService, ContainerError> {
      return this.api.resolveWithError(token); // Public API resolveWithError() - Result-Pattern
    }

    // Window-System-Features
    private windowController?: IWindowController;

    // Window-System-Methoden hinzufügen
    // _renderFrame überschreiben für Svelte-Rendering
    // etc.

    // Lifecycle-Integration: DI-Scope-Management
    async _onRender() {
      const scope = this._pageScope || `page-${this.document.id}`;
      this.ensureScope(scope);
      // Window-System + DI-Services verfügbar
      await super._onRender();
    }

    async _onClose() {
      // Scope-Cleanup
      disposeScopedServices(this._pageScope);
      await super._onClose();
    }
  };
}

// Verwendung: Zwei Sheets werden mit Bridge-Mixin erweitert

// Graph-Sheet: Für Graph-Visualisierung (Cytoscape)
const GraphSheetBase = WindowSystemBridgeMixin(
  JournalEntryPageHandlebarsSheet,
  {
    id: "relationship-graph-sheet",
    renderer: "svelte",
    component: GraphSheetComponent, // Cytoscape-integriert
    // ...
  },
  "fvtt_relationship_app_module" // Module-ID für API-Zugriff
);

// Node-Sheet: Für Node-Editing (Form-UI)
const NodeSheetBase = WindowSystemBridgeMixin(
  JournalEntryPageHandlebarsSheet,
  {
    id: "relationship-node-sheet",
    renderer: "svelte",
    component: NodeSheetComponent, // Form-UI für Node-Editing
    // ...
  },
  "fvtt_relationship_app_module" // Module-ID für API-Zugriff
);

// Sheet-Klasse definieren (erweitert den gemixten Base)
export default class JournalEntryPageRelationshipGraphSheet extends GraphSheetBase {
  static override DEFAULT_OPTIONS = {
    // ... Sheet-spezifische Optionen
  };

  // Sheet kann jetzt Services über Public API nutzen (wie externe Komponenten)
  private get graphService() {
    // Service über Public API auflösen (type-safe über ApiSafeToken)
    return this.resolveService(this.api.tokens.graphServiceToken);
  }

  private get notificationService() {
    // Beispiel: NotificationService über Public API
    return this.resolveService(this.api.tokens.notificationCenterToken);
  }

  // Window-System-Features auch verfügbar (via Mixin)
  // ...
}
```

**✅ Wichtig: Sheets wie externe Komponenten behandeln → Public API verwenden**

**Wie kommt der Container in den Sheet?**
- **Problem:** Sheet wird von Foundry instanziiert, nicht von uns → keine DI im Konstruktor möglich
- **Lösung:** Public API (`module.api`) verwenden (wie externe Komponenten/Drittsoftware)
  1. Module-API wird im `init-Hook` über `ModuleApiInitializer.expose()` an `game.modules.get(MODULE_ID).api` angehängt
  2. Mixin fügt `api` Getter hinzu, der auf `game.modules.get(moduleId).api` zugreift
  3. Sheet ruft `this.resolveService(this.api.tokens.serviceToken)` auf → Public API resolve()
  4. Type-safe über `ApiSafeToken` (nur explizit freigegebene Services verfügbar)
  5. Saubere Trennung: Interne Code → DI-Container, Edge-Klassen (Sheets) → Public API

**Vorteile dieser Bridge-Architektur:**
- ✅ **Foundry-kompatibel:** Sheet wird von Foundry instanziiert und verwaltet
- ✅ **Public API:** Services über `module.api` abrufen (wie externe Komponenten)
- ✅ **Type-Safety:** Nur `ApiSafeToken` verfügbar (explizit freigegebene Services)
- ✅ **Saubere Architektur:** Trennung zwischen internen (DI-Container) und externen (Public API) Zugriffen
- ✅ **Window-System-Integration:** Window-System-Features sind verfügbar
- ✅ **Erweiterbarkeit:** Sheets behandelt wie Drittsoftware → klare API-Grenzen

**Ansatz 1B: Composition (Window-System als Komponente/Service)**

```typescript
// Window-System als Service/Komponente
class WindowSystemFeature {
  constructor(
    private windowController: IWindowController,
    private windowDefinition: WindowDefinition
  ) {}

  render(container: HTMLElement) { /* ... */ }
  close() { /* ... */ }
  // Window-System-Methoden
}

// Sheet verwendet Window-System-Feature via Composition
export default class JournalEntryPageRelationshipGraphSheet extends JournalEntryPageHandlebarsSheet {
  private windowSystem?: WindowSystemFeature;

  async _onRender() {
    // Window-System-Feature initialisieren
    this.windowSystem = new WindowSystemFeature(
      windowController,
      windowDefinition
    );
    this.windowSystem.render(this.element);
  }

  async _onClose() {
    this.windowSystem?.close();
  }
}
```

**Ansatz 1C: Helper-Funktionen / Utility-Mixin**

```typescript
// Window-System-Features als Helper-Funktionen
function applyWindowSystemFeatures(
  sheet: JournalEntryPageHandlebarsSheet,
  windowDefinition: WindowDefinition
) {
  // Window-System-Features werden zur Instanz hinzugefügt
  (sheet as any).windowController = createWindowController(windowDefinition);
  (sheet as any).renderSvelte = (component) => { /* ... */ };
  // etc.
}

// Sheet verwendet Helper-Funktionen
export default class JournalEntryPageRelationshipGraphSheet extends JournalEntryPageHandlebarsSheet {
  async _onRender() {
    applyWindowSystemFeatures(this, windowDefinition);
    // Window-System-Features sind jetzt verfügbar
  }
}
```

**Registrierung (für alle Ansätze identisch):**
```typescript
// Registrierung im init-Hook (via DocumentSheetConfig.registerSheet)
DocumentSheetConfig.registerSheet(
  JournalEntryPage,
  "fvtt_relationship_app_module",
  JournalEntryPageRelationshipGraphSheet,
  {
    types: ["fvtt_relationship_app_module.relationship_app_graph"],
    makeDefault: true,
    label: () => { /* ... */ },
  }
);
```

**Alternativ: Window-Definition für Graph-Editor (als normales Window)**
```typescript
const graphEditorWindow: WindowDefinition = {
  id: "relationship-graph-editor",
  renderer: "svelte",
  component: GraphEditorComponent, // Cytoscape-integriert
  // ...
};
```

**Svelte-Komponente mit Cytoscape (funktioniert für beide)**
```svelte
<script>
  import Cytoscape from 'cytoscape';
  // Cytoscape-Integration
</script>
```

#### Detaillierte Trade-offs

**Vergleich der Ansätze:**

| Ansatz | Typ-Sicherheit | Wartbarkeit | Flexibilität | Komplexität |
|--------|----------------|-------------|--------------|-------------|
| **1A: Mixin-Pattern** ✅ | Hoch | Hoch | Hoch | Mittel |
| **1B: Composition** | Mittel | Mittel | Hoch | Niedrig |
| **1C: Helper-Funktionen** | Niedrig | Niedrig | Mittel | Niedrig |

**Empfehlung: Mixin-Pattern (1A)**

**Vorteile (Bridge-Mixin-Pattern):**
- ✅ **SOLID-konform:** Sheets bleiben Sheets, Mixin erweitert sie (Komposition)
- ✅ **Foundry-kompatibel:** Sheet wird von Foundry instanziiert und verwaltet
- ✅ **DI-Integration:** Services können aus DI-Container abgerufen werden (Bridge zu DI-Container)
- ✅ **Window-System-Integration:** Window-System-Features sind verfügbar
- ✅ **Scope-Management:** Automatisches Scope-Management für DI-Services
- ✅ **Bridge-Pattern:** Verbindet Foundry-Lebenszyklus mit unserem DI-Container
- ✅ **Flexibel:** Kann beliebige Sheets erweitern (nicht nur JournalEntryPageSheet)
- ✅ **Wartbar:** Einheitliche Features (Window-System + DI) für alle Sheets
- ✅ **Erweiterbar:** Extension-Points, Svelte-Rendering funktionieren auch für Sheets
- ✅ **Type-safe:** TypeScript-Integration (Mixin-Pattern)
- ✅ **Konsistent:** Cytoscape-Integration über Window-System (für Windows UND erweiterte Sheets)
- ✅ **Foundry-konform:** Folgt etabliertem Pattern (HandlebarsApplicationMixin)

**Vorteile (Composition - 1B):**
- ✅ **Einfacher:** Keine Mixin-Logik nötig
- ✅ **Explizit:** Window-System-Features sind klar sichtbar
- ✅ **Testbar:** WindowSystemFeature kann separat getestet werden

**Vorteile (Helper-Funktionen - 1C):**
- ✅ **Einfachste Implementierung:** Keine zusätzlichen Klassen
- ✅ **Direkt:** Features werden zur Instanz hinzugefügt

**Nachteile (Mixin-Pattern):**
- ❌ **Komplexität:** Cytoscape-Integration in Svelte kann komplex sein
- ❌ **Architektur-Erweiterung:** Window-System muss Mixin/Extension-Mechanismus unterstützen
- ❌ **Performance:** Möglicherweise Overhead durch Window-System (aber akzeptabel)
- ❌ **Abhängigkeit:** Cytoscape ist externe Dependency

**Nachteile (Composition - 1B):**
- ❌ **Weniger Type-safe:** Keine automatische TypeScript-Unterstützung
- ❌ **Expliziter Code:** Mehr Boilerplate (Initialisierung, Cleanup)
- ❌ **Inkonsistent:** Abweichend vom Foundry-Pattern (Mixin)

**Nachteile (Helper-Funktionen - 1C):**
- ❌ **Nicht Type-safe:** Type-Assertions nötig
- ❌ **Fehleranfällig:** Runtime-Fehler statt Compile-Time-Checks
- ❌ **Schlechte Wartbarkeit:** Features nicht klar strukturiert

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- Einheitliche UI-Architektur
- Cytoscape gut integriert
- Erweiterungen möglich

**Nach 5 Jahren:**
- Stabile Architektur
- Aber möglicherweise veraltete Cytoscape-Version
- Migration zu neuer Cytoscape-Version nötig

#### Risiken & Mitigation

**Risiko 1: Cytoscape-Integration komplex**
- **Wahrscheinlichkeit:** Mittel
- **Impact:** Mittel
- **Mitigation:** Wrapper-Komponente, Dokumentation, Beispiele

---

### Ansatz 2: Cytoscape direkt in JournalEntryPageSheet (ohne Window-System)

#### Vollständige Beschreibung

**Prinzip:** Cytoscape wird direkt in JournalEntryPageSheet integriert, ohne Window-System. Sheets bleiben separat von Window-System.

**Implementation-Details:**

```typescript
// Direkt im Sheet (wie im Vorgängerprojekt)
class JournalEntryPageRelationshipGraphSheet extends JournalEntryPageHandlebarsSheet {
  _onRender() {
    // Cytoscape direkt initialisieren
    const cy = cytoscape({
      container: this.element,
      // ...
    });
  }
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Einfach:** Direkte Integration (wie im Vorgängerprojekt)
- ✅ **Performance:** Weniger Overhead
- ✅ **Kontrolle:** Volle Kontrolle über Cytoscape
- ✅ **Bekannt:** Vorgängerprojekt nutzt dieses Pattern

**Nachteile:**
- ❌ **Inkonsistent:** Zwei parallele Systeme (Window-System + Sheets)
- ❌ **Wartbarkeit:** Zwei verschiedene UI-Patterns müssen gewartet werden
- ❌ **Erweiterbarkeit:** Schwerer zu erweitern (keine einheitliche Extension-Points)
- ❌ **Architektur:** Verpasste Chance zur Vereinheitlichung

---

### Ansatz 3: Hybrid (Sheet für View, Window für Edit)

#### Vollständige Beschreibung

**Prinzip:** JournalEntryPageSheet für View-Modus (read-only), Window-System für Edit-Modus (interaktiv).

**Hinweis:** Mit vereinheitlichter Architektur (Sheets als spezialisierte Windows) würde dieser Ansatz bedeuten: View-Sheet-Window vs. Edit-Window (beide über Window-System, aber unterschiedliche Modi).

**Implementation-Details:**

```typescript
// View: Sheet-Window (read-only, über Window-System mit JournalEntryPageHandlebarsSheet-Basis)
Sheet-Window -> Simple Graph View

// Edit: Window (interactive, über Window-System)
Window -> Graph Editor (Cytoscape)
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Flexibel:** Bestes Pattern für jeden Use-Case
- ✅ **Performance:** View optimiert, Edit vollständig
- ✅ **Konsistent:** Beide über Window-System (wenn vereinheitlicht)

**Nachteile:**
- ❌ **Komplexität:** Zwei verschiedene Modi/Spezialisierungen
- ❌ **Konsistenz:** User muss zwischen View- und Edit-Modus wechseln
- ❌ **Redundanz:** Mögliche Code-Duplikation zwischen View und Edit

---

## Form-UI / Node-Sheet Strategie

**✅ Entscheidung: Node-Sheet als JournalEntryPageSheet (über WindowSystemBridgeMixin)**

**Prinzip:** Node-Editor als JournalEntryPageSheet (wie Graph-Sheet)

**Architektur:**
- Zwei JournalEntryPageSheets: Graph-Sheet und Node-Sheet
- Beide verwenden WindowSystemBridgeMixin (Window-System + Public API)
- Graph-Sheet: Cytoscape-Integration für Graph-Visualisierung
- Node-Sheet: Form-UI für Node-Editing

**Vorteile:**
- Konsistent: Beide sind Sheets (einheitliche Architektur)
- Foundry-kompatibel: Beide als JournalEntryPageSheet registriert
- Erweiterbar: Beide nutzen WindowSystemBridgeMixin
- Type-Safe: Beide nutzen Public API für Services

**Nachteile:**
- Zwei verschiedene Sheets (aber gewollt, da verschiedene Funktionen)

### Optionen (nicht gewählt):

**Option A: Window-basiert**
- ❌ Nicht gewählt - Form-UI ist Sheet, kein Window

**Option B: Dialog/Modal**
- ❌ Nicht gewählt - Form-UI ist Sheet für bessere Integration

**Option C: Inline-Edit**
- ❌ Nicht gewählt - Form-UI als separates Sheet für bessere UX

---

## Offene Fragen & Entscheidungspunkte

### 1. Cytoscape-Integration

**Frage:** Wie soll Cytoscape integriert werden?

**Architektur-Überlegung (neu):**
- **Foundry-Vererbungshierarchie (verifiziert via API-Dokumentation):**
  - `ApplicationV2` ← `JournalEntryPageSheet` ← `JournalEntryPageHandlebarsSheet`
- **Frage:** Können wir das Window-System so adaptieren, dass es auch beliebige Sheets erweitern kann (wie ein Mixin/Extension)?
- **Ansatz:** WindowSystemBridgeMixin erstellen (ähnlich HandlebarsApplicationMixin)
  - Mixin-Funktion erstellt Bridge zwischen Foundry-Lebenszyklus und Public API
  - **Service-Zugriff:** Public API (`game.modules.get(MODULE_ID).api`) verwenden
  - Sheets wie externe Komponenten behandeln → über Public API zugreifen (nicht internen Container)
  - Fügt API-Zugriff hinzu (via `api` Getter, greift auf `module.api` zu)
  - Services über `api.resolve(api.tokens.serviceToken)` auflösen (type-safe über `ApiSafeToken`)
  - Fügt Window-System-Features hinzu (Window-Controller, Svelte-Rendering)
  - Sheet wird mit Bridge-Mixin erweitert: `const ExtendedSheet = WindowSystemBridgeMixin(JournalEntryPageHandlebarsSheet, windowDef, MODULE_ID)`
  - Sheet-Klasse erweitert dann den gemixten Base: `class GraphSheet extends ExtendedSheet`
  - Sheet kann Services nutzen (via Mixin-Methoden → Public API) und wird trotzdem von Foundry verwaltet
  - **Saubere Architektur:** Trennung zwischen internen (DI-Container) und externen (Public API) Zugriffen
  - Registrierung via `DocumentSheetConfig.registerSheet()` im init-Hook (wie im Vorgängerprojekt)
- Sheets bleiben Sheets (erben von JournalEntryPageHandlebarsSheet), werden aber durch Bridge-Mixin erweitert (Komposition)
- Cytoscape-Integration erfolgt dann über Window-System (für Windows UND für erweiterte Sheets)
- 📖 **Referenz:** [Foundry API - Journal Entry Page](https://foundryvtt.com/api/#journal-entry-page)
- 📖 **Vorgängerprojekt:** `relationship-app/src/core/edge/appContext.ts` - use() Funktion für DI-Zugriff

**Optionen:**
- A: Window-System erweitert Sheets (Mixin-Pattern - Sheets bleiben Sheets) ✅ EMPFOHLEN
  - Graph-Sheet: JournalEntryPageSheet für Graph-Visualisierung (Cytoscape)
  - Node-Sheet: JournalEntryPageSheet für Node-Editing (Form-UI)
  - Beide verwenden WindowSystemBridgeMixin
- B: Direkt im Sheet (getrennt von Window-System) ❌ Nicht empfohlen (zwei parallele Systeme)
- C: Hybrid (Sheet für View, Window für Edit) ❌ Nicht gewählt - beide sind Sheets

**Optionen für Implementation:**
- A1: Bridge-Mixin (Window-System + Public API) ✅ EMPFOHLEN
  - Mixin erstellt Bridge zwischen Foundry-Lebenszyklus und Public API
  - Sheet wird von Foundry verwaltet, kann aber Services über Public API nutzen
  - Sheets wie externe Komponenten behandeln → über `module.api` zugreifen
- A2: Composition (Window-System als Komponente/Service)
- A3: Helper-Funktionen (Features zur Instanz hinzufügen)

**Entscheidungspunkt:** Strategie A1 - Bridge-Mixin, der Window-System + Public API-Integration bietet?

---

### 2. Form-UI / Node-Sheet

**Frage:** Wie sollen Node-Editing-Forms implementiert werden?

**Optionen:**
- A: Window-basiert
- B: Dialog/Modal
- C: Inline-Edit

**Entscheidungspunkt:** Welche Strategie?

---

### 3. UI-Erweiterbarkeit

**Frage:** Wie sollen UI-Erweiterungen (Plugins) integriert werden?

**Optionen:**
- A: Window-System Extension-Points (Registry-basiert)
- B: Plugin-Registry
- C: API-Wrapper/Proxy-Pattern (interessanter Ansatz)
- D: Registry-Methoden in API (Alternative zu Proxy-Pattern) ⭐ NEU
- E: Beides (Extension-Points + Registry-Methoden)

**Alternative Ansatz: Registry-Methoden in API** ⭐

**Prinzip:** Wir exposieren Registry-Methoden in der API, die es externen Modulen ermöglichen, Services zu registrieren/ersetzen. Die resolve-Funktionen greifen auf denselben Container zu → neue Services werden automatisch verfügbar.

**Konzept:**
```typescript
// In ModuleApi-Interface erweitern:
interface ModuleApi {
  // ... bestehende Methoden

  // Registry-Methoden für Service-Erweiterungen
  registerServiceOverride<TService>(
    token: ApiSafeToken<TService>,
    factory: () => TService
  ): void;

  registerServiceExtension<TService>(
    token: ApiSafeToken<TService>,
    wrapper: (original: TService) => TService
  ): void;
}

// Externes Modul nutzt Registry:
Hooks.once('ready', () => {
  const api = game.modules.get('fvtt_relationship_app_module').api;

  // Service ersetzen
  api.registerServiceOverride(api.tokens.notificationCenterToken, () => {
    return new CustomNotificationService(); // Ersetzt unseren Service
  });

  // Service wrappen/erweitern
  api.registerServiceExtension(api.tokens.graphServiceToken, (original) => {
    return new Proxy(original, {
      // Wrapper-Logik
    });
  });
});
```

**Vorteile:**
- ✅ **Kontrolliert:** Explizite Registry-Methoden (nicht versteckt wie Proxy)
- ✅ **Type-Safe:** TypeScript-Type-Safety erhalten
- ✅ **Automatisch:** Alle Komponenten nutzen neue Services (resolve greift auf Container zu)
- ✅ **Bewusst:** Externe Module müssen explizit registrieren
- ✅ **Debuggbar:** Klarer als Proxy-Pattern
- ✅ **Komponenten werden austauschbar:** Mixin, Sheets, Windows nutzen automatisch neue Services

**Nachteile:**
- ❌ **Container-Unterstützung nötig:** Container muss dynamische Registrierung unterstützen
- ❌ **API-Erweiterung:** ModuleApi-Interface muss erweitert werden
- ❌ **Implementierung:** Registry-Logik muss implementiert werden (Service-Override/Extension)

**Technische Anforderungen:**
- ✅ **ServiceWrapperFactory bereits vorhanden:** Wrappt Services NUR für API-Auflösungen
- ✅ **Trennung intern/extern möglich:**
  - Intern: `container.resolve(token)` → originaler Service aus Container
  - Extern: `api.resolve(token)` → `container.resolve()` → `wrapSensitiveService()` → gewrappter/ersetzter Service
- ⚠️ **Service-Override-Registry nötig:** Erweitere ServiceWrapperFactory um Override-Registry
- ❌ **Container selbst:** Unterstützt KEINE dynamische Registrierung nach Validation (Container ist "frozen")
- ✅ **Lösung:** Override-Registry in ServiceWrapperFactory, die NUR für API-Auflösungen greift

**Konkrete Implementierung:**
```typescript
// ServiceWrapperFactory erweitern:
class ServiceWrapperFactory {
  private overrideRegistry: Map<symbol, () => unknown> = new Map();

  registerServiceOverride<TService>(
    token: ApiSafeToken<TService>,
    factory: () => TService
  ): void {
    this.overrideRegistry.set(token, factory);
  }

  wrapSensitiveService<TServiceType>(...): TServiceType {
    // 1. Prüfe Override-Registry (NUR für API-Auflösungen!)
    if (this.overrideRegistry.has(token)) {
      const overrideFactory = this.overrideRegistry.get(token)!;
      return overrideFactory() as TServiceType; // Override-Service
    }

    // 2. Normales Wrapping (wie bisher)
    const strategy = this.strategyRegistry.findStrategy(token, wellKnownTokens);
    if (strategy) {
      return strategy.wrap(service, token, wellKnownTokens);
    }
    return service;
  }
}

// Ergebnis:
// - Intern: container.resolve() → originaler NotificationCenter ✅
// - Extern: api.resolve() → Override-Registry prüfen → CustomNotificationCenter ✅
// - Nur API-exposed Services können überschrieben werden ✅
```

**Interessanter Ansatz: API-Wrapper/Proxy-Pattern**

**Prinzip:** Da das Mixin über `game.modules.get(MODULE_ID).api` zugreift, könnten externe Module unsere API wrappen/ersetzen.

**Konzept:**
```typescript
// Externes Modul wrappt unsere API
Hooks.once('ready', () => {
  const mod = game.modules.get('fvtt_relationship_app_module');
  const originalApi = mod.api;

  // Proxy/Wrapper um unsere API
  mod.api = new Proxy(originalApi, {
    get(target, prop) {
      if (prop === 'resolve') {
        return (token) => {
          // Intercept Service-Resolution
          const service = target.resolve(token);
          return wrapService(service); // Externes Modul wrappt Service
        };
      }
      return target[prop];
    }
  });
});
```

**Vorteile:**
- ✅ **Sehr flexibel:** Alle Komponenten nutzen gewrappte API automatisch
- ✅ **Service-Interception:** Externe Module können Services wrappen/intercepten
- ✅ **Feature-Toggles:** Services können dynamisch ausgetauscht werden
- ✅ **Mocking:** Für Tests möglich
- ✅ **Logging/Monitoring:** Alle Service-Aufrufe können geloggt werden
- ✅ **Komponenten werden austauschbar:** Mixin, Sheets, Windows nutzen automatisch gewrappte API

**Nachteile:**
- ❌ **Hook-Reihenfolge:** Abhängig von Load-Reihenfolge (muss nach unserer API-Exposition sein)
- ❌ **Type-Safety:** Proxy kann TypeScript-Type-Safety umgehen
- ❌ **Stabilität:** Externe Module können unsere API brechen
- ❌ **Debugging:** Schwerer zu debuggen (versteckte Wrapper)

**✅ Entscheidung getroffen: Option D - Registry-Methoden in API**

**Begründung:**
- ✅ **Kontrolliert:** Explizite Registry-Methoden (nicht versteckt wie Proxy-Pattern)
- ✅ **Nur API-Exposed Services:** Override-Registry in ServiceWrapperFactory greift NUR für API-Auflösungen
- ✅ **Intern bleibt unverändert:** Interne Komponenten nutzen weiterhin originale Services aus Container
- ✅ **Type-Safe:** TypeScript-Type-Safety erhalten
- ✅ **Technisch möglich:** ServiceWrapperFactory kann um Override-Registry erweitert werden
- ✅ **Komponenten werden austauschbar:** Mixin, Sheets, Windows nutzen automatisch neue Services via API

**Implementation:**
- ServiceWrapperFactory erweitern um Service-Override-Registry
- ModuleApi-Interface erweitern um `registerServiceOverride()` und `registerServiceExtension()` Methoden
- Registry greift NUR bei API-Auflösungen (in `wrapSensitiveService()`)
- Container bleibt unverändert (keine dynamische Registrierung nötig)

---

## Empfehlung & Begründung

### Empfehlung: Window-System als Mixin/Extension für Sheets + Cytoscape-Integration

**Komponenten:**
1. **Architektur-Erweiterung:** Bridge-Mixin erstellen (Window-System + DI-Services)
   - Sheets bleiben Sheets (erben von JournalEntryPageHandlebarsSheet)
   - Bridge-Mixin erweitert Sheets mit:
     - DI-Service-Zugriff (Bridge zu DI-Container)
     - Window-System-Features (Window-Controller, Svelte-Rendering)
     - Scope-Management für DI-Services
   - Sheet wird von Foundry instanziiert, kann aber DI-Services nutzen
   - SOLID-konform: Komposition statt Integration
2. **Graph-Editor:** Window-System mit Cytoscape-Integration (als Window oder erweitertes Sheet)
3. **Node-Editor:** Window-basierte Form-UI
4. **View-Modus:** Optional als erweitertes Sheet (read-only)

**Begründung:**

**Architektur-Vorteil:**
- ✅ **SOLID-konform:** Sheets bleiben Sheets, Bridge-Mixin erweitert sie (Komposition)
- ✅ **Foundry-kompatibel:** Sheet wird von Foundry instanziiert und verwaltet
- ✅ **DI-Integration:** Services können aus DI-Container abgerufen werden (Bridge-Pattern)
- ✅ **Flexibel:** Bridge-Mixin kann beliebige Sheets erweitern (nicht nur JournalEntryPageSheet)
- ✅ **Wartbar:** Einheitliche Features (Window-System + DI) für alle Sheets
- ✅ **Erweiterbar:** Extension-Points funktionieren auch für erweiterte Sheets
- ✅ **Konsistent:** Cytoscape-Integration über Window-System (für Windows UND erweiterte Sheets)

**Für MVP:**
- ✅ Window-System ist bereits vorhanden und gut strukturiert
- ⚠️ Erweiterung nötig: Bridge-Mixin (Window-System + DI-Services) für Sheets
- ✅ Cytoscape-Integration erfolgt über Window-System (für beide Fälle)

**Für Langzeit:**
- ✅ SOLID-konforme Architektur (Sheets bleiben Sheets, werden durch Bridge-Mixin erweitert)
- ✅ Foundry-kompatible DI-Integration (Sheet wird von Foundry verwaltet, nutzt aber DI-Services)
- ✅ Erweiterbar durch API-Registry-Methoden (Service-Override für API-Exposed Services)
- ✅ Wartbar durch klare Komposition (Bridge-Mixin fügt Window-System + DI hinzu)
- ✅ Flexibel: Cytoscape kann in normalen Windows oder erweiterten Sheets verwendet werden

**Risiken:**
- ⚠️ **Architektur-Erweiterung:** Bridge-Mixin muss implementiert werden (Window-System + Public API-Integration)
- ⚠️ Cytoscape-Integration kann komplex sein (aber unabhängig von Architektur-Entscheidung)
- ⚠️ Window-System kann Overhead haben (aber akzeptabel)
- ⚠️ Performance bei großen Graphen (aber durch Cytoscape-Optimierungen handhabbar)

**Mitigation:**
- **Architektur-Erweiterung:** WindowSystemBridgeMixin implementieren (ähnlich HandlebarsApplicationMixin) ✅ EMPFOHLEN
  - Bridge-Mixin-Funktion, die BaseSheet-Klasse nimmt und erweitert zurückgibt
  - **Service-Zugriff:** Public API verwenden (`game.modules.get(MODULE_ID).api`)
  - **Sheets wie externe Komponenten:** Über Public API zugreifen (nicht internen Container)
  - Integriert API-Zugriff (via `api` Getter → `module.api`)
  - Services über `api.resolve(api.tokens.serviceToken)` auflösen (type-safe über `ApiSafeToken`)
  - Integriert Window-System-Features (Window-Controller, Svelte-Rendering)
  - Sheet wird mit Bridge-Mixin erweitert und dann in CONFIG registriert (via DocumentSheetConfig.registerSheet)
  - Sheet wird von Foundry instanziiert, kann aber Services nutzen (via Mixin-Methoden → Public API)
  - **Saubere Architektur:** Trennung zwischen internen (DI-Container) und externen (Public API) Zugriffen
  - **Alternativen:** Composition oder Helper-Funktionen möglich, aber weniger type-safe und nicht Foundry-konform
- **Cytoscape-Wrapper:** Svelte-Komponente für Cytoscape (funktioniert für Windows und erweiterte Sheets)
- **Performance-Optimierung:** Lazy Loading, Cytoscape-Optimierungen (LOD, WebGL, Filtering)
- **Dokumentation:** Architektur-Guide (Mixin-Pattern), Cytoscape-Integration-Guide

**Abweichungskriterien:**
- Wenn Mixin-Pattern zu komplex → Schrittweise Migration evaluieren
- Wenn Performance-Probleme → Cytoscape-Optimierungen priorisieren (nicht Architektur ändern)

---

## Nächste Schritte

1. **Architektur-Erweiterung:** WindowSystemBridgeMixin implementieren (ähnlich HandlebarsApplicationMixin)
   - Bridge-Mixin-Funktion erstellen, die BaseSheet-Klasse erweitert
   - **Service-Zugriff:** Public API verwenden (`game.modules.get(MODULE_ID).api`)
   - **Sheets wie externe Komponenten behandeln:** Über Public API zugreifen (nicht internen Container)
   - API-Zugriff hinzufügen (via `api` Getter → `module.api`)
   - Services über `api.resolve(api.tokens.serviceToken)` auflösen (type-safe über `ApiSafeToken`)
   - Window-System-Features hinzufügen (Window-Controller, Svelte-Rendering)
   - Sheet-Klasse mit Bridge-Mixin erweitern und via DocumentSheetConfig.registerSheet registrieren
   - Sheet kann dann Services nutzen (via Mixin-Methoden → Public API, wird trotzdem von Foundry verwaltet)
   - **Wichtig:** Keine DI im Konstruktor möglich (Foundry instanziiert), Public API wie externe Komponenten
2. **Cytoscape-Integration:** Wrapper-Komponente erstellen
3. **Graph-Sheet:** JournalEntryPageSheet für Graph-Editor (Cytoscape-Integration)
4. **Node-Sheet:** JournalEntryPageSheet für Node-Editing (Form-UI)
5. **Sheet-Registrierung:** Beide Sheets via DocumentSheetConfig.registerSheet() registrieren
6. **Performance-Tests:** Große Graphen testen
7. **Dokumentation:** UI-Architektur dokumentieren (Mixin-Pattern, zwei Sheets, Registrierung)

---

## Referenzen

- [Foundry API - Journal Entry Page](https://foundryvtt.com/api/#journal-entry-page) - Offizielle Foundry-API-Dokumentation
- [JournalEntryPageSheet-Registrierung Analyse](./journal-entry-page-sheet-registration-analyse.md)
- `src/domain/windows/` - Window-System Domain
- `src/application/windows/` - Window-System Application
- `src/framework/core/api/module-api.ts` - Public API Definition (ModuleApi, ApiSafeToken)
- `src/framework/core/api/module-api-initializer.ts` - API-Exposition an `game.modules.get(MODULE_ID).api`
- `relationship-app/src/applications/JournalEntryPageRelationshipGraphSheet.ts` - Beispiel: Sheet-Implementierung (Vorgängerprojekt - verwendet internen Zugriff)
- **✅ Neue Architektur:** Sheets verwenden Public API (`module.api`) statt internen Container
- `relationship-app/src/svelte/RelationshipGraphView.svelte` - Vorgänger-Implementierung
