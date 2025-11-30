## Problem

Factory-Funktionen in Config-Dateien werfen generische `Error`-Exceptions, wenn `resolveWithError()` fehlschlägt, anstatt die `ContainerError` direkt zu propagieren. Obwohl der Container diese Exceptions fängt und zu `ContainerError` konvertiert, verletzt dies das Result-Pattern-Prinzip des Projekts, da die ursprünglichen Fehlerinformationen verloren gehen und in generische `Error`-Objekte gewrappt werden.

Das Projekt verwendet durchgängig `Result<T, E>` für Fehlerbehandlung statt Exceptions. Die Factory-Funktionen sollten die `ContainerError` direkt weiterwerfen, damit der Container die ursprünglichen Fehlerinformationen erhält und korrekt behandeln kann.

## Lösung

Die Factory-Funktionen wurden so angepasst, dass sie die `ContainerError` direkt werfen, anstatt sie in generische `Error`-Objekte zu wrappen. Dies ermöglicht:

1. **Erhaltung der ursprünglichen Fehlerinformationen**: Die `ContainerError` enthalten strukturierte Informationen (Code, Message, Token-Beschreibung, etc.), die bei der Wrapperung in generische `Error`-Objekte verloren gehen würden.

2. **Konsistenz mit dem Result-Pattern**: Obwohl Factory-Funktionen aufgrund der Typdefinition `FactoryFunction<T> = () => T` nicht direkt `Result<T, E>` zurückgeben können, propagieren sie nun die `ContainerError` direkt, was dem Result-Pattern näher kommt.

3. **Bessere Fehlerbehandlung durch den Container**: Der Container fängt die geworfenen `ContainerError` und konvertiert sie in einen `ContainerError` mit Code `FactoryFailed`, behält aber die ursprünglichen Fehlerinformationen bei.

## Geänderte Dateien

- `src/framework/config/modules/i18n-services.config.ts`: 
  - Die Factory-Funktion für `translationHandlersToken` wurde angepasst, um `ContainerError` direkt zu werfen statt generische `Error`-Objekte zu erstellen.
  - Betrifft drei `resolveWithError()` Aufrufe für `foundryTranslationHandlerToken`, `localTranslationHandlerToken` und `fallbackTranslationHandlerToken`.

- `src/framework/config/modules/event-ports.config.ts`:
  - Die Factory-Funktion für `journalContextMenuHandlersToken` wurde angepasst, um `ContainerError` direkt zu werfen statt generische `Error`-Objekte zu erstellen.
  - Betrifft einen `resolveWithError()` Aufruf für `hideJournalContextMenuHandlerToken`.

## Technische Details

**Architektur-Entscheidungen:**
- **Result-Pattern**: Die Lösung respektiert das Result-Pattern, indem sie die strukturierten `ContainerError` direkt propagiert, anstatt sie in generische `Error`-Objekte zu wrappen.
- **Dependency Injection Container**: Die Lösung nutzt die vorhandene Infrastruktur des DI-Containers, der Factory-Exceptions fängt und in `ContainerError` mit Code `FactoryFailed` konvertiert.
- **Type Safety**: Die Lösung respektiert die Typdefinition `FactoryFunction<T> = () => T`, die vorschreibt, dass Factory-Funktionen den Service-Typ `T` direkt zurückgeben müssen, nicht `Result<T, E>`.

**Pattern-Verwendung:**
- **Error Propagation**: Die `ContainerError` werden direkt geworfen, um die Fehlerinformationen zu erhalten.
- **Container Error Handling**: Der Container's `ServiceResolver.instantiateService()` fängt alle Factory-Exceptions und konvertiert sie in `ContainerError` mit Code `FactoryFailed`, behält aber die ursprünglichen Fehlerinformationen bei.

## Review-Hinweise

**Breaking Changes:**
- Keine Breaking Changes. Die Änderungen sind intern und beeinflussen nur die Fehlerbehandlung innerhalb der Factory-Funktionen.

**Tests:**
- Die bestehenden Tests sollten weiterhin funktionieren, da die Fehlerbehandlung durch den Container unverändert bleibt.
- Es wird empfohlen, die Tests zu überprüfen, um sicherzustellen, dass die Fehlermeldungen noch korrekt sind.

**Besondere Überlegungen:**
- Die `ContainerError` werden nun direkt geworfen, was bedeutet, dass die Fehlermeldungen möglicherweise leicht anders aussehen könnten (aber informativer sein sollten, da die ursprünglichen Fehlerinformationen erhalten bleiben).
- Der Container fängt diese Exceptions und konvertiert sie in `ContainerError` mit Code `FactoryFailed`, behält aber die ursprünglichen Fehlerinformationen bei (über das `cause`-Feld).
