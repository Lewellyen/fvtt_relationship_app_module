# JSDoc Styleguide

Dieser Leitfaden definiert, wo und wie JSDoc-Kommentare im Projekt eingesetzt werden.

## Wo JSDoc Pflicht ist
- Exportierte Klassen, Interfaces und Typen
- Öffentliche Funktionen/Methoden (Teil der externen oder modulübergreifenden API)
- Injection Tokens und wichtige Konfigurations-/Factory-Funktionen
- Komplexe private Helfer, wenn die Intention nicht unmittelbar aus dem Code folgt

## Inhalt eines guten JSDoc-Blocks
- Kurze, präzise Beschreibung (erster Satz)
- Optional: Architektur-/Kontext-Hinweis (warum existiert es?)
- `@param` für alle Parameter (inkl. Bedeutung/Einheiten)
- `@returns` mit Bedeutung des Rückgabewerts
- Optional: `@throws` bei gezielten Fehlerfällen
- Optional: `@example` bei öffentlicher API
- Verweise auf relevante Begriffe: CompositionRoot, ModuleHookRegistrar, PortSelector/PortRegistry, InjectionToken

## Beispiele

```ts
/**
 * Zentraler Bootkernel, der DI-Container erstellt und API resolve bereitstellt.
 * Orchestriert den zweiphasigen Bootstrap (vor init / im init-Hook).
 */
export class CompositionRoot { /* ... */ }
```

```ts
/**
 * Registriert alle Foundry-Hooks. Muss nach Port-Selektion im init-Hook aufgerufen werden.
 * @param container DI-Container mit final gebundenen Ports
 */
registerAll(container: ServiceContainer): void
```

```ts
/**
 * Öffentliche Modul-API: stellt ausschließlich resolve bereit.
 * @example
 * const logger = game.modules.get(MODULE_ID).api.resolve(loggerToken);
 */
export interface ModuleApi { /* ... */ }
```

## Terminologie (konsequent verwenden)
- CompositionRoot: Kapselt DI-Bootstrap und API-Expose
- ModuleHookRegistrar: Bündelt Hook-Registrierung
- PortSelector/PortRegistry: Versionierte Schnittstellen, abhängig von Foundry-Build (erst im init-Hook final)
- InjectionToken: Typsichere Token zur Auflösung im Container

## Stil
- Deutsche Kurztexte sind ok; bei API-Elementen gerne auf Englisch, wenn sinnvoll
- Keine Redundanz: Wiederhole nicht, was der Code offensichtlich zeigt
- Kommentare sind für spätere Maintainer und externe Contributor geschrieben


