## Problem

Die Application Layer importierte `createInjectionToken` direkt aus der Infrastructure Layer (`@/infrastructure/di/tokenutilities`), was eine Architekturverletzung des Dependency Inversion Principle (DIP) darstellt. Die Application Layer sollte nicht von konkreten Infrastructure-Implementierungen abhängen.

**Betroffene Datei:**
- `src/application/tokens/domain-ports.tokens.ts:7` - Importierte `createInjectionToken` aus Infrastructure

## Lösung

Die DI-Utilities (`createInjectionToken` und `InjectionToken` Type) wurden in einen gemeinsamen Shared-Bereich verschoben: `@/infrastructure/shared/di/`. Dieser Bereich kann von allen Layern (Application, Infrastructure, Framework) genutzt werden, ohne DIP-Verletzungen zu verursachen.

**Architektur-Entscheidung:**
- `infrastructure/shared` ist bereits als gemeinsamer Bereich etabliert (wird bereits von Application Layer genutzt)
- Die Verschiebung nach `infrastructure/shared/di/` ermöglicht es der Application Layer, Token zu erstellen, ohne von konkreten Infrastructure-Implementierungen abzuhängen
- Die alten Dateien wurden als Re-Exports beibehalten für Rückwärtskompatibilität mit bestehendem Infrastructure-Code

## Geänderte Dateien

- `src/infrastructure/shared/di/injection-token.ts`: **NEU** - `InjectionToken` Type Definition
- `src/infrastructure/shared/di/token-utilities.ts`: **NEU** - `createInjectionToken` Funktion
- `src/infrastructure/shared/di/index.ts`: **NEU** - Export-Datei für den Shared DI-Bereich
- `src/application/tokens/domain-ports.tokens.ts`: Import aktualisiert von `@/infrastructure/di/tokenutilities` zu `@/infrastructure/shared/di`
- `src/application/tokens/application.tokens.ts`: Import aktualisiert von `@/infrastructure/di/tokenutilities` zu `@/infrastructure/shared/di`
- `src/application/health/__tests__/container-health-check.test.ts`: Import aktualisiert von `@/infrastructure/di/tokenutilities` zu `@/infrastructure/shared/di`
- `src/infrastructure/di/tokenutilities.ts`: Umgewandelt zu Re-Export mit `@deprecated` Markierung für Rückwärtskompatibilität
- `src/infrastructure/di/types/core/injectiontoken.ts`: Umgewandelt zu Re-Export mit `@deprecated` Markierung für Rückwärtskompatibilität

## Technische Details

**Clean Architecture & DIP:**
- Die Application Layer kann jetzt Token erstellen, ohne von konkreten Infrastructure-Implementierungen abzuhängen
- `infrastructure/shared` ist bereits als gemeinsamer Bereich etabliert und wird von der Application Layer genutzt
- Die Lösung respektiert die Schichttrennung der Clean Architecture

**Rückwärtskompatibilität:**
- Alle bestehenden Infrastructure-Imports funktionieren weiterhin durch Re-Exports
- Keine Breaking Changes für bestehenden Code
- Schrittweise Migration möglich: Application Layer nutzt neue Location, Infrastructure Layer kann später migriert werden

**Type Safety:**
- Alle Type-Definitionen (`InjectionToken`, `ServiceType`) bleiben unverändert
- Vollständige Type-Safety wird beibehalten

## Review-Hinweise

- ✅ **Keine Breaking Changes**: Alle bestehenden Imports funktionieren weiterhin
- ✅ **Linter-Clean**: Keine Linter-Fehler in den geänderten Dateien
- ✅ **Architektur-konform**: Lösung respektiert Clean Architecture und DIP
- ⚠️ **Deprecation**: Die alten Dateien sind als `@deprecated` markiert, sollten aber langfristig entfernt werden
- 📝 **Migration**: Infrastructure-Layer-Code kann schrittweise auf die neue Location migriert werden (optional, nicht zwingend)

**Empfehlung für zukünftige Arbeit:**
- Neue Code sollte immer `@/infrastructure/shared/di` verwenden
- Bestehender Infrastructure-Code kann schrittweise migriert werden (nicht zwingend, da Re-Exports funktionieren)
