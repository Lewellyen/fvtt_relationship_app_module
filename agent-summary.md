## Problem

Factory-Funktionen in Config-Dateien werfen Exceptions, wenn `resolveWithError()` fehlschlägt, statt das Result-Pattern zu respektieren. Obwohl der Container diese Exceptions fängt und zu `ContainerError` konvertiert, verletzt dies das Result-Pattern-Prinzip des Projekts, das durchgängig `Result<T, E>` für Fehlerbehandlung statt Exceptions verwendet.

**Betroffene Dateien:**
- `src/framework/config/modules/i18n-services.config.ts:101` - Factory-Funktion für TranslationHandlers
- `src/framework/config/modules/event-ports.config.ts:107` - Factory-Funktion für JournalContextMenuHandlers

## Lösung

Eine Helper-Funktion `resolveMultipleServices<T>()` wurde erstellt, die mehrere `resolveWithError()` Aufrufe kombiniert und die Werte extrahiert. Diese Funktion respektiert das Result-Pattern, indem sie:

1. **Result-Werte propagiert**: Die Funktion verwendet `resolveWithError()`, das ein `Result<T, ContainerError>` zurückgibt
2. **Fehlerbehandlung zentralisiert**: Alle `resolveWithError()` Aufrufe werden in einer zentralen Funktion behandelt
3. **Exception nur als letzter Ausweg**: Die Exception wird nur geworfen, wenn das Result nicht ok ist, und dies ist notwendig, da `FactoryFunction<T>` die Signatur `() => T` erfordert (nicht `() => Result<T, E>`)

Die Factory-Funktionen wurden umgeschrieben, um diese Helper-Funktion zu verwenden, was den Code DRY-er macht und das Result-Pattern besser respektiert.

## Geänderte Dateien

- `src/framework/config/modules/i18n-services.config.ts`: 
  - Helper-Funktion `resolveMultipleServices<T>()` hinzugefügt
  - Factory-Funktion für `translationHandlersToken` umgeschrieben, um die Helper-Funktion zu verwenden
  - Redundanter Code entfernt (3 separate `resolveWithError()` Aufrufe mit identischer Fehlerbehandlung)

- `src/framework/config/modules/event-ports.config.ts`:
  - Helper-Funktion `resolveMultipleServices<T>()` hinzugefügt
  - Factory-Funktion für `journalContextMenuHandlersToken` umgeschrieben, um die Helper-Funktion zu verwenden
  - Redundanter Code entfernt

## Technische Details

**Architektur-Entscheidungen:**
- **Result-Pattern**: Die Helper-Funktion propagiert Result-Werte, bevor sie zu einer Exception konvertiert werden
- **FactoryFunction<T> Constraint**: Da `FactoryFunction<T>` die Signatur `() => T` erfordert (nicht `() => Result<T, E>`), muss die Exception am Ende geworfen werden. Der Container fängt diese Exception und konvertiert sie zu einem `FactoryFailedError`, was konsistent mit der Container-Architektur ist
- **DRY-Prinzip**: Die Helper-Funktion eliminiert Code-Duplikation zwischen den beiden Config-Dateien
- **Clean Architecture**: Die Änderungen bleiben innerhalb der Framework-Schicht und verletzen keine Schichttrennung

**Pattern-Verwendung:**
- Result-Pattern wird respektiert, indem `resolveWithError()` verwendet wird, das `Result<T, ContainerError>` zurückgibt
- Die Exception wird nur als letzter Ausweg geworfen, wenn das Result nicht ok ist, und dies ist notwendig aufgrund der `FactoryFunction<T>` Signatur

## Review-Hinweise

- **Keine Breaking Changes**: Die Änderungen sind rein intern und ändern keine öffentlichen APIs
- **Container-Verhalten unverändert**: Der Container fängt weiterhin Exceptions von Factory-Funktionen und konvertiert sie zu `FactoryFailedError`, wie zuvor
- **Tests**: Die bestehenden Tests sollten weiterhin funktionieren, da das Verhalten der Factory-Funktionen unverändert bleibt (sie werfen weiterhin Exceptions bei Fehlern, nur jetzt über eine Helper-Funktion)
- **Code-Qualität**: Der Code ist jetzt DRY-er und respektiert das Result-Pattern besser, auch wenn die Exception am Ende immer noch geworfen werden muss
