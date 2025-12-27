---
id: OCP-001
principle: OCP
severity: medium
layer: Infrastructure (Foundry settings)
status: Proposed
---

1. Problem

FoundrySettingsAdapter kodiert Setting-Type-Mapping und Error-Code-Mapping
als harte Verzweigungen. Neue Setting-Typen oder Foundry-Error-Codes erfordern
Aenderungen in dieser Klasse, statt nur Erweiterungen zu registrieren.

2. Evidence (Belege)

- Pfad: src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter.ts:147-166, 181-207
- Konkrete Belege:

```ts
private mapSettingType(type: SettingType): Result<typeof String | typeof Number | typeof Boolean, SettingsError> {
  if (type === "String" || type === String) return { ok: true, value: String };
  if (type === "Number" || type === Number) return { ok: true, value: Number };
  if (type === "Boolean" || type === Boolean) return { ok: true, value: Boolean };
  return { ok: false, error: { code: "SETTING_REGISTRATION_FAILED", ... } };
}

switch (foundryError.code) {
  case "API_NOT_AVAILABLE": ...
  case "VALIDATION_FAILED": ...
  case "OPERATION_FAILED": ...
  default: ...
}
```

3. SOLID-Analyse

OCP-Verstoss: Erweiterungen (neue Setting-Typen, neue Foundry-Error-Codes)
verlangen Modifikationen in der Adapter-Klasse. Das koppelt Erweiterungen an
Core-Code und erschwert Plattform-Support.

4. Zielbild

- Mapping ist daten- oder strategiegetrieben.
- Neue Typen/Fehlercodes werden ueber Registries oder Mapper injiziert.
- FoundrySettingsAdapter bleibt stabil.

5. Loesungsvorschlag

Approach A (empfohlen)
- Introduce SettingTypeMapper und SettingsErrorMapper Interfaces.
- Default-Implementationen in Infrastructure (Foundry) registrieren.
- Adapter nimmt Mapper via DI.

Approach B (Alternative)
- Verwende konfigurierbare Maps (Record/Map) und exportiere Registrierungsfunktionen.

Trade-offs
- Mehr DI-Registrierungen, aber klarere Erweiterbarkeit.

6. Refactoring-Schritte

1) Neue Mapper-Interfaces definieren (z.B. src/infrastructure/settings/mappers).
2) Default-Mappings aus FoundrySettingsAdapter in Mapper verschieben.
3) Adapter-Konstruktor erweitert (mapper injection), DI-Config anpassen.
4) Tests fuer Mapper und Adapter aktualisieren.

7. Beispiel-Code

After
```ts
interface SettingTypeMapper {
  map(type: SettingType): Result<typeof String | typeof Number | typeof Boolean, SettingsError>;
}

interface SettingsErrorMapper {
  map(error: FoundryError, ctx: { operation: "register" | "get" | "set" }): SettingsError;
}
```

8. Tests & Quality Gates

- Unit-Tests fuer Mapper (Mapping-Tabelle + neue Codes).
- Adapter-Tests mit Mock-Mappern.

9. Akzeptanzkriterien

- Neue Setting-Typen/Foundry-Error-Codes koennen ohne Aenderung am Adapter
  registriert werden.
