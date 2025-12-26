---
id: LSP-001
principle: LSP
severity: medium
layer: Infrastructure (Foundry settings)
status: Proposed
---

1. Problem

PlatformSettingsPort akzeptiert ValidationSchema<T>, aber FoundrySettingsAdapter
akzeptiert faktisch nur ValibotValidationSchema via instanceof-Check. Dadurch
sind andere ValidationSchema-Implementierungen nicht substituierbar, obwohl sie
das gleiche Interface erfuellen.

2. Evidence (Belege)

- Pfad: src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter.ts:88-107
- Konkrete Belege:

```ts
get<T>(namespace: string, key: string, schema: ValidationSchema<T>): Result<T, SettingsError> {
  if (!(schema instanceof ValibotValidationSchema)) {
    return { ok: false, error: { code: "SETTING_VALIDATION_FAILED", ... } };
  }
  const valibotSchema = schema.getValibotSchema();
  return this.foundrySettings.get(namespace, key, valibotSchema);
}
```

3. SOLID-Analyse

LSP-Verstoss: Der Adapter erwartet ein konkretes Subtyp-Verhalten, das im
Interface nicht garantiert ist. Ein anderes ValidationSchema kann nicht
substituiert werden, obwohl die Signatur dies verspricht.

4. Zielbild

- ValidationSchema ist austauschbar und nicht an Valibot gebunden.
- FoundrySettingsAdapter nutzt eine abstrakte Validierungsstrategie oder
  konvertiert schema-agnostisch.

5. Loesungsvorschlag

Approach A (empfohlen)
- ValidationSchema bekommt eine standardisierte Methode wie `validate(value)`
  oder `parse(value)`; FoundrySettingsAdapter liest raw value und validiert
  danach (Validation bleibt im Adapter, aber ohne concrete type check).

Approach B (Alternative)
- Introduce ValidationSchemaAdapter Registry in Infrastructure, die
  ValidationSchema -> platform-specific schema konvertiert.

Trade-offs
- Approach A reduziert coupling, erfordert evtl. Aenderung am FoundrySettings-Port.
- Approach B behaelt FoundrySettings-Port, fuehrt aber ein Adapter-Registry ein.

6. Refactoring-Schritte

1) ValidationSchema Interface erweitern (z.B. validate/parse).
2) FoundrySettings-Port erweitern um raw-get oder Validation in Adapter verschieben.
3) FoundrySettingsAdapter umstellen, kein instanceof mehr.
4) Tests fuer Valibot und alternative Schema-Implementierungen hinzufuegen.

7. Beispiel-Code

After
```ts
interface ValidationSchema<T> {
  validate(value: unknown): Result<T, SettingsError>;
}

const raw = this.foundrySettings.getRaw(namespace, key);
return schema.validate(raw);
```

8. Tests & Quality Gates

- Unit-Test: Adapter akzeptiert mindestens zwei ValidationSchema-Implementierungen.
- Regression-Test: Valibot bleibt kompatibel.

9. Akzeptanzkriterien

- FoundrySettingsAdapter verwendet kein instanceof ValibotValidationSchema.
- Jede ValidationSchema-Implementierung ist substituierbar.
