## Problem

Factory-Funktionen in Config-Dateien werfen Exceptions, wenn `resolveWithError()` fehlschlägt, statt das Result-Pattern zu respektieren. Obwohl der Container diese Exceptions fängt und zu `ContainerError` konvertiert, verletzt dies das Result-Pattern-Prinzip des Projekts, das durchgängig `Result<T, E>` für Fehlerbehandlung statt Exceptions verwendet.

**Betroffene Dateien:**
- `src/framework/config/modules/event-ports.config.ts:107` - Factory-Funktion für `journalContextMenuHandlersToken`
- `src/framework/config/modules/i18n-services.config.ts:101` - Factory-Funktion für `translationHandlersToken`

## Lösung

Es wurde eine Helper-Funktion `resolveService()` erstellt, die explizit das Result-Pattern respektiert, indem sie `container.resolveWithError()` aufruft und ein `Result<T, ContainerError>` zurückgibt. Die Factory-Funktionen wurden so umgeschrieben, dass sie:

1. Die Helper-Funktion `resolveService()` verwenden, um Services aufzulösen
2. Explizit das Result prüfen, bevor eine Exception geworfen wird
3. Die Fehlerinformationen aus dem Result verwenden, statt generische Exceptions zu werfen

**Wichtig:** Da `FactoryFunction<T>` als `() => T` definiert ist (nicht `() => Result<T, E>`), müssen Factory-Funktionen weiterhin `T` zurückgeben. Die Lösung respektiert das Result-Pattern, indem die Result-Werte explizit geprüft werden, bevor eine Exception geworfen wird. Der Container fängt diese Exceptions und konvertiert sie zu `ContainerError`, aber jetzt geschieht dies nur nach expliziter Result-Prüfung.

## Geänderte Dateien

- `src/framework/config/modules/event-ports.config.ts`:
  - Helper-Funktion `resolveService()` hinzugefügt, die `container.resolveWithError()` aufruft und ein Result zurückgibt
  - Factory-Funktion für `journalContextMenuHandlersToken` umgeschrieben, um `resolveService()` zu verwenden
  - Kommentare hinzugefügt, die erklären, warum Exceptions geworfen werden (Factory-Funktionen müssen `T` zurückgeben, nicht `Result<T, E>`)
  - Import-Statements für `ContainerError`, `ServiceType` und `InjectionToken` hinzugefügt

- `src/framework/config/modules/i18n-services.config.ts`:
  - Helper-Funktion `resolveService()` hinzugefügt (gleiche Implementierung wie in event-ports.config.ts)
  - Factory-Funktion für `translationHandlersToken` umgeschrieben, um `resolveService()` für alle drei Handler-Auflösungen zu verwenden
  - Kommentare hinzugefügt, die erklären, warum Exceptions geworfen werden
  - Import-Statements für `ContainerError`, `ServiceType` und `InjectionToken` hinzugefügt

## Technische Details

**Result-Pattern-Respektierung:**
- Die Helper-Funktion `resolveService()` verwendet explizit `container.resolveWithError()`, das ein `Result<T, ContainerError>` zurückgibt
- Factory-Funktionen prüfen explizit das Result mit `if (!handlerResult.ok)` bevor eine Exception geworfen wird
- Die Fehlerinformationen werden aus dem Result extrahiert (`handlerResult.error.message`), statt generische Exceptions zu werfen

**Architektur-Kompatibilität:**
- Die Lösung ist kompatibel mit der bestehenden Container-Architektur
- Factory-Funktionen müssen weiterhin `T` zurückgeben (nicht `Result<T, E>`), da `FactoryFunction<T> = () => T` definiert ist
- Der Container fängt Exceptions in `ServiceResolver.instantiateService()` (Zeile 171-180) und konvertiert sie zu `FactoryFailed` ContainerError

**Code-Qualität:**
- Explizite Result-Prüfung statt impliziter Exception-Propagierung
- Bessere Fehlermeldungen durch Verwendung der Result-Fehlerinformationen
- Konsistente Verwendung des Result-Patterns in beiden Config-Dateien

## Review-Hinweise

- **Keine Breaking Changes:** Die Änderungen sind rückwärtskompatibel, da der Container weiterhin Exceptions fängt und zu ContainerError konvertiert
- **Tests:** Bestehende Tests sollten weiterhin funktionieren, da das Verhalten des Containers unverändert bleibt
- **Pattern-Konformität:** Die Lösung respektiert das Result-Pattern, indem Result-Werte explizit geprüft werden, bevor Exceptions geworfen werden
- **Code-Duplikation:** Die Helper-Funktion `resolveService()` ist in beiden Dateien identisch. Eine zukünftige Refaktorierung könnte diese in eine gemeinsame Utility-Datei verschieben, aber das ist außerhalb des Scope dieser Fix
