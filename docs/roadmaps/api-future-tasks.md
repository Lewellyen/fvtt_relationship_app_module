# API Future Tasks - Für Version 1.0.0

**Datum:** 2025-11-09  
**Ziel:** API Production-Ready machen  
**Aufwand:** ~6-12h (gesamt)

---

## Task 1: Deprecation-Mechanismus

**Aufwand:** ~2-4h  
**Priorität:** 🔴 HOCH (vor 1.0.0 verpflichtend)

### Problem

Aktuell gibt es **keinen Mechanismus** um Tokens/Services als "deprecated" zu markieren:

```typescript
// Wenn wir loggerToken durch newLoggerToken ersetzen wollen:
api.tokens = {
  loggerToken,        // ❌ Keine Warnung für alte Nutzer
  newLoggerToken      // Neue Version
}
```

**Konsequenz:** Breaking Changes ohne Vorwarnung → User-Code bricht plötzlich!

### Lösung: Token-Aliasing mit Console-Warnings

#### Implementierung:

**1. Deprecated-Token-Wrapper:**

```typescript
// src/di_infrastructure/types/deprecated-token.ts
export function markAsDeprecated<T>(
  token: InjectionToken<T>,
  reason: string,
  replacement: InjectionToken<T> | null,
  removedInVersion: string
): ApiSafeToken<T> {
  const wrappedToken = markAsApiSafe(token);
  
  // Store deprecation metadata
  (wrappedToken as any).__deprecated = {
    reason,
    replacement: replacement ? String(replacement) : null,
    removedInVersion,
    warningShown: false
  };
  
  return wrappedToken;
}
```

**2. Resolve-Wrapper mit Warning:**

```typescript
// In composition-root.ts
const api: ModuleApi = {
  resolve: <T>(token: ApiSafeToken<T>): T => {
    // Check if token is deprecated
    const deprecationInfo = (token as any).__deprecated;
    if (deprecationInfo && !deprecationInfo.warningShown) {
      console.warn(
        `[${MODULE_CONSTANTS.MODULE.ID}] DEPRECATED: Token "${String(token)}" is deprecated.\n` +
        `Reason: ${deprecationInfo.reason}\n` +
        (deprecationInfo.replacement 
          ? `Use "${deprecationInfo.replacement}" instead.\n`
          : "") +
        `This token will be removed in version ${deprecationInfo.removedInVersion}.`
      );
      deprecationInfo.warningShown = true; // Nur einmal warnen
    }
    
    return container.resolve(token);
  }
};
```

**3. Beispiel-Nutzung:**

```typescript
// In composition-root.ts (exposeToModuleApi)
const wellKnownTokens: ModuleApiTokens = {
  // OLD: Will be removed in 2.0.0
  oldLoggerToken: markAsDeprecated(
    loggerToken, 
    "Use loggerToken v2 with enhanced features",
    newLoggerToken,
    "2.0.0"
  ),
  
  // NEW: Recommended way
  loggerToken: markAsApiSafe(newLoggerToken),
};
```

**4. User Experience:**

```javascript
// User nutzt deprecated token
const logger = api.resolve(api.tokens.oldLoggerToken);

// Console Output (nur einmal):
// ⚠️ [fvtt_relationship_app_module] DEPRECATED: Token "oldLoggerToken" is deprecated.
// Reason: Use loggerToken v2 with enhanced features
// Use "loggerToken" instead.
// This token will be removed in version 2.0.0.
```

### Vorteile

- ✅ **Non-Breaking:** Alte Tokens funktionieren weiter (mit Warnung)
- ✅ **Developer-Friendly:** Klare Migration-Pfade
- ✅ **Auto-Discovery:** User sehen Warnings automatisch
- ✅ **Zeitraum:** 1+ Version für Migration (z.B. deprecated in 1.5.0, removed in 2.0.0)

### Dateien zu erstellen/ändern:
- `src/di_infrastructure/types/deprecated-token.ts` (NEW)
- `src/core/composition-root.ts` (UPDATED: resolve-Wrapper)
- `src/core/module-api.ts` (UPDATED: Optional DeprecationInfo Interface)
- Tests für Deprecation-Warnings

---

## Task 2: API-Changelog (Separate von Modul-Changelog)

**Aufwand:** ~1-2h  
**Priorität:** 🟡 MITTEL (nice-to-have für 1.0.0)

### Problem

Aktuell gibt es **ein CHANGELOG.md** für:
- Interne Code-Änderungen
- API-Änderungen
- Performance-Verbesserungen
- Bug-Fixes

**Für externe Entwickler irrelevant:**
- "Refactored ConsoleLoggerService" ← Wen interessiert's?
- "Split config into modules" ← Implementierungs-Detail

**Für externe Entwickler relevant:**
- "Added i18nFacadeToken to API" ← Das ist wichtig!
- "DEPRECATED: oldLoggerToken" ← Breaking Change!

### Lösung: Separates API-CHANGELOG.md

#### Struktur:

```markdown
# API Changelog

Dieses Changelog dokumentiert **nur Änderungen an der Public API** 
(`game.modules.get(MODULE_ID).api`).

Für interne Modul-Änderungen siehe [CHANGELOG.md](../CHANGELOG.md).

---

## [API 1.0.0] - 2025-11-15

### Added
- **i18nFacadeToken** - I18n-System für externe Module
- **foundryJournalFacadeToken** - Journal CRUD Operations

### Changed
- Keine Änderungen

### Deprecated
- Keine Deprecations

### Removed
- Keine Entfernungen

### Breaking Changes
- Keine Breaking Changes

---

## [API 1.0.0] - 2025-11-10 (Initial Release)

### Added
- **loggerToken** - Logger Service
- **journalVisibilityServiceToken** - Journal Visibility Logic
- **foundryGameToken** - Foundry Game API Wrapper
- **foundryHooksToken** - Foundry Hooks API Wrapper
- **foundryDocumentToken** - Foundry Document API Wrapper
- **foundryUIToken** - Foundry UI API Wrapper
- **foundrySettingsToken** - Foundry Settings API Wrapper
- **getMetrics()** - Performance Metrics API
- **getHealth()** - Health Status API
- **getAvailableTokens()** - Token Discovery API
```

#### Automatisierung:

**Python-Release-Tool erweitern:**

```python
# In release_utils.py
def update_api_changelog(api_version, date, changes):
    """Aktualisiert API-CHANGELOG.md mit API-spezifischen Änderungen."""
    api_changelog_path = "docs/API-CHANGELOG.md"
    
    # Nur API-relevante Änderungen:
    # - Neue exponierte Tokens
    # - Deprecated Tokens
    # - Breaking Changes in API
    
    # Implementierung analog zu update_documentation()
    pass
```

**Nutzen im Release-Tool:**

Zwei separate Felder im Modal:
1. **Modul-Changelog** (intern) → `CHANGELOG.md`
2. **API-Changelog** (extern) → `docs/API-CHANGELOG.md`

### Vorteile

- ✅ **Klare Trennung:** API vs. Implementierung
- ✅ **Externe Entwickler:** Sehen nur relevante Änderungen
- ✅ **Versionierung:** API kann unabhängig von Modul versioniert werden
- ✅ **Kommunikation:** Breaking Changes sofort erkennbar

### Dateien zu erstellen:
- `docs/API-CHANGELOG.md` (NEW)
- `scripts/release_utils.py` (UPDATED: `update_api_changelog()`)
- `scripts/release_gui.py` (UPDATED: Separates Modal-Feld?)

---

## Task 3: ReadOnly-Wrapper für exponierte Services

**Aufwand:** ~3-6h  
**Priorität:** 🟢 NIEDRIG (Defense in Depth, Optional)

### Problem

Aktuell exponierst du **die Original-Service-Instanzen**:

```javascript
const logger = api.resolve(api.tokens.loggerToken);
logger.setMinLevel(0);  // ✅ OK
logger.minLevel = 0;    // ⚠️ Direct Property Access (falls public)
```

**Risiko:**
- Externe Module könnten interne State verändern
- Keine Kontrolle über Zugriffsmuster
- Schwer zu tracken wer was ändert

### Lösung: Proxy-basierte ReadOnly-Wrapper

#### Implementierung:

**1. ReadOnly-Wrapper-Factory:**

```typescript
// src/core/api/readonly-wrapper.ts
export function createReadOnlyWrapper<T extends object>(
  service: T,
  allowedMethods: (keyof T)[]
): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      // Erlaubte Methoden durchlassen
      if (allowedMethods.includes(prop as keyof T)) {
        const value = Reflect.get(target, prop, receiver);
        // Bind 'this' context für Methoden
        if (typeof value === "function") {
          return value.bind(target);
        }
        return value;
      }
      
      // Property-Zugriff blockieren
      throw new Error(
        `Property "${String(prop)}" is not accessible via Public API. ` +
        `Only these methods are allowed: ${allowedMethods.join(", ")}`
      );
    },
    
    set() {
      throw new Error("Cannot modify services via Public API (read-only)");
    }
  });
}
```

**2. API-spezifische Wrapper:**

```typescript
// src/core/api/public-api-wrappers.ts
export function createPublicLogger(logger: Logger): Logger {
  return createReadOnlyWrapper(logger, [
    "debug", "info", "warn", "error",  // ✅ Erlaubt
    "log", "withTraceId"               // ✅ Erlaubt
    // "setMinLevel" ← ❌ NICHT exponiert!
  ]);
}

export function createPublicI18n(i18n: I18nFacadeService): I18nFacadeService {
  return createReadOnlyWrapper(i18n, [
    "translate", "format", "has"  // ✅ Nur Read-Operations
  ]);
}
```

**3. In composition-root.ts nutzen:**

```typescript
resolve: <T>(token: ApiSafeToken<T>): T => {
  const service = container.resolve(token);
  
  // Wrap known services with ReadOnly proxies
  if (token === markAsApiSafe(loggerToken)) {
    return createPublicLogger(service as Logger) as T;
  }
  if (token === markAsApiSafe(i18nFacadeToken)) {
    return createPublicI18n(service as I18nFacadeService) as T;
  }
  
  // Default: Return original (für Services ohne sensible Operations)
  return service;
}
```

**4. User Experience:**

```javascript
const logger = api.resolve(api.tokens.loggerToken);

logger.info("Hello");           // ✅ OK
logger.setMinLevel(0);          // ❌ Error: "setMinLevel is not accessible via Public API"
logger.minLevel = 0;            // ❌ Error: "Cannot modify services via Public API"
```

### Vorteile

- ✅ **Defense in Depth:** Externe Module können nichts kaputt machen
- ✅ **Controlled Access:** Nur explizit erlaubte Methoden
- ✅ **Zero Runtime Overhead:** Proxy nur bei API-Boundary
- ✅ **Type-Safe:** TypeScript Types bleiben erhalten

### Nachteile

- ⚠️ **Komplexität:** Mehr Code zu warten
- ⚠️ **Maintenance:** Jeder neue exponierte Service braucht Wrapper
- ⚠️ **Edge Cases:** `instanceof` Checks könnten fehlschlagen

### Wann nötig?

**✅ JA bei:**
- Services mit sensiblen State-Änderungen (`setMinLevel`, `configure()`)
- Services mit Lifecycle-Management (`dispose()`, `initialize()`)
- Production-kritischen Services (Logger, Metrics)

**❌ NEIN bei:**
- Reine Read-Only Services (FoundryGame, FoundryDocument)
- Services ohne State (Stateless Utilities)
- Facades mit nur Query-Methoden

### Empfehlung für 1.0.0:

**Minimal:** Nur Logger & Settings mit Wrapper (sensible Operations)  
**Optimal:** Alle exponierten Services mit Wrapper (maximale Kontrolle)

### Dateien zu erstellen:
- `src/core/api/readonly-wrapper.ts` (NEW: Generic Wrapper)
- `src/core/api/public-api-wrappers.ts` (NEW: Service-spezifische Wrapper)
- `src/core/composition-root.ts` (UPDATED: resolve mit Wrapping)
- Tests für Proxy-Behavior

---

## 🎯 Zusammenfassung der 3 Tasks

| Task | Aufwand | Priorität | Für 1.0.0 |
|------|---------|-----------|-----------|
| **1. Deprecation-Mechanismus** | 2-4h | 🔴 HOCH | ✅ Verpflichtend |
| **2. API-Changelog** | 1-2h | 🟡 MITTEL | ⚠️ Empfohlen |
| **3. ReadOnly-Wrapper** | 3-6h | 🟢 NIEDRIG | ❌ Optional |

### Gesamt-Aufwand: 6-12h

### Empfohlene Reihenfolge:

1. **Jetzt (v0.8.0):** I18n & Journal Facade exponieren
2. **Pre-1.0.0:** Deprecation-Mechanismus implementieren
3. **Pre-1.0.0:** API-Changelog erstellen (optional aber empfohlen)
4. **Post-1.0.0:** ReadOnly-Wrapper nur falls tatsächlich Probleme auftreten

---

## 💡 Alternative: Minimaler Ansatz für 1.0.0

Falls Zeit knapp ist:

### Deprecation ohne Mechanismus:

**Dokumentations-basiert:**

```markdown
# API-CHANGELOG.md

## [1.5.0] - 2025-XX-XX

### Deprecated
- **loggerToken** - Will be removed in 2.0.0
  - **Replacement:** Use `loggerTokenV2` instead
  - **Migration Guide:** [link]
  - **Breaking in:** 2.0.0 (≥1 major version notice)
```

**+Manual Warning in Code:**

```typescript
// In composition-root.ts (temporär für deprecated tokens)
if (token === oldLoggerToken) {
  console.warn("DEPRECATED: oldLoggerToken will be removed in 2.0.0");
}
```

**Vorteil:** ✅ Schnell, funktioniert  
**Nachteil:** ⚠️ Nicht systematisch, manuell zu pflegen

---

## 📚 Referenzen

- **Semantic Versioning:** https://semver.org/
- **Keep a Changelog:** https://keepachangelog.com/
- **API Deprecation Best Practices:** https://nordicapis.com/api-deprecation-strategies/
- **Proxy Pattern:** MDN Web Docs (Proxy)

---

**Ende Future Tasks**

