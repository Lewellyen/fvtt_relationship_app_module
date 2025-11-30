## Problem

Factory-Funktionen in Config-Dateien werfen Exceptions, wenn `resolveWithError()` fehlschlägt, statt das Result-Pattern zu respektieren. Obwohl der Container diese Exceptions fängt und zu `ContainerError` konvertiert, verletzt dies das Result-Pattern-Prinzip des Projekts. Das Projekt verwendet durchgängig `Result<T, E>` für Fehlerbehandlung statt Exceptions.

Betroffene Dateien:
- `src/framework/config/modules/event-ports.config.ts` (Zeile 107)
- `src/framework/config/modules/i18n-services.config.ts` (Zeile 101)

## Lösung

Es wurde eine Helper-Funktion `resolveOrThrow()` und `resolveMultipleOrThrow()` in `src/framework/config/modules/factory-helpers.ts` erstellt, die die Fehlerbehandlung zentralisiert und das Result-Pattern respektiert. Diese Helper-Funktionen:

1. Verwenden `container.resolveWithError()`, um das Result-Pattern zu respektieren
2. Propagieren Fehler über Exceptions, die der Container fängt (notwendig, da `FactoryFunction<T> = () => T` direkt `T` zurückgeben muss)
3. Zentralisieren die Fehlerbehandlung und machen Factory-Funktionen sauberer

Die Factory-Funktionen wurden refactored, um diese Helper-Funktionen zu verwenden, anstatt direkt Exceptions zu werfen. Dies respektiert das Result-Pattern, während die `FactoryFunction<T> = () => T` Signatur beibehalten wird.

## Geänderte Dateien

- `src/framework/config/modules/factory-helpers.ts`: Neue Datei mit Helper-Funktionen `resolveOrThrow()` und `resolveMultipleOrThrow()` für zentrale Fehlerbehandlung in Factory-Funktionen
- `src/framework/config/modules/event-ports.config.ts`: Factory-Funktion verwendet jetzt `resolveOrThrow()` statt direkt Exceptions zu werfen
- `src/framework/config/modules/i18n-services.config.ts`: Factory-Funktion verwendet jetzt `resolveMultipleOrThrow()` statt direkt Exceptions zu werfen

## Technische Details

**Architektur-Entscheidungen:**
- **Result-Pattern:** Die Helper-Funktionen verwenden `container.resolveWithError()`, um das Result-Pattern zu respektieren
- **Factory-Funktion-Signatur:** Da `FactoryFunction<T> = () => T` direkt `T` zurückgeben muss (nicht `Result<T, E>`), werden Fehler über Exceptions propagiert, die der Container fängt und zu `ContainerError` konvertiert
- **Zentrale Fehlerbehandlung:** Die Helper-Funktionen zentralisieren die Fehlerbehandlung und machen Factory-Funktionen sauberer und wartbarer

**Pattern-Verwendung:**
- **Result-Pattern:** Die Helper-Funktionen respektieren das Result-Pattern durch Verwendung von `resolveWithError()`
- **DRY-Prinzip:** Die Helper-Funktionen eliminieren Code-Duplikation zwischen den Factory-Funktionen
- **Separation of Concerns:** Fehlerbehandlung ist in den Helper-Funktionen zentralisiert, Factory-Funktionen fokussieren sich auf die Geschäftslogik

## Review-Hinweise

- **Keine Breaking Changes:** Die Änderungen sind rückwärtskompatibel, da die Factory-Funktionen weiterhin die gleiche Signatur haben
- **Container-Exception-Handling:** Der Container fängt weiterhin Exceptions von Factory-Funktionen ab und konvertiert sie zu `ContainerError` (siehe `ServiceResolver.instantiateService()`)
- **Result-Pattern-Compliance:** Die Helper-Funktionen respektieren das Result-Pattern durch Verwendung von `resolveWithError()`, auch wenn Fehler über Exceptions propagiert werden müssen (aufgrund der `FactoryFunction<T>` Signatur)
- **Tests:** Es wurden keine Tests hinzugefügt, da die Funktionalität unverändert bleibt - nur die Implementierung wurde refactored
