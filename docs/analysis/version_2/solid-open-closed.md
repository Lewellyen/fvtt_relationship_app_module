# Open/Closed Principle (OCP)

## Verstöße
- **TranslationHandlerChain ist auf drei Quellen fest verdrahtet** und erzwingt die Reihenfolge Foundry → Lokal → Fallback im Konstruktor. Neue Übersetzungsquellen oder alternative Reihenfolgen erfordern Codeänderungen in der Klasse statt reine Konfiguration/DI, wodurch Erweiterungen nicht ohne Modifikation möglich sind.【F:src/infrastructure/i18n/TranslationHandlerChain.ts†L12-L35】

## Vorschläge
- Ziehe einen konfigurierbaren Handler-Registrar in Betracht, der eine Liste von `TranslationHandler`-Tokens injiziert und die Verkettung dynamisch aufbaut. Damit können zusätzliche Handler (z. B. Remote-Glossar) über DI registriert werden, ohne die Klasse selbst zu ändern.
- Ergänze Integrationstests, die die Reihenfolge aus der Konfiguration ableiten, um unbeabsichtigte Änderungen an der Kette zu verhindern.
