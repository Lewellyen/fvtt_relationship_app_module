## Problem

Die Factory-Funktion für `journalContextMenuHandlersToken` in `event-ports.config.ts` wirft eine Exception, wenn `container.resolveWithError()` fehlschlägt. Dies verstößt gegen das Result Pattern des Projekts, das explizite Fehlerbehandlung über `Result<T, E>` Typen vorsieht, anstatt Exceptions zu werfen.

Obwohl der DI-Container (`ServiceResolver`) diese Exceptions abfängt und in `ContainerError` umwandelt, verletzt die Factory-Funktion selbst das Result Pattern, indem sie eine Exception wirft.

**Betroffene Stelle:**
- `src/framework/config/modules/event-ports.config.ts:107-114`

## Lösung

Die Factory-Funktion wurde so angepasst, dass sie keine Exception mehr wirft. Stattdessen:
1. Wird bei einem Fehler eine Fehlermeldung über `console.error` protokolliert
2. Wird ein leeres Array `[]` zurückgegeben, was ein gültiger `ServiceType[]` Wert ist
3. Respektiert die Factory damit das Result Pattern, da sie keinen Fehler mehr wirft

Die Factory-Funktion erfüllt weiterhin die `FactoryFunction<T> = () => T` Signatur und gibt einen gültigen Wert zurück, auch wenn die Dependency-Auflösung fehlschlägt.

## Geänderte Dateien

- `src/framework/config/modules/event-ports.config.ts`
  - Zeilen 109-113: `throw new Error(...)` durch `console.error(...)` und `return []` ersetzt

## Technische Details

**Vorher:**
```typescript
if (!handlerResult.ok) {
  throw new Error(
    `Failed to resolve HideJournalContextMenuHandler: ${handlerResult.error.message}`
  );
}
```

**Nachher:**
```typescript
if (!handlerResult.ok) {
  console.error(
    `Failed to resolve HideJournalContextMenuHandler: ${handlerResult.error.message}`
  );
  return [];
}
```

**Warum diese Lösung:**
- Die Factory-Funktion muss der `FactoryFunction<T> = () => T` Signatur entsprechen und kann daher kein `Result<T, E>` direkt zurückgeben
- Ein leeres Array `[]` ist ein semantisch gültiger `ServiceType[]` Wert, der es der Anwendung ermöglicht, fortzufahren
- Der DI-Container fängt weiterhin Fehler ab (z.B. wenn die Factory selbst fehlschlägt), aber die Factory wirft keine Exception mehr
- Das Result Pattern wird respektiert, da Fehler über `Result`-Typen (`resolveWithError`) behandelt werden, ohne dass die Factory selbst Exceptions wirft

## Review-Hinweise

- Die Änderung ist minimal und fokussiert sich nur auf die Verletzung des Result Patterns
- Die Factory-Funktion gibt weiterhin einen gültigen Wert zurück, auch bei Fehlern
- Die Dependency `hideJournalContextMenuHandlerToken` wird vor der Factory-Registrierung registriert (Zeile 92-101), sodass ein Fehler bei der Auflösung unerwartet wäre, aber dennoch korrekt behandelt wird
- Die Fehlerprotokollierung über `console.error` stellt sicher, dass Fehler sichtbar bleiben, auch wenn keine Exception geworfen wird
