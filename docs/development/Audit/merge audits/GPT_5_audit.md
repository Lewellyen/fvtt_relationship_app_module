# Audit – Foundry Relationship App (06.11.2025)

## Scope & Vorgehen
- Quellcode-Analyse des Verzeichnisses `src`
- Fokus: Architektur, Result-Pattern, Foundry-Port-Adapter, Observability, Tests
- Tools: Manuelle Review, Ripgrep
- Referenzen: ADRs 0001–0007, bestehende Audits

## Kurzüberblick
- Gesamtzustand: **fortgeschritten**, klare DI-Struktur, hohe Testabdeckung
- Hauptbefund: Promise-Timeout Utility verursacht *Unhandled Promise Rejections* bei erfolgreicher Auflösung
- Zwei weitere mittlere Risiken (Konfiguration & Regex), zwei Low-Risk-Verbesserungen

## Findings (nach Schweregrad)

### Kritisch
1. **Unhandled Promise Rejections durch `withTimeout`**
   - **Datei:** `src/utils/promise-timeout.ts`, Zeilen 39–47  
   - **Problem:** Timeout-Promise läuft weiter und löst auch bei bereits erfüllter Haupt-Promise aus ⇒ Warnungen & potenzielle Crashes (z. B. in `ServiceContainer.validateAsync`)  
   - **Empfehlung:** Timer referenzieren, bei Erfüllung/Fehlschlag `clearTimeout`. Tests ergänzen, die fehlende unhandled rejections sicherstellen.

### Mittel
2. **Ungültige Performance-Sampling-Konfiguration führt zu stummgeschalteter Telemetrie**  
   - **Datei:** `src/config/environment.ts`, Zeilen 52–55  
   - **Problem:** `parseFloat` der Env-Variable kann `NaN` ergeben ⇒ `Math.random() < NaN` immer false ⇒ keine Metriken.  
   - **Empfehlung:** Nach `parseFloat` validieren, auf Default zurückfallen und optional warnen.

3. **Regex-Sonderzeichen in `LocalI18nService.format`**  
   - **Datei:** `src/services/LocalI18nService.ts`, Zeilen 96–106  
   - **Problem:** Platzhalter (z. B. `{value+}`) erzeugen RegExp-Syntaxfehler oder falsches Matching.  
   - **Empfehlung:** Platzhalter escapieren oder auf stringbasiertes Replacement wechseln.

### Gering
4. **Locale-Erkennung ohne Effekt im lokalen i18n**  
   - **Datei:** `src/services/LocalI18nService.ts`, Zeilen 19–136  
   - **Problem:** `currentLocale` wird gesetzt, beeinflusst die Map aber nicht.  
   - **Empfehlung:** Locale-spezifische Maps oder API vereinfachen/dokumentieren.

5. **MetricsCollector erst nach Validation aktiv**  
   - **Datei:** `src/di_infrastructure/container.ts`, Zeilen 268–288  
   - **Problem:** Erste Resolutions nach `validate()` werden nicht gemessen.  
   - **Empfehlung:** `injectMetricsCollector()` awaiten oder Verhalten dokumentieren.

## Weiteres
- Tests: Fehlt ein Testfall für `withTimeout`, der unhandled rejections abfängt.  
- Docs: Empfehlung, das Laden lokaler Übersetzungen (`loadLocalTranslations`) im Boot-Flow zu dokumentieren.  
- Nach Fixes `npm run check-all` durchführen.

## Follow-up
- Ticket anlegen für Kritisch/Mittel-Findings
- Fixes umsetzen und CI erneut laufen lassen
- Danach erneutes Mini-Audit für betroffene Komponenten

