# API Changelog

Dieses Changelog dokumentiert **nur Änderungen an der Public API** (`game.modules.get('fvtt_relationship_app_module').api`).

Für interne Modul-Änderungen siehe [CHANGELOG.md](../CHANGELOG.md).

---

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Breaking Changes

---

## [API 1.0.0] - 2025-11-09

Initial Public API Release

### Added

**Tokens (9 Services):**
- `loggerToken` - Structured logging service with trace-ID support
- `journalVisibilityServiceToken` - Journal visibility management (hide/show entries)
- `foundryGameToken` - Foundry Game API wrapper (version-agnostic)
- `foundryHooksToken` - Foundry Hooks API wrapper with lifecycle management
- `foundryDocumentToken` - Foundry Document API wrapper (flags, metadata)
- `foundryUIToken` - Foundry UI API wrapper (notifications, modals)
- `foundrySettingsToken` - Foundry Settings API wrapper (get/set/register)
- `i18nFacadeToken` - Internationalization service with Foundry + Local fallback
- `foundryJournalFacadeToken` - Journal operations facade

**API Functions:**
- `resolve<T>(token: ApiSafeToken<T>): T` - Resolve service from DI container
- `getAvailableTokens(): Map<symbol, TokenInfo>` - Discover available tokens
- `getMetrics(): MetricsSnapshot` - Performance metrics (when enabled)
- `getHealth(): HealthStatus` - Module health status

**API Properties:**
- `version: "1.0.0"` - API version (independent of module version)
- `tokens: ModuleApiTokens` - Well-known tokens collection

### Features

- **Type-Safe:** Full TypeScript support with generics preserved
- **Result Pattern:** All services use `Result<T, E>` for error handling
- **Version-Agnostic:** Foundry services work across v13+ via Port-Adapter Pattern
- **Observability:** Built-in metrics and health checks
- **Token Discovery:** `getAvailableTokens()` for runtime exploration

### Design Principles

- **Minimal API Surface:** Only 9 services exposed (not all 21+ internal services)
- **API-Safe Tokens:** Internal tokens cannot be used externally
- **No Breaking Changes:** API-safe tokens prevent accidental internal token leakage
- **Backward Compatible:** Safe to add new tokens without breaking existing code

### Compatibility

- **Foundry VTT:** v13+ (tested with v13.291)
- **Module Version:** 0.10.0+
- **API Version:** 1.0.0

### Use Cases

**Example 1: Logging from External Module**
```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const logger = api.resolve(api.tokens.loggerToken);
logger.info("Hello from external module!");
```

**Example 2: I18n Integration**
```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const i18n = api.resolve(api.tokens.i18nFacadeToken);
const result = i18n.translate("myModule.greeting");
if (result.ok) {
  console.log(result.value);
}
```

**Example 3: Journal Operations**
```javascript
const api = game.modules.get('fvtt_relationship_app_module').api;
const journalFacade = api.resolve(api.tokens.foundryJournalFacadeToken);
const hiddenResult = journalFacade.getHiddenJournalEntries();
if (hiddenResult.ok) {
  console.log(`Found ${hiddenResult.value.length} hidden journals`);
}
```

### Documentation

- **Full API Documentation:** [API.md](./API.md)
- **Architecture:** [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Examples:** See API.md for comprehensive examples

---

## Versioning Strategy

### API Version vs. Module Version

- **API Version** (`api.version`): Follows semantic versioning for API changes only
- **Module Version** (`module.json`): Follows semantic versioning for all changes

**Example:**
- Module v0.9.0 (internal refactoring) → API still 1.0.0
- Module v1.1.0 (new internal feature) → API still 1.0.0
- Module v1.2.0 (new exposed token) → API 1.1.0
- Module v2.0.0 (breaking API change) → API 2.0.0

### Breaking Changes Policy

**Pre-1.0.0 (Module):**
- Breaking API changes allowed without deprecation
- Aggressive refactoring encouraged

**Post-1.0.0 (Module):**
- Breaking API changes require deprecation period
- Minimum 1 major version notice (e.g., deprecated in 1.5.0, removed in 2.0.0)
- Migration guides provided for all breaking changes
- Deprecation warnings via `markAsDeprecated()`

### Deprecation Process

1. Mark token as deprecated using `markAsDeprecated()`
2. Console warning shown on first use (once per session)
3. Token remains functional for ≥1 major version
4. Migration guide provided in API-CHANGELOG.md
5. Token removed in next major version

**Example:**
```markdown
## [API 1.5.0]
### Deprecated
- **oldLoggerToken** - Will be removed in API 2.0.0
  - Use: `loggerToken` instead
  - Migration: [link to guide]
```

---

**Last Updated:** 2025-11-09

