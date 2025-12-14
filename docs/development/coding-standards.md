# Code-Standards

**Zweck:** Coding-Konventionen und Dokumentations-Standards
**Zielgruppe:** Entwickler, Contributor
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.43.18 (Pre-Release)

---

## Naming-Konventionen

### Klassen & Interfaces

- **Klassen**: PascalCase (`ConsoleLoggerService`, `FoundryGamePort`)
- **Interfaces**: PascalCase ohne "I"-Präfix (`FoundryGame`, nicht `IFoundryGame`)
- **Abstract Classes**: PascalCase mit "Base"-Suffix (`FoundryServiceBase`)

### Funktionen & Variablen

- **Funktionen**: camelCase (`getJournalEntries`, `registerPort`)
- **Variablen**: camelCase (`logger`, `container`)
- **Konstanten**: UPPER_SNAKE_CASE (`MODULE_ID`, `LOG_PREFIX`)

### Tokens

- **Injection Tokens**: camelCase mit "Token"-Suffix (`loggerToken`, `foundryGameToken`)

### Ports & Adapters

- **Ports**: `<Name>Port` (`FoundryGamePort`)
- **Versions-Ports**: `<Name>Port<Version>` (`FoundryV13GamePort`)
- **Adapters**: `<Name>Adapter` (`FoundryJournalCollectionAdapter`)

---

## JSDoc-Dokumentation

### Wo JSDoc Pflicht ist

- ✅ Exportierte Klassen, Interfaces und Typen
- ✅ Öffentliche Funktionen/Methoden (Teil der externen oder modulübergreifenden API)
- ✅ Injection Tokens und wichtige Konfigurations-/Factory-Funktionen
- ✅ Komplexe private Helfer, wenn die Intention nicht unmittelbar aus dem Code folgt

### Inhalt eines guten JSDoc-Blocks

- Kurze, präzise Beschreibung (erster Satz)
- Optional: Architektur-/Kontext-Hinweis (warum existiert es?)
- `@param` für alle Parameter (inkl. Bedeutung/Einheiten)
- `@returns` mit Bedeutung des Rückgabewerts
- Optional: `@throws` bei gezielten Fehlerfällen
- Optional: `@example` bei öffentlicher API
- Verweise auf relevante Begriffe: CompositionRoot, ModuleEventRegistrar, PortSelector/PortRegistry, InjectionToken

### Beispiele

**Klasse:**
```typescript
/**
 * Zentraler Bootkernel, der DI-Container erstellt und API resolve bereitstellt.
 * Orchestriert den zweiphasigen Bootstrap (vor init / im init-Hook).
 */
export class CompositionRoot { /* ... */ }
```

**Methode:**
```typescript
/**
 * Registriert alle Foundry-Events. Muss nach Port-Selektion im init-Hook aufgerufen werden.
 * @param container DI-Container mit final gebundenen Ports
 * @returns Result mit void bei Erfolg, Error bei Fehler
 */
registerAll(container: ServiceContainer): Result<void, Error> { /* ... */ }
```

**Interface:**
```typescript
/**
 * Öffentliche Modul-API: stellt ausschließlich resolve bereit.
 * @example
 * const logger = game.modules.get(MODULE_ID).api.resolve(loggerToken);
 */
export interface ModuleApi { /* ... */ }
```

**Token:**
```typescript
/**
 * Injection Token für den Logger-Service.
 * Wird in der DI-Konfiguration registriert und überall im Code verwendet.
 */
export const loggerToken: InjectionToken<Logger> = createToken<Logger>("logger");
```

---

## Code-Formatierung

### Prettier

Das Projekt nutzt **Prettier** für automatische Code-Formatierung.

**Konfiguration:** `.prettierrc`

**Formatieren:**
```bash
npm run format
```

**Format-Check:**
```bash
npm run format:check
```

### TypeScript

**Strict Mode:** Aktiviert in `tsconfig.json`

```json
{
  "strict": true,
  "strictNullChecks": true,
  "noImplicitAny": true
}
```

**Type-Check:**
```bash
npm run type-check
```

---

## Encoding

**Wichtig:** Alle Dateien müssen als **UTF-8 ohne BOM** gespeichert werden.

**VS Code:**
- Standardmäßig UTF-8
- Prüfen: Statusleiste zeigt Encoding

**IntelliJ/WebStorm:**
- File → File Properties → File Encoding → UTF-8

**Prüfung:**
```bash
npm run check:encoding
```

**BOM entfernen:**
```bash
npm run remove:bom
```

---

## Result Pattern

### Regel

- **Alle externen Interaktionen** (Foundry API, Dateisystem) geben Result zurück
- **throw** nur für Programmierfehler, nie für erwartbare Fehler

### Beispiel

```typescript
// ✅ Korrekt: Result zurückgeben
getJournalEntries(): Result<JournalEntry[], string> {
  const portResult = this.getPort();
  if (!portResult.ok) return portResult;  // Fehler propagieren
  return portResult.value.getJournalEntries();
}

// ❌ Falsch: Exception werfen
getJournalEntries(): JournalEntry[] {
  if (!this.port) throw new Error("Port not available");
  return this.port.getJournalEntries();
}
```

**Siehe:** [Result Pattern](../architecture/patterns.md#result-pattern)

---

## Dependency Injection

### DI-Wrapper-Pattern

Jede produktive Klasse besitzt ein `DI…`-Wrapper:

```typescript
// Basisklasse
class ConsoleLoggerService {
  constructor(env: EnvironmentConfig, traceContext: TraceContext) {
    // ...
  }
}

// DI-Wrapper (im selben File)
class DIConsoleLoggerService extends ConsoleLoggerService {
  static dependencies = [environmentConfigToken, traceContextToken] as const;

  constructor(env: EnvironmentConfig, traceContext: TraceContext) {
    super(env, traceContext);
  }
}
```

**Registrierung:**
- Config-Module registrieren ausschließlich Wrapper
- Constructor-Änderungen bleiben lokal
- Tests können Basisklasse direkt nutzen

---

## Logging

### Bootstrap-Phase

Ein dedizierter `BootstrapLoggerService` wird direkt via `new` verwendet, solange der Container noch nicht validiert ist.

### Nach Validation

Alle Komponenten loggen ausschließlich über das NotificationCenter:

```typescript
// ✅ Korrekt: NotificationCenter verwenden
notificationCenter.debug('Message', { context }, { channels: ["ConsoleChannel"] });

// ❌ Falsch: Direktes console.log
console.log('Message');
```

**Siehe:** [Architektur - Logging](../architecture/overview.md#code-konventionen)

---

## Testing

### Test-Struktur

Tests sind co-located mit dem Source-Code:

```
src/
├── services/
│   ├── consolelogger.ts
│   └── __tests__/
│       └── consolelogger.test.ts
```

### Test-Patterns

**Result Pattern Testing:**
```typescript
it("should return error on failure", () => {
  const result = service.doSomething();
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toContain("expected error");
  }
});
```

**Foundry Globals Mocken:**
```typescript
import { withFoundryGlobals } from "@/test/utils/test-helpers";

it("should work with Foundry", () => {
  const cleanup = withFoundryGlobals({
    game: createMockGame(),
    Hooks: createMockHooks()
  });
  // Test code...
  cleanup();
});
```

**Siehe:** [Testing](./testing.md)

---

## Linting

### ESLint

Das Projekt nutzt **ESLint** für Code-Qualität.

**Lint:**
```bash
npm run lint
```

**Konfiguration:** `.eslintrc.cjs`, `eslint.config.mjs`

### Stylelint

CSS-Dateien werden mit **Stylelint** geprüft.

**Lint:**
```bash
npm run css-lint
```

**Konfiguration:** `.stylelintrc.json`

---

## Quality Gates

### Coverage-Anforderungen

- Lines: 100%
- Functions: 100%
- Branches: 100%
- Statements: 100%
- Type Coverage: 100%

**Prüfung:**
```bash
npm run test:coverage
npm run type-coverage
```

### Exclusions

Alle Coverage-Ausnahmen sind dokumentiert:
- [Code Coverage Exclusions](../quality/coverage.md)
- [Type Coverage Exclusions](../quality/type-safety.md)

**Siehe:** [Quality Gates](../quality/README.md)

---

## Weitere Informationen

- [Testing](./testing.md) - Test-Strategie & Anleitung
- [Scripts](./scripts.md) - NPM-Scripts & Build-Tools
- [Architektur-Übersicht](../architecture/overview.md) - Architektur-Details

---

**Letzte Aktualisierung:** 2025-01-XX
