# Bootflow & Ports

Dieses Modul nutzt einen zweiphasigen Bootstrap:

1) Vor Foundry `init`
   - `CompositionRoot.bootstrap()` erstellt den DI-Container und konfiguriert Basis-Registrierungen.
   - Bei Fehler wird abgebrochen (throw), keine Hooks werden registriert.

2) In Foundry `init`
   - `CompositionRoot.exposeToModuleApi()` stellt `game.modules.get(MODULE_ID).api.resolve` bereit.
   - Ports werden (falls benötigt) selektiert/gebunden und anschließend Hooks über `ModuleHookRegistrar.registerAll(...)` registriert.

3) In Foundry `ready`
   - Nur leichtes Logging/Startaktionen; Services sind über `api.resolve` verfügbar.

Hinweise:
- Externe Nutzung erhält ausschließlich `resolve(token)`, kein Container-Objekt.
- Guards: Hooks/game werden auf Verfügbarkeit geprüft (`typeof Hooks/game !== "undefined"`) in `init-solid.ts` und Ports.
- Ports: Genau eine Factory je Version pro Registry (v13 Game, v13 Hooks, etc.); `PortSelector` wählt höchste kompatible Version.
- Siehe auch `docs/jsdoc-styleguide.md` für Dokumentationskonventionen.

