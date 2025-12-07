# SRP Refactoring Plan: JournalVisibilityService

**Status:** ✅ Abgeschlossen
**Abgeschlossen:** 2025-12-05 (v0.40.17)
**Priorität:** 🔴 Hoch
**Erstellt:** 2025-01-XX
**Zweck:** Trennung der Verantwortlichkeiten in JournalVisibilityService

---

## Problem

`JournalVisibilityService` verletzt das Single Responsibility Principle (SRP) durch mehrere Verantwortlichkeiten:

1. **Business-Logik**: Versteckte Journal-Einträge abrufen und Flags prüfen
2. **DOM-Verarbeitung**: Journal-Verzeichnis HTML verarbeiten und Einträge verstecken
3. **Caching**: Cache-Operationen für versteckte Einträge
4. **Fehlerbehandlung**: Logging und Fehlerbehandlung
5. **HTML-Sanitization**: Sanitization für Log-Nachrichten

**Aktuelle Datei:** `src/application/services/JournalVisibilityService.ts`

---

## Aktuelle Verantwortlichkeiten

```typescript
export class JournalVisibilityService {
  // 1. Business-Logik: Versteckte Einträge abrufen
  getHiddenJournalEntries(): Result<JournalEntry[], JournalVisibilityError>

  // 2. DOM-Verarbeitung: Journal-Verzeichnis verarbeiten
  processJournalDirectory(htmlElement: HTMLElement): Result<void, JournalVisibilityError>

  // 3. Private Methoden für DOM-Manipulation
  private hideEntries(entries: JournalEntry[], html: HTMLElement): Result<void, JournalVisibilityError>

  // 4. HTML-Sanitization für Logs
  private sanitizeForLog(input: string): string
}
```

**Probleme:**
- Service mischt Business-Logik mit DOM-Manipulation
- Caching-Logik ist im Service eingebettet
- HTML-Sanitization sollte in Utility-Klasse
- Schwer testbar ohne DOM-Mocks

---

## Ziel-Architektur

### 1. JournalVisibilityService (Business-Logik)
**Verantwortlichkeit:** Nur Business-Logik für Journal-Sichtbarkeit

```typescript
export class JournalVisibilityService {
  /**
   * Ruft versteckte Journal-Einträge ab.
   * Delegiert Caching an CacheService.
   */
  getHiddenJournalEntries(): Result<JournalEntry[], JournalVisibilityError>

  /**
   * Prüft, ob ein Journal-Eintrag versteckt ist.
   */
  isEntryHidden(entry: JournalEntry): Result<boolean, JournalVisibilityError>

  /**
   * Setzt das Hidden-Flag für einen Eintrag.
   */
  setEntryHidden(entry: JournalEntry, hidden: boolean): Promise<Result<void, JournalVisibilityError>>
}
```

### 2. JournalDirectoryProcessor (DOM-Verarbeitung)
**Verantwortlichkeit:** Nur DOM-Manipulation und UI-Koordination

```typescript
export class JournalDirectoryProcessor {
  /**
   * Verarbeitet Journal-Verzeichnis HTML und versteckt Einträge.
   */
  processDirectory(
    htmlElement: HTMLElement,
    hiddenEntries: JournalEntry[]
  ): Result<void, JournalVisibilityError>

  /**
   * Versteckt einen einzelnen Eintrag im DOM.
   */
  private hideEntry(
    entry: JournalEntry,
    html: HTMLElement
  ): Result<void, JournalVisibilityError>
}
```

### 3. SanitizeUtils (Utility)
**Verantwortlichkeit:** HTML-Sanitization für Logs

```typescript
// Bereits vorhanden: src/application/utils/sanitize-utils.ts
// Sollte erweitert werden für Log-spezifische Sanitization
```

---

## Schritt-für-Schritt Migration

### Phase 1: JournalDirectoryProcessor extrahieren

1. **Neue Klasse erstellen:**
   ```typescript
   // src/application/services/JournalDirectoryProcessor.ts
   export class JournalDirectoryProcessor {
     constructor(
       private readonly journalDirectoryUI: JournalDirectoryUiPort,
       private readonly notifications: PlatformNotificationPort
     ) {}

     processDirectory(
       htmlElement: HTMLElement,
       hiddenEntries: JournalEntry[]
     ): Result<void, JournalVisibilityError> {
       // Migration von hideEntries()
     }
   }
   ```

2. **DI-Wrapper erstellen:**
   ```typescript
   export class DIJournalDirectoryProcessor extends JournalDirectoryProcessor {
     static dependencies = [
       journalDirectoryUiPortToken,
       platformNotificationPortToken,
     ] as const;
   }
   ```

3. **Token erstellen:**
   ```typescript
   // src/application/tokens/application.tokens.ts
   export const journalDirectoryProcessorToken: InjectionToken<JournalDirectoryProcessor> =
     createToken<JournalDirectoryProcessor>("journalDirectoryProcessor");
   ```

4. **In DI-Config registrieren:**
   ```typescript
   // src/framework/config/modules/application-services.config.ts
   container.registerClass(
     journalDirectoryProcessorToken,
     DIJournalDirectoryProcessor,
     ServiceLifecycle.SINGLETON
   );
   ```

### Phase 2: JournalVisibilityService refactoren

1. **processJournalDirectory() entfernen:**
   - Methode aus `JournalVisibilityService` entfernen
   - Use-Case aktualisieren, um `JournalDirectoryProcessor` zu nutzen

2. **Caching-Logik vereinfachen:**
   - Caching bleibt im Service (ist Teil der Business-Logik)
   - Cache-Key-Generierung über Config

3. **Sanitization entfernen:**
   - `sanitizeForLog()` entfernen
   - Direkt `sanitizeHtml()` aus Utils verwenden

### Phase 3: Use-Case aktualisieren

```typescript
// src/application/use-cases/process-journal-directory-on-render.use-case.ts
export class ProcessJournalDirectoryOnRenderUseCase implements EventRegistrar {
  constructor(
    private readonly journalEvents: PlatformJournalEventPort,
    private readonly journalVisibility: JournalVisibilityService,
    private readonly directoryProcessor: JournalDirectoryProcessor, // NEU
    private readonly notifications: PlatformNotificationPort
  ) {}

  register(): Result<void, Error> {
    const result = this.journalEvents.onJournalDirectoryRendered((event) => {
      // 1. Versteckte Einträge abrufen
      const hiddenResult = this.journalVisibility.getHiddenJournalEntries();
      if (!hiddenResult.ok) {
        this.notifications.error("Failed to get hidden entries", hiddenResult.error, {
          channels: ["ConsoleChannel"],
        });
        return;
      }

      // 2. DOM verarbeiten
      const processResult = this.directoryProcessor.processDirectory(
        event.htmlElement,
        hiddenResult.value
      );

      if (!processResult.ok) {
        this.notifications.error("Failed to process directory", processResult.error, {
          channels: ["ConsoleChannel"],
        });
      }
    });
    // ...
  }
}
```

### Phase 4: Tests aktualisieren

1. **Unit-Tests für JournalVisibilityService:**
   - Nur Business-Logik testen
   - Keine DOM-Mocks mehr nötig

2. **Unit-Tests für JournalDirectoryProcessor:**
   - DOM-Manipulation isoliert testen
   - Mock `JournalDirectoryUiPort`

3. **Integration-Tests:**
   - Use-Case-Tests mit beiden Services

---

## Breaking Changes

### API-Änderungen

1. **JournalVisibilityService:**
   - ❌ `processJournalDirectory()` entfernt
   - ✅ `isEntryHidden()` neu (optional)
   - ✅ `setEntryHidden()` neu (optional)

2. **Neue Abhängigkeiten:**
   - Use-Cases benötigen `JournalDirectoryProcessor`

### Migration für externe Nutzer

**Vorher:**
```typescript
const service = container.resolve(journalVisibilityServiceToken);
const result = service.processJournalDirectory(htmlElement);
```

**Nachher:**
```typescript
const service = container.resolve(journalVisibilityServiceToken);
const processor = container.resolve(journalDirectoryProcessorToken);

const hiddenResult = service.getHiddenJournalEntries();
if (hiddenResult.ok) {
  const processResult = processor.processDirectory(htmlElement, hiddenResult.value);
}
```

**Oder über Use-Case:**
```typescript
// Use-Case übernimmt Orchestrierung
const useCase = container.resolve(processJournalDirectoryOnRenderUseCaseToken);
useCase.register();
```

---

## Vorteile

1. ✅ **SRP-Konformität**: Jede Klasse hat eine einzige Verantwortlichkeit
2. ✅ **Bessere Testbarkeit**: Business-Logik ohne DOM-Mocks testbar
3. ✅ **Wiederverwendbarkeit**: `JournalDirectoryProcessor` für andere UI-Kontexte nutzbar
4. ✅ **Klarere Abhängigkeiten**: Explizite Dependencies statt versteckte Verantwortlichkeiten
5. ✅ **Einfachere Wartung**: Änderungen an DOM-Logik betreffen nur Processor

---

## Risiken

1. **Niedrig**: Use-Cases müssen aktualisiert werden
2. **Niedrig**: Externe API-Nutzer müssen migriert werden (wenn vorhanden)
3. **Niedrig**: Tests müssen angepasst werden

---

## Checkliste

- [x] `JournalDirectoryProcessor` Klasse erstellen
- [x] DI-Wrapper und Token erstellen
- [x] In DI-Config registrieren
- [x] `JournalVisibilityService.processJournalDirectory()` entfernen
- [x] `JournalVisibilityService.sanitizeForLog()` entfernen
- [x] Use-Case aktualisieren
- [x] Unit-Tests für `JournalDirectoryProcessor` schreiben
- [x] Unit-Tests für `JournalVisibilityService` aktualisieren
- [x] Integration-Tests aktualisieren
- [x] API-Dokumentation aktualisieren
- [x] CHANGELOG.md aktualisieren

---

## Referenzen

- **Aktuelle Implementierung:** `src/application/services/JournalVisibilityService.ts`
- **Use-Case:** `src/application/use-cases/process-journal-directory-on-render.use-case.ts`
- **Sanitize Utils:** `src/application/utils/sanitize-utils.ts`
- **Port Interface:** `src/domain/ports/journal-directory-ui-port.interface.ts`

