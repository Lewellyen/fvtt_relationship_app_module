# Dependency Inversion Principle (DIP)

## Verstöße
- **BootstrapInitHookService hängt direkt vom konkreten `ServiceContainer` ab** und löst innerhalb der Init-Phase zahlreiche Tokens manuell auf. Dadurch wird das Framework-Layer fest an die DI-Implementierung gekoppelt und kann nicht gegen einen alternativen Container/Resolver getauscht werden.【F:src/framework/core/bootstrap-init-hook.ts†L36-L141】

## Vorschläge
- Führe ein schlankes `ContainerPort`-Interface ein (resolve/register), das vom Framework genutzt wird und im DI-Layer adaptiert wird. So bleibt das Framework gegen alternative Container (oder Test-Doubles) austauschbar.
- Kapsle die Token-Auflösungen in spezialisierte Orchestratoren, die nur die benötigten Ports injizieren (z. B. `NotificationBootstrapper`, `SettingsBootstrapper`). Dadurch sinkt die direkte Abhängigkeit vom Container und der Init-Service konsumiert nur abstrahierte Ports.
