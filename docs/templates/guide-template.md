# Guide Template

**Zweck:** Template für Entwickler-Guides
**Zielgruppe:** Entwickler, Contributor
**Letzte Aktualisierung:** 2025-01-XX

---

## Struktur

Jeder Guide sollte folgende Struktur haben:

```markdown
# [Guide-Titel]

**Zweck:** [Kurzbeschreibung des Guides]
**Zielgruppe:** [Endnutzer/Contributor/Maintainer]
**Letzte Aktualisierung:** [YYYY-MM-DD]
**Projekt-Version:** [Version]

---

## Übersicht

[Kurze Einführung in das Thema]

---

## Voraussetzungen

- [Voraussetzung 1]
- [Voraussetzung 2]

---

## [Hauptabschnitt 1]

[Inhalt]

### Unterabschnitt

[Inhalt]

**Beispiel:**
\```typescript
// Code-Beispiel
\```

---

## [Hauptabschnitt 2]

[Inhalt]

---

## Best Practices

- [Best Practice 1]
- [Best Practice 2]

---

## Häufige Probleme

### Problem 1: [Beschreibung]

**Ursache:** [Ursache]

**Lösung:**
\```typescript
// Lösung
\```

---

## Weitere Informationen

- [Verwandter Guide 1](./related-guide.md)
- [Verwandter Guide 2](./another-guide.md)
- [Architektur-Dokumentation](../architecture/overview.md)

---

**Letzte Aktualisierung:** [YYYY-MM-DD]
```

---

## Metadaten-Header

Jeder Guide beginnt mit:

```markdown
**Zweck:** [Kurzbeschreibung]
**Zielgruppe:** [Endnutzer/Contributor/Maintainer]
**Letzte Aktualisierung:** [YYYY-MM-DD]
**Projekt-Version:** [Version]
```

---

## Code-Beispiele

**Format:**
- TypeScript mit vollständigen Imports
- Kommentare für Kontext
- Konsistente Formatierung

**Beispiel:**
\```typescript
import { ServiceContainer } from '@/infrastructure/di/container';
import { loggerToken } from '@/infrastructure/shared/tokens';

// Beispiel-Code
const container = ServiceContainer.createRoot();
const logger = container.resolve(loggerToken);
logger.info('Example');
\```

---

## Verlinkungen

**Interne Links:**
- Relative Pfade (`./`, `../`)
- Konsistente Verlinkung zwischen Docs

**Externe Links:**
- In separatem Abschnitt am Ende

---

## Verwendung

1. Kopiere dieses Template
2. Ersetze Platzhalter
3. Speichere in `docs/guides/[guide-name].md`
4. Aktualisiere `docs/guides/README.md` (falls vorhanden)
5. Verlinke von `docs/README.md` oder anderen Guides

---

**Siehe:** [Bestehende Guides](../guides/README.md)
