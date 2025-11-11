# Foundry DI & Adapter Guidelines

## Lade-Reihenfolge & Bootstrap
- Modul-Bundle läuft vollständig, bevor Foundry `init` aufruft: Bootstrap darf Container bauen und Abhängigkeiten registrieren.
- Foundry-Globals (`game`, `Hooks`, `ui`) sind im Top-Level nur eingeschränkt nutzbar; Logik, die sie braucht, gehört in Hook-Callbacks.
- Nach erfolgreichem `configureDependencies` Hook-Registrierungen ausführen; Callbacks arbeiten dann mit vorab aufgelösten Services.

## Hooks ohne globalen Container
- Dienst-Resolver nur beim Registrieren einsetzen (`container.resolve(...)`) und Instanzen in Hook-Closures speichern.
- Globale Ablage (`globalThis.container`) vermeiden: Callbacks erhalten benötigte Services über Konstruktor/Factory oder Closure.
- Für Foundry-eigene Instanziierungen (z.B. JournalDirectory-Hook) genügt es, Services beim Registrieren zu ermitteln und in Callbacks zu referenzieren.

## Edge-Adapter für Foundry-Klassen
- Foundry konstruiert Klassen eigenständig (`new Sheet(...)`); direkte Konstruktor-Injektion ist nicht möglich.
- Adapter ermitteln Services per `resolve(...)` und übergeben sie an den Foundry-Teil:
  - Factory-Helfer (`createJournalSheetAdapter`) kapseln die Auflösung.
  - ServiceResolver-Mixin stellt `this.resolve(token)` bereit und wirkt als schlanker Service Locator.
  - Dependency-Maps/Fabric registrieren pro Anwendung passende Controller.
  - Event-Bridge: Hooks feuern Custom-Events und delegieren an Adapter-Services.
- Unicode in Fehlermeldungen vermeiden (ASCII für Konsolen-Kompatibilität).

## Mixins
- Mixins erweitern Klassen modular (Foundry nutzt dies z.B. via `HandlebarsApplicationMixin`).
- Eigenes Mixin kann `resolve`-Hilfen bereitstellen:
  ```ts
  export function ServiceResolverMixin<TBase extends Ctor>(Base: TBase) {
    return class extends Base {
      resolve<T>(token: InjectionToken<T>): T {
        return resolve(token);
      }
    };
  }
  ```
- Anwendung:
  ```ts
  class DynamicDialogApp extends ServiceResolverMixin(
    foundry.applications.api.HandlebarsApplicationMixin(
      foundry.applications.api.ApplicationV2
    )
  ) { /* ... */ }
  ```

## Svelte-Integration
- Sheets/Svelte-Komponenten brauchen definierte Schnittstellen; Services im Sheet auflösen und als Props weiterreichen.
- Props-Adapter beschränkt die UI auf notwendige Methoden/Strukturen:
  ```ts
  interface RelationshipViewProps {
    hiddenEntries: () => Promise<FoundryJournalEntry[]>;
    toggleHidden: (id: string) => Promise<void>;
    logger: Pick<Logger, "info" | "warn">;
  }

  function createRelationshipProps(container: ServiceContainer): RelationshipViewProps {
    const game = container.resolve(foundryGameToken);
    const document = container.resolve(foundryDocumentToken);
    const logger = container.resolve(loggerToken);

    return {
      hiddenEntries: () => /* ... */,
      toggleHidden: async (id) => { /* ... */ },
      logger,
    };
  }
  ```
- Änderungen im Service-Layer erfordern Anpassungen am Adapter; strukturelle Datenänderungen betreffen zusätzlich die Svelte-Komponente.

## Praktische Hinweise
- `debugger` im produktiven Code entfernen (z.B. `FoundryGamePortV13.getJournalEntries`).
- `ServiceType`-Union (`src/types/servicetypeindex.ts`) muss bei neuen Services erweitert werden – Aufwand pro Service einkalkulieren.
- DI-Scopes kopieren Registrierungen beim Erzeugen; spätere Registrierungen im Parent gelangen nicht rückwirkend in bestehende Scopes.

## Zugriff auf den Container aus Foundry-Klassen
### 1. Module-API exponieren
```ts
import { MODULE_CONSTANTS } from "@/core/constants";

Hooks.once("init", () => {
  const container = buildContainer(); // configureDependencies etc.
  const module = game.modules.get(MODULE_CONSTANTS.MODULE.ID);
  if (module) {
    module.api = {
      resolve<T>(token: InjectionToken<T>): T {
        return container.resolve(token);
      },
    };
  }
});
```
- Alle Consumers greifen über `game.modules.get("…")?.api.resolve(token)` zu.
- Die API kann weitere Helpers (z.B. `logger`, `services`) bündeln.

### 2. Helper-Funktion exportieren
```ts
// src/di/resolve.ts
let container: ServiceContainer | null = null;

// Wird genau einmal im Bootstrap aufgerufen.
export function setContainer(instance: ServiceContainer) {
  container = instance;
}

export function resolve<T>(token: InjectionToken<T>): T {
  if (!container) throw new Error("DI container not initialized");
  return container.resolve(token);
}

// Bootstrap
const container = buildContainer();
setContainer(container);
// Hooks registrieren, weitere Initialisierung ...
```
- **Wichtig:** JS/TS-Module werden nur einmal instanziiert. `setContainer` schreibt in die Modul-Variable, und alle späteren Importe von `resolve.ts` sehen denselben Container – kein `globalThis` nötig.
- Ergänze in der Entwickler-Doku oder README einen Hinweis „Container wird im Bootstrap via `setContainer` hinterlegt“, damit Contributors den Mechanismus sofort finden.
- Hilfreich, um Erweiterern zu zeigen, wo der Container gesetzt wird: `references`-Doku oder Kommentar direkt bei `setContainer`.
- Foundry-Klassen importieren nur `resolve` und bleiben DI-agnostisch.
- Alternativ lässt sich ein `ServiceResolver`-Interface exportieren, das im Mixin verwendet wird.

### 3. Factory im Foundry-Register
```ts
import { resolve } from "@/di/resolve";
import { actorSheetControllerToken } from "@/tokens/tokenindex";

Hooks.once("init", () => {
  CONFIG.Actor.sheetClasses.character["relationship.sheet"] = {
    id: "relationship.sheet",
    label: "Relationship Sheet",
    klass: class RelationshipActorSheet extends ActorSheet {
      #controller = resolve(actorSheetControllerToken);

      activateListeners(html: JQuery) {
        super.activateListeners(html);
        this.#controller.bind(html, this.actor);
      }
    },
  };
});
```
- Foundry nutzt weiterhin `new klass(...)`, die Klasse holt sich ihren Service über den Resolver.
- Die Factory kann auch externe Adapter erstellen (z.B. `return new RelationshipSheetAdapter(resolve(...), actor)`), um Logik aus der Foundry-Ableitung herauszuhalten.

### 4. Custom-Hooks als Service-Bus
```ts
// Bootstrap: Listener registrieren
Hooks.on("relationshipApp:request-service", (token: symbol, reply: (svc: unknown) => void) => {
  reply(container.resolve(token as InjectionToken<unknown>));
});

// Adapter-Helfer
export function requestService<T>(token: InjectionToken<T>): T {
  let instance: T | null = null;
  Hooks.callAll("relationshipApp:request-service", token, (svc: T) => {
    instance = svc;
  });
  if (!instance) throw new Error(`Service ${String(token)} not provided`);
  return instance;
}

// Foundry-Klasse
import { requestService } from "@/foundry/adapters/service-request";
class RelationshipSheet extends ActorSheet {
  #logger = requestService(loggerToken);
}
```
- Der Hook entkoppelt Verbraucher vollständig vom Container; Rückgabewert wird über Callback gesendet.
- Der Adapter (z.B. `requestService`) kapselt den Hook-Aufruf, sodass Sheets nur den Helper importieren müssen.
- Achtung: Bei mehreren Listenern ggf. Hook-Call ändern (`Hooks.call` liefert erstes Ergebnis); Fehlerhandling im Helper kapseln.

> Für externe Erweiterer:
> - **Module-API** (`game.modules.get(...).api`) und **Custom-Hooks** sind bewusst öffentlich und eignen sich als Integrationspunkte.
> - Der reine Modul-Resolver (`resolve.ts`) bleibt intern; Dokumentation klar machen, dass interne Klassen ihn nutzen dürfen, während Drittmodule die API/Hook-Schnittstellen verwenden.

### 5. Registries / Factory-Maps
- Idee: Für jede Foundry-Anwendung wird eine Factory hinterlegt, die beim Zugriff die passenden Services resolved.
- Beispiel für Compendium/Sheet-Adapter:
  ```ts
  // bootstrap.ts
  import { resolve } from "@/di/resolve";
  import { journalSheetControllerToken } from "@/tokens/tokenindex";

  const sheetFactories = new Map<string, () => RelationshipSheetController>();
  sheetFactories.set("JournalSheetV2", () => resolve(journalSheetControllerToken));

  Hooks.once("init", () => {
    (CONFIG as any).RelationshipApp = { sheetFactories };
  });

  // in der Foundry-Klasse
  const registry = (CONFIG as any).RelationshipApp.sheetFactories;
  const controller = registry.get(this.constructor.name)?.();
  controller?.bind(this);
  ```
- Vorteil: Konstruktion/Logik bleiben getrennt; du kannst zur Laufzeit neue Adapter registrieren (z.B. durch Module-Settings).
- Tests lassen sich vereinfachen, indem du die Factory-Map mockst und nur die Adapter bindest.
