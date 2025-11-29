# Programmierfehler & Risiko-Stellen

## Ungefangene Handler-Fehler im Kontextmenü
- **Problem:** `RegisterContextMenuUseCase` ruft alle Handler direkt im Callback auf. Wirft ein Handler eine Exception (z. B. wegen fehlender Flag-Berechtigungen), propagiert der Fehler bis in libWrapper/Foundry und kann den gesamten Kontextmenü-Hook abbrechen.
- **Fundstelle:** `src/application/use-cases/register-context-menu.use-case.ts` (`register`, Callback-Zeilen).
- **Vorschlag:** Handler-Aufrufe in ein Result/Either packen oder zumindest try/catch mit Fehler-Logging und Fortsetzung nutzen, damit einzelne Handler-Ausfälle den Rest nicht blockieren.

## Unvollständiges Error-Handling bei Init-Sequenz
- **Problem:** `BootstrapInitHookService.handleInit` bricht bei fehlgeschlagenen Resolvern früh ab, ohne bereits registrierte Teilkomponenten (z. B. Notification-Channel) zurückzusetzen oder Cleanup zu triggern. Das kann inkonsistente Zustände hinterlassen, wenn spätere Resolutions fehlschlagen.
- **Fundstelle:** `src/framework/core/bootstrap-init-hook.ts` (mehrere `return`-Pfade nach Teil-Initialisierung).
- **Vorschlag:** Teilschritte über ein transaktionales Orchestrierungs-Pattern (Result-Aggregation + Cleanup pro Schritt) absichern und bei Fehlern gezielt rollbacken oder zumindest Idempotenz sicherstellen.
