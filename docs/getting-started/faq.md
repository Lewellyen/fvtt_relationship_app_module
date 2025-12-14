# FAQ - Häufige Fragen

**Zweck:** Häufige Fragen und Troubleshooting
**Zielgruppe:** Endnutzer, Entwickler
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.43.18 (Pre-Release)

---

## Installation

### Modul erscheint nicht in der Liste

**Ursache:** Modul wurde nicht korrekt installiert.

**Lösung:**
1. Prüfe, ob das Modul im richtigen Verzeichnis liegt: `<FoundryData>/modules/fvtt_relationship_app_module`
2. Prüfe, ob `module.json` vorhanden ist
3. Starte Foundry VTT neu

---

### Modul lädt nicht

**Ursache:** Inkompatible Foundry-Version oder fehlende Dependencies.

**Lösung:**
1. Prüfe die Browser-Konsole auf Fehler (F12)
2. Prüfe, ob die Foundry-Version kompatibel ist (v13+)
3. Prüfe, ob alle Dependencies installiert sind (z.B. `lib-wrapper`)

---

## Konfiguration

### Log-Level ändern

**Siehe:** [Konfiguration](../guides/configuration.md)

**Schnellzugriff:**
1. Einstellungen → Module-Konfiguration
2. "Beziehungsnetzwerke für Foundry" → "Log Level"
3. Wähle gewünschtes Level (DEBUG, INFO, WARN, ERROR)

---

## Entwicklung

### Build-Fehler

**Ursache:** TypeScript-Fehler, Linter-Fehler, oder Encoding-Probleme.

**Lösung:**
```bash
# Type-Check ausführen
npm run type-check

# Lint ausführen
npm run lint

# Encoding prüfen
npm run check:encoding
```

---

### Tests schlagen fehl

**Ursache:** Code-Änderungen oder Test-Konfiguration.

**Lösung:**
```bash
# Tests mit Details ausführen
npm test -- --reporter=verbose

# Spezifische Test-Datei
npm test -- container.test.ts
```

**Siehe:** [Testing](../development/testing.md)

---

## Weitere Hilfe

- [GitHub Issues](https://github.com/Lewellyen/fvtt_relationship_app_module/issues) - Fehler melden
- [Dokumentations-Index](../README.md) - Vollständige Dokumentation
- Discord: `lewellyen`

---

**Letzte Aktualisierung:** 2025-01-XX
