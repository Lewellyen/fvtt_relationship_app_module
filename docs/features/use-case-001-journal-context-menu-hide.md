# Use-Case 001: Journal Context-Menü - Journal ausblenden

**Status:** ✅ Abgeschlossen (v0.29.0)  
**Priorität:** Mittel  
**Erstellt:** 2025-01-XX  
**Abgeschlossen:** 2025-11-23  
**Kategorie:** UI/UX, Journal-Verwaltung  
**GitHub Issue:** _Noch nicht erstellt_

---

## Beschreibung

Beim Rechtsklick auf ein Journal-Eintrag im Journal-Verzeichnis soll ein neuer Menüpunkt "Journal ausblenden" hinzugefügt werden. Beim Klick auf diesen Menüpunkt wird das `hidden`-Flag des Journals auf `true` gesetzt, wodurch es im Journal-Verzeichnis ausgeblendet wird.

## Anforderungen

### Funktionale Anforderungen

1. **Context-Menü-Eintrag hinzufügen**
   - Neuer Menüpunkt "Journal ausblenden" im Context-Menü von Journal-Einträgen
   - Icon: `fa-eye-slash` (Font Awesome)
   - Position: Nach den Standard-Foundry-Menüpunkten

2. **Journal ausblenden**
   - Beim Klick auf den Menüpunkt wird `flags.fvtt_relationship_app_module.hidden = true` gesetzt
   - Das Journal wird sofort aus dem Journal-Verzeichnis entfernt (durch bestehenden Use-Case)
   - Benutzer-Feedback: Erfolgs-Notification anzeigen

3. **Fehlerbehandlung**
   - Bei Fehlern beim Setzen des Flags: Fehler-Notification anzeigen
   - Logging über NotificationCenter

### Technische Anforderungen

- **Foundry Hook:** `getJournalEntryContext` (v13)
- **Use-Case:** `RegisterJournalContextMenuUseCase` (neuer Use-Case)
- **Dependencies:**
  - `FoundryHooks` - Hook-Registrierung
  - `FoundryDocument` - Flag setzen (`setFlag`)
  - `FoundryUI` - Notifications
  - `NotificationCenter` - Logging

## Implementierungsdetails

### Use-Case-Struktur

```typescript
export class RegisterJournalContextMenuUseCase implements EventRegistrar {
  constructor(
    private readonly foundryHooks: FoundryHooks,
    private readonly foundryDocument: FoundryDocument,
    private readonly foundryUI: FoundryUI,
    private readonly notificationCenter: NotificationCenter
  ) {}

  register(): Result<void, Error> {
    // Hook registrieren: getJournalEntryContext
    // Context-Menü-Eintrag hinzufügen
  }

  dispose(): void {
    // Hook deregistrieren
  }
}
```

### Hook-Registrierung

```typescript
// Foundry Hook: getJournalEntryContext
Hooks.on('getJournalEntryContext', (html, options) => {
  options.push({
    name: 'Journal ausblenden',
    icon: '<i class="fas fa-eye-slash"></i>',
    callback: async (li) => {
      const journalId = li.data('documentId');
      const journal = game.journal.get(journalId);
      
      // Flag setzen über FoundryDocument.setFlag
      const result = await foundryDocument.setFlag(
        journal,
        'fvtt_relationship_app_module',
        'hidden',
        true
      );
      
      if (result.ok) {
        foundryUI.notify('Journal wurde ausgeblendet', 'info');
      } else {
        foundryUI.notify('Fehler beim Ausblenden des Journals', 'error');
      }
    }
  });
});
```

### Integration

1. **Token erstellen:** `registerJournalContextMenuUseCaseToken`
2. **In DI registrieren:** `event-ports.config.ts`
3. **In ModuleEventRegistrar aufnehmen:** `ModuleEventRegistrar.ts`
4. **Tests:** Unit-Tests für Use-Case, Integration-Tests für Hook-Registrierung

## Abhängigkeiten

- ✅ `FoundryHooks` Port (bereits vorhanden)
- ✅ `FoundryDocument` Port (bereits vorhanden)
- ✅ `FoundryUI` Port (bereits vorhanden)
- ✅ `NotificationCenter` (bereits vorhanden)
- ✅ `EventRegistrar` Interface (bereits vorhanden)

## Offene Fragen

- [ ] Soll der Menüpunkt nur angezeigt werden, wenn das Journal noch nicht ausgeblendet ist?
- [ ] Soll es einen separaten Menüpunkt "Journal einblenden" geben, oder wird das über Use-Case 002 gelöst?
- [ ] Welcher Scope wird für das Flag verwendet? (`fvtt_relationship_app_module` oder anderer?)

## Verwandte Use-Cases

- **Use-Case 002:** Alle unsichtbaren Journale einblenden (Button im Header)
- **Use-Case:** `InvalidateJournalCacheOnChangeUseCase` (bereits vorhanden)
- **Use-Case:** `TriggerJournalDirectoryReRenderUseCase` (bereits vorhanden)

## Definition of Done

**Status:** ✅ **ABGESCHLOSSEN in v0.29.0 (2025-11-23)**

- [x] Use-Case implementiert und getestet
- [x] Hook korrekt registriert und wieder entfernt (dispose) - via libWrapper
- [x] Flag wird korrekt gesetzt (`flags.fvtt_relationship_app_module.hidden = true`)
- [x] Journal wird nach dem Setzen ausgeblendet
- [x] Benutzer-Feedback (Notification) funktioniert
- [x] Fehlerbehandlung implementiert
- [x] Unit-Tests vorhanden
- [x] Integration-Tests vorhanden
- [x] Dokumentation aktualisiert (CHANGELOG.md v0.29.0)
- [x] Code-Review abgeschlossen

**Implementierung:** Handler-Pattern mit `HideJournalContextMenuHandler` und `RegisterContextMenuUseCase` als Orchestrator. Siehe [Context-Menu-Custom-Entry-Implementation.md](../refactoring/Context-Menu-Custom-Entry-Implementation.md) für Details.

