---
ID: DIP-001
Prinzip: DIP
Schweregrad: Hoch
Module/Layer: application/settings, domain/ports
Status: Proposed
---

# 1. Problem

Die Application Layer definiert Settings-Konfigurationen mit Foundry-spezifischen Typen (Scopes, Constructor-Typen, `game.settings`-Optionen). Dadurch hängt die Application Layer an Plattformdetails und erschwert alternative Plattformen (Roll20, Headless, Tests).

# 2. Evidence (Belege)

**Pfade / Klassen**
- `src/application/settings/setting-definition.interface.ts` (`SettingConfig`)

**Konkrete Belege**
```ts
export interface SettingConfig<T> {
  scope: "client" | "world";
  type: NumberConstructor | StringConstructor | BooleanConstructor;
}
```
`SettingConfig` beschreibt Foundry-spezifische API-Details und lebt in der Application Layer.

# 3. SOLID-Analyse

DIP-Verstoß: Die Application Layer hängt von konkreten Framework-Details (Foundry Settings-API) ab, statt nur von abstrahierten Ports/DTOs. Die Abhängigkeitsrichtung ist falsch, die Application Layer ist nicht plattform-agnostisch.

# 4. Zielbild

- Domain/Application definieren eine plattformneutrale `DomainSettingDefinition`.
- Infrastructure/Framework mappen diese Definitionen auf Foundry-Config.
- Application kennt keine Foundry-spezifischen Typen.

# 5. Lösungsvorschlag

**Approach A (empfohlen)**
- `SettingConfig` in eine Infrastruktur-spezifische Foundry-Config verschieben.
- In der Application Layer nur `DomainSettingConfig` verwenden (Scope als Domain-Enum, Type als Domain-Primitive).
- Adapter in Infrastructure übersetzt Domain -> Foundry.

**Approach B (Alternative)**
- `SettingConfig` in `framework/` verschieben und Application nutzt nur abstrakte Factory/Port.

**Trade-offs**
- A erzwingt klare Port-Grenzen, erfordert Migration aller Settings.
- B reduziert Migration, aber hält Implementation näher an Framework.

# 6. Refactoring-Schritte

1. `DomainSettingConfig` (domain/types) definieren: `scope: "user" | "client" | "world"`, `type: "string" | "number" | "boolean"`.
2. `SettingDefinition` auf Domain-Config umstellen.
3. Foundry-Adapter: Mapping Domain-Config → Foundry `SettingConfig`.
4. `ModuleSettingsRegistrar` auf Domain-Config umstellen.
5. Settings-Definitionen migrieren.
6. Entferne Foundry-spezifische Typen aus Application.

# 7. Beispiel-Code

**Before**
```ts
export interface SettingConfig<T> {
  scope: "client" | "world";
  type: NumberConstructor | StringConstructor | BooleanConstructor;
}
```

**After**
```ts
export type DomainSettingType = "string" | "number" | "boolean";
export type DomainSettingScope = "client" | "world" | "user";

export interface DomainSettingConfig<T> {
  scope: DomainSettingScope;
  type: DomainSettingType;
}
```

# 8. Tests & Quality Gates

- Unit: Mapping Domain-Config → Foundry-Config (Infrastructure).
- Typecheck: Application darf keine Foundry-Typen importieren.
- Arch-Lint: `application/settings` darf nicht auf `infrastructure/adapters/foundry` verweisen.

# 9. Akzeptanzkriterien

- Application Layer enthält keine Foundry-spezifischen Settings-Typen.
- Foundry-spezifische Details liegen ausschließlich im Infrastructure/Framework Layer.
- Neue Plattform kann Settings registrieren ohne Änderungen in `application/settings`.
