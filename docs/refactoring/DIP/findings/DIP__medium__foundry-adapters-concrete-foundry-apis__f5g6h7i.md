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
---

# Problem

Die Foundry V13 Port-Implementierungen (z.B. `FoundryV13GamePort`, `FoundryV13SettingsPort`) haben direkte Abhängigkeiten zu konkreten Foundry VTT Framework-APIs (z.B. `game.journal`, `game.settings`, `ui.notifications`). Während dies für Adapter-Implementierungen erwartbar ist, verletzt es das Dependency Inversion Principle auf der abstrakten Ebene.

## Evidence

Die Foundry V13 Ports importieren und verwenden direkt Foundry-spezifische APIs:

```typescript
// Beispiel aus FoundryV13GamePort (vermutete Struktur)
import type { JournalEntry } from "types/foundry/client/documents/journal-entry.d.ts";

export class FoundryV13GamePort implements FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    // Direkter Zugriff auf game.journal (Foundry-spezifisch)
    const entries = game.journal.entries.map(...);
    return ok(entries);
  }
}
```

```typescript
// Beispiel aus FoundryV13SettingsPort
export class FoundryV13SettingsPort implements FoundrySettings {
  register<T>(namespace: string, key: string, config: SettingConfig<T>): Result<void, FoundryError> {
    // Direkter Zugriff auf game.settings.register (Foundry-spezifisch)
    game.settings.register(namespace, key, config);
    return ok(undefined);
  }
}
```

Die Ports haben direkte Abhängigkeiten zu:
- `game.*` globalen Objekten
- Foundry TypeScript-Typen (`types/foundry/...`)
- Foundry-spezifischen APIs (z.B. `ui.notifications`, `Hooks.*`)

## Impact

- **Framework-Abhängigkeit**: Die Ports sind eng an Foundry VTT gekoppelt
- **Testbarkeit**: Schwierige Testbarkeit ohne vollständiges Foundry-Environment
- **Erwartbar für Adapter**: Dies ist für Infrastructure-Adapter akzeptabel, da sie die Aufgabe haben, externe Systeme zu abstrahieren
- **Layer-Compliance**: Die Adapter sind im Infrastructure-Layer, daher ist direkter Framework-Zugriff hier akzeptabel

## Recommendation

**Option 1: Akzeptieren als Adapter-Responsibility (Empfohlen)**

Die direkten Foundry-Abhängigkeiten sind für Adapter-Implementierungen akzeptabel, da:
- Adapter haben die explizite Aufgabe, externe Systeme zu abstrahieren
- Die Abstraktion erfolgt auf Interface-Ebene (`FoundryGame`, `FoundrySettings`)
- Der Application/Domain-Layer hängt nur von den Interfaces ab, nicht von den konkreten Implementierungen

**Option 2: Dependency Injection für Foundry-APIs (Optional)**

Falls bessere Testbarkeit gewünscht wird, könnten Foundry-APIs über Interfaces injiziert werden:

```typescript
// Foundry-API-Abstraktion
export interface FoundryGameAPI {
  journal: {
    entries: Map<string, JournalEntry>;
    get(id: string): JournalEntry | null;
  };
}

export interface FoundrySettingsAPI {
  register<T>(namespace: string, key: string, config: SettingConfig<T>): void;
  get<T>(namespace: string, key: string): T | undefined;
  set(namespace: string, key: string, value: unknown): Promise<void>;
}

// Port-Implementierung mit injizierter API
export class FoundryV13GamePort implements FoundryGame {
  constructor(private readonly foundryAPI: FoundryGameAPI) {}

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const entries = Array.from(this.foundryAPI.journal.entries.values());
    return ok(entries);
  }
}

// Factory für Production
export function createFoundryV13GamePort(): FoundryV13GamePort {
  return new FoundryV13GamePort({
    journal: game.journal,
    // ...
  });
}

// Mock für Tests
export function createMockFoundryV13GamePort(mockAPI: Partial<FoundryGameAPI>): FoundryV13GamePort {
  return new FoundryV13GamePort({
    journal: {
      entries: new Map(),
      get: () => null,
      ...mockAPI.journal,
    },
    // ...
  });
}
```

**Option 3: Adapter-Wrapper-Pattern**

Ein zusätzlicher Wrapper-Layer, der Foundry-APIs abstrahiert:

```typescript
// Foundry-API-Wrapper
export class FoundryAPIWrapper {
  get journal() {
    return game.journal;
  }

  get settings() {
    return game.settings;
  }

  get ui() {
    return ui;
  }
}

// Port verwendet Wrapper
export class FoundryV13GamePort implements FoundryGame {
  constructor(private readonly foundryAPI: FoundryAPIWrapper = new FoundryAPIWrapper()) {}

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const entries = Array.from(this.foundryAPI.journal.entries.values());
    return ok(entries);
  }
}
```

## Example Fix

Falls Option 2 gewählt wird:

```typescript
// src/infrastructure/adapters/foundry/api/foundry-api.interface.ts
export interface IFoundryGameAPI {
  journal: {
    entries: Map<string, unknown>;
    get(id: string): unknown | null;
  };
}

export interface IFoundrySettingsAPI {
  register<T>(namespace: string, key: string, config: unknown): void;
  get<T>(namespace: string, key: string): T | undefined;
  set(namespace: string, key: string, value: unknown): Promise<void>;
}

// src/infrastructure/adapters/foundry/ports/v13/FoundryV13GamePort.ts
export class FoundryV13GamePort implements FoundryGame {
  constructor(private readonly foundryAPI: IFoundryGameAPI) {}

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    try {
      const entries = Array.from(this.foundryAPI.journal.entries.values()) as FoundryJournalEntry[];
      return ok(entries);
    } catch (error) {
      return err(createFoundryError("API_ERROR", "Failed to get journal entries", undefined, error));
    }
  }
}

// Factory für Production
export function createFoundryV13GamePort(): FoundryV13GamePort {
  return new FoundryV13GamePort({
    journal: game.journal,
  });
}
```

## Notes

- **Adapter-Purpose**: Adapter haben die explizite Aufgabe, externe Systeme zu abstrahieren - direkter Framework-Zugriff ist hier akzeptabel
- **Layer-Compliance**: Die Implementierungen sind im Infrastructure-Layer, daher ist direkter Framework-Zugriff konform mit Clean Architecture
- **Abstraktion**: Die Abstraktion erfolgt auf Interface-Ebene - Application/Domain-Layer hängen nur von Interfaces ab
- **Testbarkeit**: Aktuelle Test-Strategie verwendet Mock-Implementierungen der Interfaces, nicht der konkreten Ports
- **Bewertung**: Dies ist eine akzeptable DIP-Verletzung für Adapter-Implementierungen, aber Option 2 könnte die Testbarkeit verbessern

