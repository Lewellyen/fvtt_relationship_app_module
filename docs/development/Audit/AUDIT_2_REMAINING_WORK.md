# Audit #2 - Remaining Implementation Tasks

## Summary

**Completed: 15 of 20 tasks (75%)**

### ✅ Completed (Phase 1-3)
- MITTEL-7: getHealth() portSelected false fix
- MITTEL-8: Cache metrics instrumentation  
- MITTEL-9: FoundryHooksService memory leak fix
- MITTEL-10: retry.ts ErrorType casting with mapException
- MITTEL-5: Valibot v.any() replacement
- MITTEL-2: npm audit CI workflow
- MITTEL-1: Dependabot + CodeQL workflows
- MITTEL-3: Performance sampling (1%)
- MITTEL-4: Trace-IDs for logging
- MITTEL-6: Inline comments for complex algorithms
- NIEDRIG-5.1-5.5: I18n Facade Pattern (Interface, Port, Services created)

### 🚧 Remaining Tasks (5 tasks, ~8-10 hours)

## NIEDRIG-5.6: I18n DI Registration (2 hours)

### Files to Modify:

**1. `src/config/dependencyconfig.ts`**

Add imports:
```typescript
import { foundryI18nPortRegistryToken } from "@/foundry/foundrytokens";
import { foundryI18nToken, localI18nToken, i18nFacadeToken } from "@/tokens/tokenindex";
import { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import { FoundryI18nPortV13 } from "@/foundry/ports/v13/FoundryI18nPort";
import { LocalI18nService } from "@/services/LocalI18nService";
import { I18nFacadeService } from "@/services/I18nFacadeService";
import type { FoundryI18n } from "@/foundry/interfaces/FoundryI18n";
```

Add to `createPortRegistries()` return type and implementation (after settingsPortRegistry):
```typescript
const i18nPortRegistry = new PortRegistry<FoundryI18n>();
registerPortToRegistry(
  i18nPortRegistry,
  13,
  () => new FoundryI18nPortV13(),
  "FoundryI18n",
  portRegistrationErrors
);

return ok({
  gamePortRegistry,
  hooksPortRegistry,
  documentPortRegistry,
  uiPortRegistry,
  settingsPortRegistry,
  i18nPortRegistry,  // ADD THIS
});
```

Add to `registerPortInfrastructure()` (after settingsPortRegistry registration):
```typescript
const i18nRegistryResult = container.registerValue(
  foundryI18nPortRegistryToken,
  i18nPortRegistry
);
if (isErr(i18nRegistryResult)) {
  return err(`Failed to register FoundryI18n PortRegistry: ${i18nRegistryResult.error.message}`);
}
```

Add new function `registerI18nServices()` (after registerFoundryServices):
```typescript
/**
 * Registers i18n services (Foundry, Local, and Facade).
 */
function registerI18nServices(container: ServiceContainer): Result<void, string> {
  // Register FoundryI18nService
  const foundryI18nResult = container.registerClass(
    foundryI18nToken,
    FoundryI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryI18nResult)) {
    return err(`Failed to register FoundryI18nService: ${foundryI18nResult.error.message}`);
  }

  // Register LocalI18nService
  const localI18nResult = container.registerClass(
    localI18nToken,
    LocalI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localI18nResult)) {
    return err(`Failed to register LocalI18nService: ${localI18nResult.error.message}`);
  }

  // Register I18nFacadeService
  const facadeResult = container.registerClass(
    i18nFacadeToken,
    I18nFacadeService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(facadeResult)) {
    return err(`Failed to register I18nFacadeService: ${facadeResult.error.message}`);
  }

  return ok(undefined);
}
```

Update main `configureDependencies()` function to call `registerI18nServices()` before `validateContainer()`.

---

## NIEDRIG-5.7: JSON Translation Files (1 hour)

### Files to Create/Modify:

**1. Create `lang/en.json`** (new file):
```json
{
  "MODULE.SETTINGS.enableFeature.name": "Enable Feature",
  "MODULE.SETTINGS.enableFeature.hint": "Enables the feature for this module",
  "MODULE.SETTINGS.debugMode.name": "Debug Mode",
  "MODULE.SETTINGS.debugMode.hint": "Enable verbose debug logging"
}
```

**2. Extend `lang/de.json`** (add these keys):
```json
{
  "MODULE.SETTINGS.enableFeature.name": "Funktion aktivieren",
  "MODULE.SETTINGS.enableFeature.hint": "Aktiviert die Funktion für dieses Modul",
  "MODULE.SETTINGS.debugMode.name": "Debug-Modus",
  "MODULE.SETTINGS.debugMode.hint": "Ausführliche Debug-Protokollierung aktivieren"
}
```

---

## NIEDRIG-5.8: Use I18n in Settings (1 hour)

### Files to Modify:

**1. `src/core/module-settings-registrar.ts`**

Add import:
```typescript
import { i18nFacadeToken } from "@/tokens/tokenindex";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
```

Update `registerModuleSettings()` signature:
```typescript
export function registerModuleSettings(
  container: ServiceContainer,
  i18n: I18nFacadeService
): Result<void, string>
```

Replace hardcoded strings with i18n calls:
```typescript
// Old:
name: "Enable Feature",
hint: "Enables the feature for this module",

// New:
name: i18n.translate("MODULE.SETTINGS.enableFeature.name", "Enable Feature"),
hint: i18n.translate("MODULE.SETTINGS.enableFeature.hint", "Enables the feature for this module"),
```

**2. `src/core/init-solid.ts`**

Update the call to `registerModuleSettings()`:
```typescript
const i18nResult = container.resolveWithError(i18nFacadeToken);
if (!i18nResult.ok) {
  // handle error
}

const settingsResult = registerModuleSettings(container, i18nResult.value);
```

**3. `module.json`**

Add english language file to `languages` array:
```json
{
  "languages": [
    {
      "lang": "de",
      "name": "Deutsch",
      "path": "lang/de.json"
    },
    {
      "lang": "en",
      "name": "English",
      "path": "lang/en.json"
    }
  ]
}
```

---

## NIEDRIG-5.9: I18n Tests (4 hours)

### Files to Create:

**1. `src/foundry/ports/v13/__tests__/FoundryI18nPort.test.ts`**
Test scenarios:
- localize() returns translation
- format() replaces placeholders
- has() checks key existence
- Graceful degradation when game.i18n undefined

**2. `src/foundry/services/__tests__/FoundryI18nService.test.ts`**
Test scenarios:
- Port selection and lazy loading
- Delegates to port correctly
- Handles port selection errors

**3. `src/services/__tests__/LocalI18nService.test.ts`**
Test scenarios:
- loadTranslations() populates translations
- translate() returns value or key fallback
- format() replaces placeholders
- has() returns correct boolean
- Locale detection and setting

**4. `src/services/__tests__/I18nFacadeService.test.ts`**
Test scenarios:
- translate() tries Foundry first, then Local, then fallback
- format() with placeholder substitution
- has() checks both sources
- loadLocalTranslations() delegates to LocalI18nService

---

## NIEDRIG-4: Code Comments to English (6 hours)

**Scope**: ~50-100 files with German comments

**Strategy**: 
1. Search for German comments: `grep -r "\/\/ .*[äöüÄÖÜß]" src/`
2. Translate each comment to English
3. Keep user-facing strings in German
4. Keep documentation (README, ADRs) in German
5. Use ChatGPT/DeepL for batch translation if needed

**Priority Files** (start with these):
- `src/di_infrastructure/**/*.ts` (DI system)
- `src/foundry/**/*.ts` (Foundry adapters)
- `src/core/**/*.ts` (Core logic)
- `src/services/**/*.ts` (Services)

**Example Transformation**:
```typescript
// Alte Implementierung mit Singletons
// Old implementation with Singletons

// Prüfe ob Container bereits validiert wurde
// Check if container is already validated

// Fehlerbehandlung für fehlende Dependencies
// Error handling for missing dependencies
```

---

## Quality Gates (Run After Each Task)

```bash
npm run test           # All tests must pass
npm run type-check     # 0 TypeScript errors
npm run lint           # 0 lint errors
npm run test:coverage  # Maintain 100% coverage
npm run check-all      # All checks green
```

---

## Estimated Total Time Remaining

- NIEDRIG-5.6 (DI Registration): **2 hours**
- NIEDRIG-5.7 (JSON Files): **1 hour**
- NIEDRIG-5.8 (Settings Usage): **1 hour**
- NIEDRIG-5.9 (Tests): **4 hours**
- NIEDRIG-4 (Comments): **6 hours** (optional, low priority)

**Total: ~14 hours** (or ~8 hours without NIEDRIG-4)

---

## Files Already Created (Ready to Use)

✅ `src/foundry/interfaces/FoundryI18n.ts`
✅ `src/foundry/ports/v13/FoundryI18nPort.ts`
✅ `src/foundry/services/FoundryI18nService.ts`
✅ `src/services/LocalI18nService.ts`
✅ `src/services/I18nFacadeService.ts`
✅ `src/tokens/tokenindex.ts` (i18n tokens added)
✅ `src/foundry/foundrytokens.ts` (port registry token added)

---

## Next Steps

1. **Option A**: Continue in new session with fresh context
   - Use this document as roadmap
   - Start with NIEDRIG-5.6 (DI Registration)
   
2. **Option B**: Implement manually following this guide
   - Copy/paste code snippets provided
   - Run quality gates after each step
   
3. **Option C**: Skip NIEDRIG-4 (English comments)
   - Reduces remaining work to ~8 hours
   - Comments are low priority (NIEDRIG rating)

