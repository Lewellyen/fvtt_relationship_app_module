# Feature-Ideen & Use-Cases

Dieses Verzeichnis dokumentiert geplante Features und Use-Cases, die **nicht** Refactoring betreffen.

> **Hinweis:** Refactoring-Pläne findest du in [`docs/refactoring/`](../refactoring/).

---

## Workflow: Lokale Dokumentation ↔ GitHub Issues

### Zwei-Phasen-Ansatz

1. **Phase 1: Lokale Dokumentation** (`docs/features/`)
   - Detaillierte technische Planung
   - Architektur-Entscheidungen
   - Implementierungsdetails
   - Für interne Entwicklung und Diskussion

2. **Phase 2: GitHub Issue** (optional, aber empfohlen)
   - Community-Feedback einholen
   - Priorisierung und Tracking
   - Verlinkung zur lokalen Dokumentation
   - Für öffentliche Diskussion und Community-Input

### Workflow-Schritte

```
1. Feature-Idee entsteht
   ↓
2. Lokale Dokumentation erstellen (docs/features/use-case-XXX.md)
   ↓
3. Technische Details ausarbeiten (intern)
   ↓
4. GitHub Issue erstellen (optional)
   - Link zur lokalen Dokumentation
   - Zusammenfassung für Community
   - Feedback einholen
   ↓
5. Implementierung starten
   - Status in lokaler Dokumentation: 🚧 In Arbeit
   - Issue-Link in Dokumentation ergänzen
   ↓
6. Feature abgeschlossen
   - Status: ✅ Abgeschlossen
   - GitHub Issue schließen
```

### GitHub Issue erstellen

Wenn ein Feature bereit für Community-Feedback ist:

#### Option 1: Über GitHub CLI (Empfohlen)

**Voraussetzungen:**
- GitHub CLI installiert: https://cli.github.com/
- Authentifiziert: `gh auth login`

**Schritte:**
```bash
# 1. Issue aus Feature-Dokumentation erstellen
npm run issue:create docs/archive/use-case-001-journal-context-menu-hide.md
# oder direkt:
node scripts/create-feature-issue.mjs docs/archive/use-case-001-journal-context-menu-hide.md

# 2. Issue-Nummer automatisch zur Dokumentation hinzufügen
npm run issue:link docs/archive/use-case-001-journal-context-menu-hide.md 123
# oder direkt:
node scripts/update-feature-issue-link.mjs docs/archive/use-case-001-journal-context-menu-hide.md 123
```

Das Script:
- ✅ Liest die Feature-Dokumentation
- ✅ Extrahiert Titel, Beschreibung, Status, Priorität
- ✅ Erstellt GitHub Issue mit Link zur Dokumentation
- ✅ Zeigt die Issue-URL an

#### Option 2: Über GitHub UI

1. **Issue erstellen** über GitHub UI mit Template: `Feature Request`
2. **Link zur lokalen Dokumentation** in der Issue-Beschreibung:
   ```markdown
   ## Technische Dokumentation
   
   Detaillierte technische Planung: [`docs/features/use-case-XXX.md`](../../docs/features/use-case-XXX.md)
   ```
3. **Issue-Nummer in lokaler Dokumentation** manuell ergänzen:
   ```markdown
   **GitHub Issue:** [#123](https://github.com/.../issues/123)
   ```

---

## Struktur

Jede Feature-Idee oder Use-Case wird in einer eigenen Markdown-Datei dokumentiert:

- **Dateinamen:** `use-case-XXX-kurze-beschreibung.md` oder `feature-XXX-kurze-beschreibung.md`
- **Format:** Siehe Vorlage unten
- **Status:** 📋 Geplant | 🚧 In Arbeit | ✅ Abgeschlossen | ❌ Verworfen

---

## Verfügbare Use-Cases

### Use-Case 001: Journal Context-Menü - Journal ausblenden
**Datei:** [`use-case-001-journal-context-menu-hide.md`](../archive/use-case-001-journal-context-menu-hide.md) (✅ Abgeschlossen - Archiviert)  
**Status:** ✅ **Abgeschlossen (v0.29.0)** - Archiviert  
**Beschreibung:** Context-Menü-Eintrag zum Ausblenden eines Journals beim Rechtsklick.

### Use-Case 002: Button "Alle Journale einblenden" im Journal-Verzeichnis-Header
**Datei:** [`use-case-002-show-all-hidden-journals-button.md`](./use-case-002-show-all-hidden-journals-button.md)  
**Status:** 📋 Geplant  
**Beschreibung:** Button im Journal-Verzeichnis-Header zum Einblenden aller versteckten Journale.

---

## Vorlage für neue Features

```markdown
# Use-Case XXX: Kurze Beschreibung

**Status:** 📋 Geplant  
**Priorität:** Niedrig | Mittel | Hoch  
**Erstellt:** YYYY-MM-DD  
**Kategorie:** UI/UX | Journal-Verwaltung | ...

---

## Beschreibung

Kurze Beschreibung des Features/Use-Cases.

## Anforderungen

### Funktionale Anforderungen
- ...

### Technische Anforderungen
- ...

## Implementierungsdetails

...

## Abhängigkeiten

- ✅ Service X (bereits vorhanden)
- ❌ Service Y (muss erstellt werden)

## Offene Fragen

- [ ] Frage 1
- [ ] Frage 2

## Verwandte Use-Cases

- Use-Case YYY: ...

## Definition of Done

- [ ] ...
```

---

## Status-Legende

- 📋 **Geplant:** Feature ist dokumentiert, aber noch nicht implementiert
- 🚧 **In Arbeit:** Feature wird aktuell implementiert
- ✅ **Abgeschlossen:** Feature ist implementiert und getestet
- ❌ **Verworfen:** Feature wird nicht umgesetzt (Grund dokumentieren)

---

## Verwandte Dokumentation

- **Roadmaps:** [`docs/roadmaps/`](../roadmaps/) - Langfristige Planung
- **Refactoring:** [`docs/refactoring/`](../refactoring/) - Refactoring-Pläne
- **ADRs:** [`docs/adr/`](../adr/) - Architecture Decision Records

