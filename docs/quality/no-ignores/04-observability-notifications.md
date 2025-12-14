# Teilplan 04 – Observability & Notifications

## Scope

- `src/observability/**`
- `src/notifications/**`

Ziel: Logging-, Metrics- und Notification-Pfade sind gut getestet. Ignores sind nur für echte Environment-Aspekte (z.B. Konsole vs. Browser-Devtools) vorgesehen.

## Schritte

1. **Inventur in Observability & Notifications**
   - Alle `c8 ignore`, `type-coverage:ignore`, `eslint-disable`, `ts-ignore` in:
     - `observability-registry.ts`
     - `metrics-collector.ts`
     - `TraceContext.ts`
     - `NotificationCenter.ts`
     - `channels/ConsoleChannel.ts`, `channels/UIChannel.ts`
   - Pro Fundstelle Zweck notieren (Performance-Optimierungszweig, Fehlerpfad, reine Weiterleitung, etc.).

2. **ObservabilityRegistry**
   - Tests sicherstellen für:
     - Erfolgspfad („success“ Event → Debug-Log + Metrics),
     - Fehlerpfad („failure“ Event → Error-Log + Failure-Metrics),
     - Dispose-Pfad (unsubscribe wird aufgerufen, Fehler im unsubscribe werden geschluckt).
   - `c8 ignore` in `observability-registry.ts` entfernen, da nun durch Tests abgedeckt.

3. **MetricsCollector & TraceContext**
   - Alle branchenden Pfade (Snapshot-Erzeugung, Reset, Trace-Start/Stop) über Unit-Tests abdecken.
   - Typ-Ignores vermeiden:
     - Typen für Metrik-Snapshots und Trace-Kontexte explizit definieren, statt generische `any`/`unknown`.

4. **NotificationCenter**
   - Tests für:
     - Erfolgreiche Zustellung an mind. einen Channel.
     - Szenario „kein Channel versucht“ (mit und ohne `options.channels`).
     - Szenario „alle Channels schlagen fehl“ (aggregierte Fehlermeldung).
     - Filterung per `options.channels` (nur gewünschte Channels erhalten Notification).
   - `c8 ignore`-Reste (falls vorhanden) entfernen, da fachlich relevanter Error-/Controlflow.

5. **Channels (Console/UI)**
   - `ConsoleChannel`:
     - Tests für alle Level (debug/info/warn/error) und Mapping auf Console/Logger.
   - `UIChannel`:
     - Tests, ob UI-Notifications korrekt aufgebaut werden (Level, Message, Options).
     - Environment-spezifische Details (tatsächliches Rendern im Foundry-UI) später über E2E abdecken, ggf. mit minimalen `c8 ignore` bei direkten Foundry-Calls.

6. **Abschluss für Observability & Notifications**
   - `npm run test:coverage` ausführen.
   - Sicherstellen:
     - Hohe Coverage in `src/observability/**` und `src/notifications/**`.
     - Verbleibende Ignores sind minimal, klar kommentiert und betreffen nur direkte Interaktionen mit externer Umgebung (z.B. echte UI).


