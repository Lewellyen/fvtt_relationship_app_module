---
principle: DIP
severity: medium
confidence: high
component_kind: class
component_name: "Foundry V13 Ports"
file: "src/infrastructure/adapters/foundry/ports/v13/"
location:
  start_line: 1
  end_line: various
tags: ["dependency", "foundry", "framework", "adapter"]
status: resolved
resolution_date: "2024"
---

# Problem

Die Foundry V13 Port-Implementierungen (z.B. `FoundryV13GamePort`, `FoundryV13SettingsPort`) hatten direkte Abhängigkeiten zu konkreten Foundry VTT Framework-APIs (z.B. `game.journal`, `game.settings`, `ui.notifications`). Während dies für Adapter-Implementierungen erwartbar ist, verletzt es das Dependency Inversion Principle auf der abstrakten Ebene.

## Status: ✅ Gelöst

**Option 2 (Dependency Injection für Foundry-APIs) wurde vollständig implementiert.**

Alle Foundry V13 Ports verwenden jetzt Dependency Injection über definierte Interfaces (`IFoundryGameAPI`, `IFoundrySettingsAPI`, `IFoundryUIAPI`, `IFoundryHooksAPI`, `IFoundryI18nAPI`, `IFoundryDocumentAPI`). Die Factory-Funktionen (`createFoundryV13GamePort`, `createFoundryV13SettingsPort`, etc.) injizieren die echten Foundry-APIs für Production, während Tests Mock-Implementierungen verwenden können.

**Implementierte Interfaces:**
- `src/infrastructure/adapters/foundry/api/foundry-api.interface.ts` - Definiert alle Foundry-API-Interfaces
- Alle Ports verwenden Constructor Injection mit diesen Interfaces
- Factory-Funktionen wrappen Foundry-APIs in die Interfaces

**Betroffene Ports (alle implementiert):**
- `FoundryV13GamePort` → `IFoundryGameAPI`
- `FoundryV13SettingsPort` → `IFoundrySettingsAPI`
- `FoundryV13UIPort` → `IFoundryUIAPI`, `IFoundryGameJournalAPI`, `IFoundryDocumentAPI`
- `FoundryV13HooksPort` → `IFoundryHooksAPI`
- `FoundryV13I18nPort` → `IFoundryI18nAPI`

## Evidence (Historisch - Vor Refactoring)

Die Foundry V13 Ports hatten ursprünglich direkte Abhängigkeiten zu Foundry-spezifischen APIs.

**Aktuelle Implementierung (nach Refactoring):**

Alle Ports verwenden jetzt Dependency Injection:

```27:27:src/infrastructure/adapters/foundry/ports/v13/FoundryV13GamePort.ts
  constructor(private readonly foundryAPI: IFoundryGameAPI) {}
```

```25:25:src/infrastructure/adapters/foundry/ports/v13/FoundryV13SettingsPort.ts
  constructor(private readonly foundryAPI: IFoundrySettingsAPI | null) {}
```

Die Factory-Funktionen wrappen die Foundry-APIs:

```130:153:src/infrastructure/adapters/foundry/ports/v13/FoundryV13GamePort.ts
export function createFoundryV13GamePort(): FoundryV13GamePort {
  // Create port even if API is not available - port will return API_NOT_AVAILABLE errors
  if (typeof game === "undefined" || !game?.journal) {
    return new FoundryV13GamePort({
      // type-coverage:ignore-next-line -- Required: null needed when API unavailable, but IFoundryGameAPI["journal"] is non-nullable
      journal: null as unknown as IFoundryGameAPI["journal"],
    });
  }

  return new FoundryV13GamePort({
    journal: {
      contents: Array.from(game.journal.contents),
      get: (id: string) => game.journal.get(id),
      ...(game.journal.directory && game.journal.directory.render
        ? {
            directory: {
              render: () => {
                game.journal.directory?.render();
              },
            },
          }
        : {}),
    },
  });
}
```

## Impact (Vor Refactoring)

- **Framework-Abhängigkeit**: Die Ports waren eng an Foundry VTT gekoppelt
- **Testbarkeit**: Schwierige Testbarkeit ohne vollständiges Foundry-Environment
- **Erwartbar für Adapter**: Dies ist für Infrastructure-Adapter akzeptabel, da sie die Aufgabe haben, externe Systeme zu abstrahieren
- **Layer-Compliance**: Die Adapter sind im Infrastructure-Layer, daher ist direkter Framework-Zugriff hier akzeptabel

## Gelöste Probleme (Nach Refactoring)

- ✅ **Verbesserte Testbarkeit**: Ports können jetzt mit Mock-APIs getestet werden
- ✅ **Bessere Abstraktion**: Foundry-APIs sind über Interfaces abstrahiert
- ✅ **Flexibilität**: Einfachere Wartung und Erweiterung der Ports
- ✅ **DIP-Konformität**: Dependency Inversion Principle wird eingehalten

## Recommendation

**✅ Option 2 wurde implementiert: Dependency Injection für Foundry-APIs**

Alle Foundry-APIs werden jetzt über Interfaces injiziert:

**Implementierte Interfaces** (`src/infrastructure/adapters/foundry/api/foundry-api.interface.ts`):

- `IFoundryGameAPI` - Abstrahiert `game.journal`
- `IFoundrySettingsAPI` - Abstrahiert `game.settings`
- `IFoundryUIAPI` - Abstrahiert `ui.notifications` und `ui.sidebar`
- `IFoundryHooksAPI` - Abstrahiert `Hooks.on`, `Hooks.once`, `Hooks.off`
- `IFoundryI18nAPI` - Abstrahiert `game.i18n`
- `IFoundryDocumentAPI` - Abstrahiert `document.querySelector`

**Port-Implementierungen:**

Alle Ports verwenden Constructor Injection:

```typescript
// Beispiel: FoundryV13GamePort
export class FoundryV13GamePort implements FoundryGame {
  constructor(private readonly foundryAPI: IFoundryGameAPI) {}

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const entries = Array.from(this.foundryAPI.journal.contents);
    // ...
  }
}
```

**Factory-Funktionen:**

Factory-Funktionen wrappen die Foundry-APIs und injizieren sie in die Ports:

```typescript
export function createFoundryV13GamePort(): FoundryV13GamePort {
  if (typeof game === "undefined" || !game?.journal) {
    return new FoundryV13GamePort({ journal: null as unknown as IFoundryGameAPI["journal"] });
  }
  return new FoundryV13GamePort({
    journal: {
      contents: Array.from(game.journal.contents),
      get: (id: string) => game.journal.get(id),
      // ...
    },
  });
}
```

## Implementierte Lösung

Die Lösung wurde vollständig implementiert. Siehe:
- `src/infrastructure/adapters/foundry/api/foundry-api.interface.ts` - Alle Foundry-API-Interfaces
- `src/infrastructure/adapters/foundry/ports/v13/FoundryV13GamePort.ts` - Beispiel-Implementierung
- `src/infrastructure/adapters/foundry/ports/v13/FoundryV13SettingsPort.ts` - Beispiel-Implementierung
- Alle weiteren Ports folgen dem gleichen Pattern

## Notes

- ✅ **Status**: Problem wurde durch Dependency Injection vollständig gelöst
- **Adapter-Purpose**: Adapter haben die explizite Aufgabe, externe Systeme zu abstrahieren
- **Layer-Compliance**: Die Implementierungen sind im Infrastructure-Layer, konform mit Clean Architecture
- **Abstraktion**: Die Abstraktion erfolgt auf zwei Ebenen:
  1. **Port-Interfaces** (`FoundryGame`, `FoundrySettings`, etc.) - abstrahieren für Application/Domain-Layer
  2. **Foundry-API-Interfaces** (`IFoundryGameAPI`, `IFoundrySettingsAPI`, etc.) - abstrahieren Foundry-APIs für Testbarkeit
- **Testbarkeit**: Tests können jetzt Mock-Implementierungen der Foundry-API-Interfaces verwenden, ohne vollständiges Foundry-Environment
- **DIP-Konformität**: Dependency Inversion Principle wird jetzt vollständig eingehalten - Ports hängen von Abstraktionen (Interfaces) ab, nicht von konkreten Implementierungen

