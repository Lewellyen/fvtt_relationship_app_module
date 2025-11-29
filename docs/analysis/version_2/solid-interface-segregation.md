# Interface Segregation Principle (ISP)

## Verstöße
- **PlatformUIPort bündelt heterogene Verantwortungen** (DOM-Manipulation via `removeJournalElement`, UI-Refresh über `rerenderJournalDirectory`, User-Benachrichtigung via `notify`) in einer einzigen Schnittstelle. Konsumenten müssen HTML-DOM-Fähigkeiten mitladen, auch wenn sie nur Notifications benötigen, wodurch Interfaces nicht auf minimale Rollen zugeschnitten sind.【F:src/domain/ports/platform-ui-port.interface.ts†L24-L55】

## Vorschläge
- Spalte die Schnittstelle in domänenspezifische Ports auf, z. B. `JournalDirectoryUiPort` für DOM-Operationen und `NotificationPort` für Benachrichtigungen. Adapter können beide implementieren, während Konsumenten nur die benötigten Ports injizieren.
- Ergänze Validierungstests, die sicherstellen, dass Adapter-Implementierungen nur die jeweils relevanten Ports bereitstellen und keine überflüssigen DOM-Typen in Domain-Services einschleusen.
