# Single Responsibility Principle (SRP)

## Verstöße
- **BootstrapInitHookService bündelt mehrere unzusammenhängende Aufgaben** (UI-Channel-Wiring, API-Expose, Settings-Registrierung, Logger-Konfiguration, Event- und Context-Menu-Registrierung) innerhalb einer einzigen Methode `handleInit`. Das verletzt SRP, weil Fehlerbehandlung, Infrastruktur-Verkabelung und Feature-Registrierung in einem Block gekoppelt sind.【F:src/framework/core/bootstrap-init-hook.ts†L36-L183】

## Vorschläge
- Zerlege `handleInit` in klar fokussierte Orchestratoren (z. B. `attachNotificationChannels`, `exposeApi`, `registerSettings`, `configureLogging`, `registerEvents`, `registerContextMenu`) und rufe sie sequenziell aus einer schlanken Methode auf. Jede Teilfunktion sollte nur eine Abhängigkeit besitzen und isoliert testbar sein.
- Verschiebe optionale Schritte (Context-Menu, UI-Kanal) in separate Services, die über Ports injiziert werden, damit sie unabhängig versioniert und leichter deaktiviert werden können.
