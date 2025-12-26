---
id: DIP-001
principle: DIP
severity: medium
layer: Domain
status: Proposed
---

1. Problem

Der Domain-Layer definiert DI-spezifische Typen (InjectionToken,
DomainInjectionToken, DomainContainerError) und eine Token-Factory.
Damit enthaelt der Domain-Layer technische Infrastrukturbelange und wird
von einer konkreten DI-Mechanik gepraegt. Das konterkariert die Idee, dass
Domain-Policies unabhaengig von Framework/DI sein sollen.

2. Evidence (Belege)

- Pfad: src/domain/types/injection-token.ts:1-10
- Pfad: src/domain/utils/token-factory.ts:1-35
- Pfad: src/domain/types/container-types.ts:1-54

```ts
export type InjectionToken<T> = symbol & { __serviceType?: T };
export function createInjectionToken<T>(description: string): InjectionToken<T> {
  return Symbol(description) as InjectionToken<T>;
}
export type DomainInjectionToken<T = unknown> = symbol;
export interface DomainContainerError { code: string; message: string; cause?: unknown; }
```

3. SOLID-Analyse

DIP-Verstoss: High-Level-Policy (Domain) wird durch Low-Level-Detail (DI)
veraendert. Dadurch ist der Domain-Layer nicht mehr rein fachlich und schwerer
in andere Laufzeitumgebungen zu portieren.

4. Zielbild

- Domain-Types enthalten nur fachliche Modelle und Ports.
- DI-Konzepte liegen im Application/Infrastructure Layer.
- Tokens sind ein Composition-Root-Detail, nicht Domain-Detail.

5. Loesungsvorschlag

Approach A (empfohlen)
- Verschiebe InjectionToken, token-factory und container-types nach
  src/application/di oder src/infrastructure/di.
- Domain-Ports arbeiten ohne DI-Typen; DI wird im Framework/Infrastructure gelost.

Approach B (Alternative)
- Behalte Domain-Tokens, aber verstecke sie hinter Application-Facade
  (re-export) und entkopple Domain-Ports von DI-Typen.

Trade-offs
- Breaking Changes in Imports, aber sauberere Schichten.

6. Refactoring-Schritte

1) Neues Paket fuer DI-Types anlegen (src/application/di).
2) Token-Factory dorthin verschieben und re-export als Migration.
3) Domain-Ports von DomainInjectionToken auf generische Abstraktion umstellen
   oder DI aus Ports entfernen.
4) Alle Imports/DI-Bindings aktualisieren.

7. Beispiel-Code

After
```ts
// application/di/token-factory.ts
export type InjectionToken<T> = symbol & { __serviceType?: T };
export function createInjectionToken<T>(description: string): InjectionToken<T> {
  return Symbol(description) as InjectionToken<T>;
}
```

8. Tests & Quality Gates

- Typecheck fuer alle Token-Imports.
- Arch-Lint: domain darf keine DI-Imports enthalten.

9. Akzeptanzkriterien

- Domain-Layer enthaelt keine DI-Typen oder Token-Factories.
- Application/Infrastructure stellen DI-Typen bereit.
