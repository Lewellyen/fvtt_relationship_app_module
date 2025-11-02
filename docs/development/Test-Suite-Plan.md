# Testplan: Vollständige Test-Suite (Final)

## Kritikpunkte eingearbeitet

1. **Per-Test Mocks:** setup.ts setzt KEINE globalen Mocks, stattdessen vi.stubGlobal + vi.resetModules() pro Test
2. **Container-Mock-Strategie:** ModuleHookRegistrar Tests nutzen Mock-Container mit resolve-Spies
3. **Logger-Fallback-Test:** Explizites Szenario für Fallback-Mechanismus (container.clear() + resolve)
4. Hook-Orchestrierung, dependencyconfig, versiondetector, Container-Randfälle, Error-Pfade, Async/DOM

---

## Phase 1: Test-Setup (PER-TEST MOCKS)

### 1.1 setup.ts - KEINE globalen Mocks
**Datei:** `src/test/setup.ts`

**KRITISCH:** Setzt KEINE globalen Hooks/game, nur Vitest-Config und exportiert Mock-Factories.

Warum: init-solid.ts führt Bootstrap sofort aus (Zeile 27-36). Globale Mocks verhindern Tests der Branches "Hooks nicht verfügbar" (Zeile 41) und "Bootstrap-Fehler" (Zeile 32-35).

Inhalt:
- Vitest globals
- Keine globalThis-Mocks
- Export von Mock-Factories für Per-Test-Setup

### 1.2 Foundry-Mocks
**Datei:** `src/test/mocks/foundry.ts`

Exportierte Factories:
- `createMockGame(options?)`
- `createMockJournalEntry(overrides?)`
- `createMockHooks()` - mit call tracking
- `createMockUI()`
- `createMockHTMLElement()`
- `createMockContainer()` - für ModuleHookRegistrar (siehe 2.0C)

### 1.3 Test-Utilities
**Datei:** `src/test/utils/test-helpers.ts`

- `expectResultOk<T>(result)` - Type-safe assertion
- `expectResultErr<E>(result)`
- `setupGlobalMocks()` - Wrapper für vi.stubGlobal
- `cleanupGlobalMocks()` - Wrapper für vi.unstubAllGlobals + vi.resetModules
- `createMockDOM(html)`

---

## Phase 2: KRITISCHE TESTS

### 2.0A versiondetector Tests
**Datei:** `src/foundry/versioning/__tests__/versiondetector.test.ts`

Per-Test Setup:
```typescript
beforeEach(() => {
  vi.stubGlobal('game', createMockGame({ version: '13.291' }));
});
afterEach(() => {
  vi.unstubAllGlobals();
});
```

Suites:
1. Success: verschiedene Foundry-Versionen
2. Error: game undefined, game.version undefined, ungültige Strings

### 2.0B dependencyconfig Tests + FALLBACK
**Datei:** `src/config/__tests__/dependencyconfig.test.ts`

**KRITISCH NEU:** Logger-Fallback-Szenario

Suites:
1. **Success Path**
   - configureDependencies registriert alle
   - Validation erfolgreich
   
2. **Error Injection**
   - Fake-Container mit registerClass-Fehler
   - Port-Registry-Fehler
   
3. **Logger-Fallback-Mechanismus (FEHLTE - KORRIGIERT)**
   **WICHTIG:** Test muss prüfen, dass `configureDependencies()` den Fallback selbst setzt!
   
   ```typescript
   it('should register logger fallback in configureDependencies', () => {
     const container = ServiceContainer.createRoot();
     
     // 1. configureDependencies aufrufen (setzt Fallback in Zeile 56)
     const result = configureDependencies(container);
     expect(result.ok).toBe(true);
     
     // 2. Container clearen -> alle Registrierungen weg
     container.clear();
     
     // 3. resolve(loggerToken) sollte Fallback nutzen (von configureDependencies gesetzt)
     const logger = container.resolve(loggerToken);
     expect(logger).toBeInstanceOf(ConsoleLoggerService);
   });
   
   it('should keep fallback when configureDependencies aborts early', () => {
     const container = ServiceContainer.createRoot();
     
     // Spy auf registerValue, damit eine Port-Registry-Registrierung fehlschlägt
     const registerValueSpy = vi
       .spyOn(container, "registerValue")
       .mockImplementation((token, value) => {
         if (token === foundryGamePortRegistryToken) {
           return err({
             code: "TestError",
             message: "Mocked failure",
           });
         }
         return Reflect.apply(ServiceContainer.prototype.registerValue, container, [token, value]);
       });
     
     const result = configureDependencies(container);
     expect(result.ok).toBe(false);
     registerValueSpy.mockRestore();
     
     // Fallback wurde vor dem Fehler registriert und muss weiterhin greifen
     const logger = container.resolve(loggerToken);
     expect(logger).toBeInstanceOf(ConsoleLoggerService);
   });
   ```
   > Hinweis: Für das Mocking wird `err` aus `@/utils/result` sowie `ServiceContainer` und `foundryGamePortRegistryToken` benötigt.

### 2.0C ModuleHookRegistrar Tests + CONTAINER-MOCK
**Datei:** `src/core/__tests__/module-hook-registrar.test.ts`

**KRITISCH:** Mock-Container verwenden, da echter Container ohne validate() fehlschlägt.

Mock-Strategie:
```typescript
function createMockContainer() {
  const mockLogger = { debug: vi.fn(), error: vi.fn() };
  const mockHooks = { on: vi.fn().mockReturnValue({ ok: true }) };
  const mockJournalService = { processJournalDirectory: vi.fn() };
  
  return {
    resolve: vi.fn((token) => {
      if (token === loggerToken) return mockLogger;
      if (token === foundryHooksToken) return mockHooks;
      if (token === journalVisibilityServiceToken) return mockJournalService;
      throw new Error(`Unexpected token: ${String(token)}`);
    })
  };
}
```

Suites:
1. registerAll ruft container.resolve für alle Tokens
2. Hooks.on wird aufgerufen
3. Hook-Fehler → logger.error

### 2.0D init-solid Tests + PER-TEST MOCKS
**Datei:** `src/core/__tests__/init-solid.test.ts`

**KRITISCH:** vi.resetModules() + dynamic import pro Test

Strategie:
```typescript
describe('init-solid Bootstrap', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules(); // KRITISCH: Modul neu laden
  });
  
  it('should bootstrap successfully with Hooks available', async () => {
    const cleanup = withFoundryGlobals();
    const exposeSpy = vi.spyOn(CompositionRoot.prototype, 'exposeToModuleApi');
    const registerAllSpy = vi.spyOn(ModuleHookRegistrar.prototype, 'registerAll');
    
    // Dynamic import NACH Mock-Setup
    await import('@/core/init-solid');
    
    expect(globalThis.Hooks.on).toHaveBeenCalledWith('init', expect.any(Function));
    
    // Init-Hook auslösen und Phase-2 Verhalten prüfen
    const hooksOnMock = globalThis.Hooks.on as ReturnType<typeof vi.fn>;
    const initCall = hooksOnMock.mock.calls.find(([hookName]) => hookName === "init");
    const initCallback = initCall?.[1] as (() => void) | undefined;
    expect(initCallback).toBeDefined();
    initCallback?.();
    
    expect(exposeSpy).toHaveBeenCalled();
    expect(registerAllSpy).toHaveBeenCalledWith(expect.any(ServiceContainer));
    cleanup();
  });
  
  it('should soft-abort when Hooks undefined', async () => {
    const cleanup = withFoundryGlobals({ Hooks: undefined });
    const consoleSpy = vi.spyOn(console, 'warn');
    await import('@/core/init-solid');
    
    // Sollte warnen, aber nicht werfen
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Hooks API not available'));
    cleanup();
  });
  
  it('should throw when bootstrap fails', async () => {
    vi.stubGlobal('game', createMockGame());
    vi.stubGlobal('Hooks', createMockHooks());
    
    // Mock configureDependencies to fail
    vi.mock('@/config/dependencyconfig', () => ({
      configureDependencies: vi.fn().mockReturnValue({ ok: false, error: 'Test error' })
    }));
    
    await expect(import('@/core/init-solid')).rejects.toThrow('Test error');
  });
});
```

Suites:
1. Bootstrap Success (Hooks available)
2. Hooks undefined → soft-abort (Zeile 41)
3. Bootstrap fails → Exception (Zeile 32-35)

---

## Phase 2: Container Tests (ERWEITERT)

### 2.1 ServiceContainer (+ FALLBACK + RANDFÄLLE)
**Datei:** `src/di_infrastructure/__tests__/container.test.ts`

**NEUE Suites:**

11. **clear() und isRegistered() (FEHLTE)**
    - clear() entfernt alle
    - clear() reset validation state
    - isRegistered() korrekt
    
12. **Fallback-Mechanismus (FEHLTE)**
    ```typescript
    it('should use fallback when resolution fails', () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken('test');
      
      registerFallback(token, () => ({ value: 'fallback' }));
      container.validate();
      
      // Token NICHT registriert -> Fallback
      const result = container.resolve(token);
      expect(result.value).toBe('fallback');
    });
    
    it('should throw when no fallback available', () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken('test');
      container.validate();
      
      // Kein Fallback -> Exception
      expect(() => container.resolve(token)).toThrow();
    });
    ```
    
13. **Disposed Container (FEHLTE)**
    - Registrierung → Fehler
    - Resolution → Fehler
    - createScope → Fehler

Bisherige Suites: Creation, Registration, Lifecycles, Validation, Scopes, Disposal

### 2.2-2.5 Registry, Resolver, Validator, ScopeManager
Wie im vorherigen Plan.

---

## Phase 3-8: Wie vorheriger Plan

(Result-Utils, Ports mit Async/DOM, Services mit Error-Pfaden, Integration, Coverage, CI)

Keine Änderungen zu vorherigem Plan außer:
- Alle Tests verwenden Per-Test Mocks (beforeEach/afterEach)
- ModuleHookRegistrar nutzt Mock-Container
- dependencyconfig.integration.test.ts testet Logger-Fallback-Flow

---

## Implementierungs-Reihenfolge (FINAL)

**PRIO 1 - SETUP & KRITISCHE TESTS:**
1. Test-Setup (setup.ts OHNE globale Mocks, Mock-Factories)
2. versiondetector Tests (Per-Test Mocks)
3. **dependencyconfig Tests + Logger-Fallback** (NEU)
4. **init-solid Tests (vi.resetModules + dynamic import)** (KOMPLEX)
5. **ModuleHookRegistrar Tests (Mock-Container)** (NEU)

**PRIO 2-5:** Wie vorher (Container, Result, Ports, Services, Integration, Coverage, CI)

---

## Spezielle Implementierungshinweise

### 1. Per-Test Mock-Pattern

```typescript
const withFoundryGlobals = (overrides: Partial<MockFoundryGlobals> = {}) => {
  const globals = {
    game: createMockGame(),
    Hooks: createMockHooks(),
    ...overrides,
  };
  Object.entries(globals).forEach(([key, value]) => vi.stubGlobal(key, value));
  return () => {
    vi.unstubAllGlobals();
  };
};

type MockFoundryGlobals = {
  game: ReturnType<typeof createMockGame>;
  Hooks: ReturnType<typeof createMockHooks> | undefined;
  ui?: ReturnType<typeof createMockUI>;
};
```

### 2. init-solid Test-Pattern

```typescript
// Modul muss pro Test neu geladen werden
afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules(); // KRITISCH
  vi.restoreAllMocks();
});

it('test case', async () => {
  const cleanup = withFoundryGlobals({ Hooks: undefined });
  await import('@/core/init-solid');
  cleanup();
  // Assertions …
});
```

### 3. Mock-Container für ModuleHookRegistrar

```typescript
// src/test/mocks/foundry.ts
export function createMockContainer(overrides = {}) {
  const defaults = {
    [loggerToken]: { debug: vi.fn(), error: vi.fn() },
    [foundryHooksToken]: { on: vi.fn().mockReturnValue({ ok: true }) },
    [journalVisibilityServiceToken]: { processJournalDirectory: vi.fn() }
  };
  
  const services = { ...defaults, ...overrides };
  
  return {
    resolve: vi.fn((token) => {
      if (!services[token]) {
        throw new Error(`Token not mocked: ${String(token)}`);
      }
      return services[token];
    })
  };
}
```

### 4. Logger-Fallback Tests (KORRIGIERT)

```typescript
// Test 1: configureDependencies setzt Fallback selbst
it('should register logger fallback via configureDependencies', () => {
  const container = ServiceContainer.createRoot();
  
  // configureDependencies ruft registerFallback auf (Zeile 56)
  const result = configureDependencies(container);
  expect(result.ok).toBe(true);
  
  // Clear entfernt Registrierungen, aber Fallback bleibt
  container.clear();
  
  // Fallback greift
  const logger = container.resolve(loggerToken);
  expect(logger).toBeInstanceOf(ConsoleLoggerService);
});

// Test 2: Fallback greift trotz configureDependencies-Fehler
it('should use fallback even when configureDependencies partially fails', () => {
  const container = ServiceContainer.createRoot();
  
  // Mock PortRegistry.register um Fehler zu provozieren
  // ABER: Fallback wird VOR Port-Registrierungen gesetzt (Zeile 56)
  const originalRegisterValue = container.registerValue.bind(container);
  vi.spyOn(container, 'registerValue').mockImplementation((token, value) => {
    // Lasse Logger-Fallback durch, aber fail bei Port-Registry
    if (token === foundryGamePortRegistryToken) {
      return err({ code: 'TestError', message: 'Mocked failure' });
    }
    return originalRegisterValue(token, value);
  });
  
  const result = configureDependencies(container);
  expect(result.ok).toBe(false); // Scheitert wegen Port-Registry
  
  // Fallback wurde aber VOR dem Fehler gesetzt
  const logger = container.resolve(loggerToken);
  expect(logger).toBeInstanceOf(ConsoleLoggerService);
});
```

---

## Erfolgs-Kriterien (FINAL)

- [ ] Per-Test Mocks funktionieren
- [ ] init-solid Tests decken alle Branches (Hooks available, undefined, Bootstrap-Fehler)
- [ ] ModuleHookRegistrar Tests mit Mock-Container
- [ ] Logger-Fallback-Mechanismus getestet
- [ ] Container clear(), isRegistered(), Fallback getestet
- [ ] Alle Async-Pfade (setFlag) getestet
- [ ] DOM-Tests (UI-Port)
- [ ] Error-Pfade in Services
- [ ] Coverage >80% gesamt, >90% kritische Dateien
- [ ] Tests laufen in <20s
- [ ] Keine flaky Tests
- [ ] CI-Pipeline integriert

---

## Geschätzter Aufwand

- Setup + Mock-Factories: 4h
- KRITISCHE Tests (versiondetector, dependencyconfig+Fallback, init-solid, ModuleHookRegistrar): 2.5 Tage
- Container (erweitert): 2.5 Tage
- Result: 6h
- Ports (Async/DOM): 1.5 Tage
- Services (Error-Pfade): 1.5 Tage
- Integration: 1 Tag
- Coverage + CI: 4h

**Gesamt: 9-11 Tage (mit Buffer: 2 Wochen)**
