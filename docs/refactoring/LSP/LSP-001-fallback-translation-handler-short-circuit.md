---
ID: LSP-001
Prinzip: LSP
Schweregrad: Niedrig
Module/Layer: infrastructure/i18n
Status: Proposed
---

# 1. Problem

`FallbackTranslationHandler` erbt von `AbstractTranslationHandler`, verhält sich aber nicht wie ein „normaler“ Handler in der Chain: Er liefert **immer** ein Ergebnis zurück (Fallback oder Key) und verhindert damit die Weitergabe an nachfolgende Handler. Das ist nur korrekt, wenn er **immer** als letzter Handler eingesetzt wird – eine nicht erzwungene Vorbedingung.

# 2. Evidence (Belege)

**Pfade / Klassen**
- `src/infrastructure/i18n/AbstractTranslationHandler.ts`
- `src/infrastructure/i18n/FallbackTranslationHandler.ts`

**Konkrete Belege**
```ts
// AbstractTranslationHandler.handle delegiert bei Fehler an nextHandler
if (this.nextHandler) {
  return this.nextHandler.handle(key, data, fallback);
}
```
```ts
// FallbackTranslationHandler liefert immer ok(...) zurück
protected doHandle(...) {
  return ok(fallback ?? key);
}
```

# 3. SOLID-Analyse

LSP-Verstoß: Ein Subtyp (`FallbackTranslationHandler`) ändert die erwartete Semantik des Basistyps (nur wenn Handler „zuständig“ ist, soll er Erfolg liefern). Wird dieser Subtyp an Stellen eingesetzt, die einen regulären Handler erwarten, wird die Chain vorzeitig beendet.

# 4. Zielbild

- „Terminal/Fallback“-Handler werden explizit als letzte Stufe modelliert.
- Typisch über separates Interface (`TerminalTranslationHandler`) oder einen klaren Builder, der die Reihenfolge fixiert.

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- Neues Interface `TerminalTranslationHandler` (ohne `setNext`) und eigene Chain-Builder-API, die Fallback automatisch ans Ende setzt.

**Approach B (Alternative)**
- `FallbackTranslationHandler` nicht als `TranslationHandler` exportieren, sondern als `buildTranslationChain()`-Implementierungsdetail.

**Trade-offs**
- A schafft explizite Typen und verhindert Fehlkonfigurationen.
- B ist minimal-invasiv, aber weniger formal.

# 6. Refactoring-Schritte

1. `TerminalTranslationHandler` Interface definieren.
2. `FallbackTranslationHandler` implementiert Terminal-Interface (kein `setNext`).
3. `TranslationHandlerChain`/Builder sorgt für korrekte Reihenfolge.
4. Aufrufer migrieren: keine direkte `setNext`-Kette mit Fallback.

# 7. Beispiel-Code

**After (Builder)**
```ts
const handler = TranslationChain
  .start(foundryHandler)
  .then(localHandler)
  .withFallback(new FallbackTranslationHandler());
```

# 8. Tests & Quality Gates

- Unit: Chain-Builder setzt Fallback immer zuletzt.
- Negative Test: Fallback kann nicht als normaler Handler verkettet werden.

# 9. Akzeptanzkriterien

- Fallback-Handler kann nicht in der Mitte der Chain eingesetzt werden.
- Alle Chain-Erstellungen nutzen den Builder oder Terminal-Interface.
