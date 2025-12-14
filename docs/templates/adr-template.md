# ADR Template

**Zweck:** Template für Architecture Decision Records (ADRs)
**Zweckgruppe:** Architekten, Maintainer
**Letzte Aktualisierung:** 2025-01-XX

---

## Format

Jedes ADR sollte folgende Struktur haben:

```markdown
# ADR-XXXX: [Kurzer Titel]

**Status:** [Proposed | Accepted | Rejected | Deprecated | Superseded]
**Datum:** [YYYY-MM-DD]
**Entscheider:** [Name/Rolle]
**Kontext:** [Warum ist diese Entscheidung nötig?]

---

## Kontext

[Beschreibung der Situation, die eine Entscheidung erfordert]

---

## Entscheidung

[Die getroffene Entscheidung]

---

## Konsequenzen

### Positive

- [Vorteil 1]
- [Vorteil 2]

### Negative

- [Nachteil 1]
- [Nachteil 2]

### Neutral

- [Neutrale Auswirkung 1]

---

## Alternativen

### Alternative 1: [Name]

[Beschreibung]

**Vorteile:**
- [Vorteil]

**Nachteile:**
- [Nachteil]

**Warum nicht gewählt:**
[Begründung]

---

### Alternative 2: [Name]

[Beschreibung]

**Vorteile:**
- [Vorteil]

**Nachteile:**
- [Nachteil]

**Warum nicht gewählt:**
[Begründung]

---

## Referenzen

- [Link zu verwandten ADRs]
- [Link zu Dokumentation]
- [Link zu GitHub Issues/PRs]

---

## Notizen

[Optionale zusätzliche Notizen, historische Kontext, etc.]

---

**Letzte Aktualisierung:** [YYYY-MM-DD]
```

---

## Naming-Konvention

**Dateiname:** `XXXX-[kebab-case-title].md`

**Beispiele:**
- `0001-use-result-pattern-instead-of-exceptions.md`
- `0002-custom-di-container-instead-of-tsyringe.md`
- `0003-port-adapter-for-foundry-version-compatibility.md`

**Nummerierung:**
- Sequenziell (0001, 0002, 0003, ...)
- Keine Lücken (außer bei gelöschten ADRs)

---

## Status-Werte

- **Proposed**: Vorschlag, noch nicht entschieden
- **Accepted**: Entscheidung getroffen und umgesetzt
- **Rejected**: Entscheidung abgelehnt
- **Deprecated**: Entscheidung veraltet, wird durch neues ADR ersetzt
- **Superseded**: Entscheidung durch anderes ADR ersetzt

---

## Verwendung

1. Kopiere dieses Template
2. Ersetze Platzhalter
3. Speichere als `docs/decisions/XXXX-[title].md`
4. Aktualisiere `docs/decisions/README.md`

---

**Siehe:** [Bestehende ADRs](../decisions/README.md)
