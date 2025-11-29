# Single Responsibility Principle (SRP)

## Gefundene Verstöße

1. **Monolithische Init-Sequenz** – `BootstrapInitHookService.handleInit` orchestriert UI-Benachrichtigungen, API-Expose, Settings-Registrierung, Logger-Konfiguration, Event-Registrierung und libWrapper-/Use-Case-Registrierungen in einem einzigen Schritt. Der Service übernimmt damit mehrere kohäsionsfremde Verantwortlichkeiten (UI-Wiring, API-Setup, Settings, Observability, Event-Wiring) und koppelt die Abläufe eng aneinander.
   - Folgen: erschwerte Testbarkeit, hohes Änderungsrisiko, fehlende Wiederverwendbarkeit der einzelnen Phasen.
   - Fundstelle: `src/framework/core/bootstrap-init-hook.ts` (`handleInit`).

## Verbesserungsvorschläge

- Zerlege `handleInit` in klar abgegrenzte Orchestratoren (z. B. `registerNotifications`, `configureLogging`, `registerEvents`, `registerContextMenu`) und injiziere sie über Ports/Use-Cases statt direktem Container-Zugriff. So bleibt jede Klasse bei einem Grund verantwortlich und kann separat getestet werden.
- Verschiebe plattformspezifische Logik in Adapter-Schichten und halte den Init-Orchestrator frei von konkreten Implementierungen. Dies erhöht Kohäsion und erleichtert zukünftige Anpassungen (z. B. weitere UI-Kanäle oder neue Hooks).
