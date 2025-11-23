# Use-Case 002: Button "Alle Journale einblenden" im Journal-Verzeichnis-Header

**Status:** 📋 Geplant  
**Priorität:** Mittel  
**Erstellt:** 2025-01-XX  
**Kategorie:** UI/UX, Journal-Verwaltung  
**GitHub Issue:** _Noch nicht erstellt_

---

## Beschreibung

Im Header des Journal-Verzeichnisses soll ein Button "Alle Journale einblenden" hinzugefügt werden. Beim Klick auf diesen Button werden alle Journale, die das `hidden`-Flag auf `true` haben, auf `false` gesetzt, wodurch sie wieder im Journal-Verzeichnis sichtbar werden.

## Anforderungen

### Funktionale Anforderungen

1. **Button im Header**
   - Button "Alle Journale einblenden" im Journal-Verzeichnis-Header
   - Icon: `fa-eye` (Font Awesome)
   - Position: Rechts im Header, nach dem Standard-Foundry-Header-Content
   - Sichtbarkeit: Immer sichtbar (auch wenn keine versteckten Journale vorhanden sind)

2. **Alle Journale einblenden**
   - Beim Klick werden alle Journale mit `flags.fvtt_relationship_app_module.hidden = true` gefunden
   - Für jedes Journal wird `hidden = false` gesetzt
   - Journale werden sofort im Journal-Verzeichnis angezeigt (durch bestehenden Use-Case)
   - Benutzer-Feedback: Erfolgs-Notification mit Anzahl der eingeblendeten Journale

3. **Fehlerbehandlung**
   - Bei Fehlern beim Setzen der Flags: Fehler-Notification anzeigen
   - Teilweise erfolgreiche Updates: Anzahl erfolgreich/fehlgeschlagen anzeigen
   - Logging über NotificationCenter

### Technische Anforderungen

- **Foundry Hook:** `renderJournalDirectory` (bereits vorhanden für andere Use-Cases)
- **Use-Case:** `RegisterShowAllHiddenJournalsButtonUseCase` (neuer Use-Case)
- **Dependencies:**
  - `FoundryHooks` - Hook-Registrierung
  - `FoundryGame` - Alle Journale abrufen
  - `FoundryDocument` - Flag setzen (`setFlag`)
  - `FoundryUI` - Notifications und DOM-Manipulation
  - `NotificationCenter` - Logging

## Implementierungsdetails

### Use-Case-Struktur

```typescript
export class RegisterShowAllHiddenJournalsButtonUseCase implements EventRegistrar {
  private registrationId: EventRegistrationId | undefined;

  constructor(
    private readonly foundryHooks: FoundryHooks,
    private readonly foundryGame: FoundryGame,
    private readonly foundryDocument: FoundryDocument,
    private readonly foundryUI: FoundryUI,
    private readonly notificationCenter: NotificationCenter
  ) {}

  register(): Result<void, Error> {
    // Hook registrieren: renderJournalDirectory
    // Button in Header einfügen
  }

  dispose(): void {
    // Hook deregistrieren
    // Button entfernen (falls nötig)
  }
}
```

### Hook-Registrierung

```typescript
// Foundry Hook: renderJournalDirectory
Hooks.on('renderJournalDirectory', (app, html, data) => {
  // Button nur einmal hinzufügen (Prüfung auf bereits vorhanden)
  if (html.find('.show-all-hidden-journals-btn').length > 0) {
    return;
  }

  // Button erstellen
  const button = $('<button class="show-all-hidden-journals-btn">')
    .html('<i class="fas fa-eye"></i> Alle Journale einblenden')
    .on('click', async () => {
      await handleShowAllHiddenJournals();
    });

  // Button in Header einfügen
  const header = html.find('.directory-header');
  if (header.length > 0) {
    header.append(button);
  } else {
    // Fallback: Am Anfang der Liste einfügen
    html.find('.directory-list').before(button);
  }
});
```

### Logik: Alle versteckten Journale einblenden

```typescript
async function handleShowAllHiddenJournals(): Promise<void> {
  // Alle Journale abrufen
  const journalsResult = foundryGame.getJournalEntries();
  if (!journalsResult.ok) {
    foundryUI.notify('Fehler beim Abrufen der Journale', 'error');
    return;
  }

  const journals = journalsResult.value;
  let successCount = 0;
  let errorCount = 0;

  // Für jedes Journal prüfen, ob hidden-Flag gesetzt ist
  for (const journal of journals) {
    const flagResult = foundryDocument.getFlag(
      journal,
      'fvtt_relationship_app_module',
      'hidden',
      v.boolean()
    );

    if (flagResult.ok && flagResult.value === true) {
      // Flag auf false setzen
      const setResult = await foundryDocument.setFlag(
        journal,
        'fvtt_relationship_app_module',
        'hidden',
        false
      );

      if (setResult.ok) {
        successCount++;
      } else {
        errorCount++;
        notificationCenter.error(
          `Fehler beim Einblenden von Journal: ${journal.name}`,
          setResult.error,
          { channels: ['ConsoleChannel'] }
        );
      }
    }
  }

  // Benutzer-Feedback
  if (successCount > 0) {
    foundryUI.notify(
      `${successCount} Journal${successCount > 1 ? 'e' : ''} wurde${successCount > 1 ? 'n' : ''} eingeblendet`,
      'info'
    );
  }

  if (errorCount > 0) {
    foundryUI.notify(
      `${errorCount} Journal${errorCount > 1 ? 'e' : ''} konnte${errorCount > 1 ? 'n' : ''} nicht eingeblendet werden`,
      'warning'
    );
  }

  // Journal-Verzeichnis neu rendern
  foundryUI.rerenderJournalDirectory();
}
```

### CSS-Styling (optional)

```css
.show-all-hidden-journals-btn {
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  cursor: pointer;
}

.show-all-hidden-journals-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}
```

### Integration

1. **Token erstellen:** `registerShowAllHiddenJournalsButtonUseCaseToken`
2. **In DI registrieren:** `event-ports.config.ts`
3. **In ModuleEventRegistrar aufnehmen:** `ModuleEventRegistrar.ts`
4. **Tests:** Unit-Tests für Use-Case, Integration-Tests für Button-Rendering

## Abhängigkeiten

- ✅ `FoundryHooks` Port (bereits vorhanden)
- ✅ `FoundryGame` Port (bereits vorhanden)
- ✅ `FoundryDocument` Port (bereits vorhanden)
- ✅ `FoundryUI` Port (bereits vorhanden)
- ✅ `NotificationCenter` (bereits vorhanden)
- ✅ `EventRegistrar` Interface (bereits vorhanden)

## Offene Fragen

- [ ] Soll der Button nur angezeigt werden, wenn versteckte Journale vorhanden sind?
- [ ] Soll der Button deaktiviert werden, wenn keine versteckten Journale vorhanden sind?
- [ ] Soll es eine Bestätigungs-Dialog geben, wenn viele Journale eingeblendet werden sollen?
- [ ] Welcher Scope wird für das Flag verwendet? (`fvtt_relationship_app_module` oder anderer?)
- [ ] Soll der Button auch im leeren Journal-Verzeichnis angezeigt werden?

## Verwandte Use-Cases

- **Use-Case 001:** Journal Context-Menü - Journal ausblenden
- **Use-Case:** `InvalidateJournalCacheOnChangeUseCase` (bereits vorhanden)
- **Use-Case:** `TriggerJournalDirectoryReRenderUseCase` (bereits vorhanden)
- **Use-Case:** `ProcessJournalDirectoryOnRenderUseCase` (bereits vorhanden)

## Alternative Lösungen (verworfen)

### ❌ Context-Menü im leeren Journal-Verzeichnis
- **Problem:** Foundry VTT unterstützt kein Context-Menü für leere Bereiche
- **Status:** Technisch nicht möglich

### ❌ Separater Menüpunkt im Journal-Verzeichnis-Context-Menü
- **Problem:** Unklar, ob `getJournalDirectoryContext` Hook existiert
- **Status:** Nicht geprüft, Button-Lösung bevorzugt

## Definition of Done

- [ ] Use-Case implementiert und getestet
- [ ] Hook korrekt registriert und wieder entfernt (dispose)
- [ ] Button wird korrekt im Header eingefügt
- [ ] Button-Funktionalität funktioniert (alle versteckten Journale werden gefunden)
- [ ] Flags werden korrekt gesetzt (`flags.fvtt_relationship_app_module.hidden = false`)
- [ ] Journale werden nach dem Setzen angezeigt
- [ ] Benutzer-Feedback (Notification) funktioniert mit korrekter Anzahl
- [ ] Fehlerbehandlung implementiert (teilweise erfolgreiche Updates)
- [ ] Journal-Verzeichnis wird nach dem Einblenden neu gerendert
- [ ] Unit-Tests vorhanden
- [ ] Integration-Tests vorhanden
- [ ] E2E-Tests vorhanden (Button-Klick, Journale werden sichtbar)
- [ ] Dokumentation aktualisiert (CHANGELOG.md)
- [ ] Code-Review abgeschlossen

