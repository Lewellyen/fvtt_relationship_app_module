# Installation

**Zweck:** Anleitung zur Installation des Moduls für Endnutzer
**Zielgruppe:** Endnutzer
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.43.18 (Pre-Release)

---

## Voraussetzungen

- **Foundry VTT Version 13+** (Mindestversion)
- Ältere Versionen (v10-12) werden nicht unterstützt

---

## Automatische Installation

1. Öffne Foundry VTT
2. Gehe zu **Add-on Modules**
3. Klicke **Install Module**
4. Füge die Manifest-URL ein:
   ```
   https://github.com/Lewellyen/fvtt_relationship_app_module/releases/latest/download/module.json
   ```
5. Klicke **Install**

---

## Manuelle Installation

1. Lade das Modul von [GitHub Releases](https://github.com/Lewellyen/fvtt_relationship_app_module/releases) herunter
2. Entpacke es in `<FoundryData>/modules/fvtt_relationship_app_module`
3. Starte Foundry VTT neu
4. Aktiviere das Modul in deiner Welt:
   - Einstellungen → Module
   - Aktiviere "Beziehungsnetzwerke für Foundry"

---

## Aktivierung

Nach der Installation muss das Modul in jeder Welt aktiviert werden:

1. Öffne eine Welt in Foundry VTT
2. Gehe zu **Einstellungen** → **Module**
3. Aktiviere **"Beziehungsnetzwerke für Foundry"**
4. Das Modul ist jetzt aktiv

---

## Verifizierung

Um zu prüfen, ob das Modul korrekt installiert ist:

1. Öffne die Browser-Konsole (F12)
2. Führe folgenden Code aus:
   ```javascript
   const api = game.modules.get('fvtt_relationship_app_module')?.api;
   if (api) {
     console.log('✅ Modul aktiviert, API-Version:', api.version);
   } else {
     console.error('❌ Modul nicht aktiviert');
   }
   ```

---

## Troubleshooting

### Modul erscheint nicht in der Liste

- Prüfe, ob das Modul im richtigen Verzeichnis liegt: `<FoundryData>/modules/fvtt_relationship_app_module`
- Prüfe, ob `module.json` vorhanden ist
- Starte Foundry VTT neu

### Modul lädt nicht

- Prüfe die Browser-Konsole auf Fehler (F12)
- Prüfe, ob die Foundry-Version kompatibel ist (v13+)
- Prüfe, ob alle Dependencies installiert sind (z.B. `lib-wrapper`)

### API ist nicht verfügbar

- Prüfe, ob das Modul in der Welt aktiviert ist
- Prüfe die Browser-Konsole auf Fehler
- Starte Foundry VTT neu

---

## Weitere Hilfe

Bei Problemen:
- [FAQ](./faq.md) - Häufige Fragen
- [GitHub Issues](https://github.com/Lewellyen/fvtt_relationship_app_module/issues) - Fehler melden
- Discord: `lewellyen`

---

**Letzte Aktualisierung:** 2025-01-XX
