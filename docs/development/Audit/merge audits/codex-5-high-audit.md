## Codex-5 | High-Severity Audit Summary

**Datum:** 2025-11-06  
**Scope:** `src/`

### 1. Ungehandelte Timeout-Rejections
- **Pfad:** `src/utils/promise-timeout.ts`  
- **Fund:** `withTimeout` nutzt `Promise.race` ohne den gesetzten Timer zu räumen. Sobald das Ursprungspromise vor Ablauf des Timers erfüllt wird, löst der Timer trotzdem ein Reject aus. Das führt in Aufrufern wie `ServiceContainer.validateAsync` zu sporadischen, unbehandelten Promise-Rejections in Browser- und Node-Logs.  
- **Auswirkung:** Kritisch – instabile Bootstrap- und Validierungsabläufe; schwer diagnostizierbare Laufzeitfehler.  
- **Empfehlung:** Timeout-Wrapper so umstellen, dass der Timer nach Resolve/Reject über `clearTimeout` aufgehoben wird (klassisches Wrapper-Promise). Ergänzend einen Test schreiben, der nach frühzeitigem Resolve `vi.runAllTimers()` aufruft und auf fehlende Rejections prüft.

### 2. Inkonsistenter Container-Zustand nach Timeout
- **Pfad:** `src/di_infrastructure/container.ts` (`validateAsync`)  
- **Fund:** Auch wenn `validateAsync` wegen `withTimeout` scheitert, läuft `validationTask` weiter und setzt `validationState` wieder auf `"validated"`. Damit kann der Container als „gesund“ gelten, obwohl der Aufrufer einen Timeout-Fehler erhalten hat; Port-Metriken werden ebenfalls nicht mehr injiziert.  
- **Auswirkung:** Hoch – Race Condition, die zu falschen Health-Checks und schwer nachvollziehbaren Folgefehlern führt.  
- **Empfehlung:** Vor dem Setzen von `validationState` prüfen, ob kein Timeout markiert wurde (z. B. via Flag). Scheitert die Validierung, muss der State deterministisch `registering` bleiben. Regressionstest mit verzögerter Validierung einfügen.

### 3. Ungültige Performance-Sampling-Werte (DoS auf Telemetrie)
- **Pfad:** `src/config/environment.ts` (`performanceSamplingRate`)  
- **Fund:** `parseFloat` akzeptiert ungültige Werte als `NaN`. In `MetricsCollector.shouldSample` resultiert `Math.random() < NaN` stets in `false`, womit Sampling komplett deaktiviert wird – ohne Hinweis.  
- **Auswirkung:** Mittel – Telemetrie & Backoff verlieren Wirkung, Fehlerdiagnosen erschwert.  
- **Empfehlung:** Nach dem Parsen mit `Number.isFinite` prüfen, auf `[0,1]` clampen und bei ungültiger Eingabe auf den Default (z. B. `0.01`) zurückfallen; optional Warnung loggen. Edge-Case-Tests ergänzen.

### 4. Sampling-Schalter wird ignoriert
- **Pfad:** `src/di_infrastructure/resolution/ServiceResolver.ts`, `src/foundry/versioning/portselector.ts`  
- **Fund:** Obwohl `MetricsCollector.shouldSample()` Sampling ermöglicht, wird die Methode in produktiven Pfaden nicht genutzt; sämtliche Resolutions und Port-Selektionen werden immer erfasst.  
- **Auswirkung:** Mittel – Performance-Optimierung greift nicht, Telemetriedaten sind unnötig teuer.  
- **Empfehlung:** Vor Messpunkten `shouldSample()` prüfen und die Entscheidung für den gesamten Vorgang cachen. Tests ergänzen, um reduziertes Sampling bei <1.0 sicherzustellen.

---

**Nächste Schritte:**  
1. Fixes implementieren & Tests erweitern (`promise-timeout`, `ServiceContainer.validateAsync`, `ENV.performanceSamplingRate`, Sampling-Verbrauch).  
2. `npm run check-all` ausführen.  
3. Einfluss auf bestehende ADRs prüfen und ggf. aktualisieren.

