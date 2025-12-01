## Problem

Die private Methode `mapSettingType()` in `foundry-settings-adapter.ts` (Zeile 123) wirft eine Exception, wenn ein unbekannter `SettingType` übergeben wird. Diese Exception wird in `register()` nicht abgefangen, wodurch `register()` manchmal eine Exception statt eines `Result<void, SettingsError>` zurückgibt. Dies verletzt das Result-Pattern, da alle erwartbaren Fehler als `Result<T, E>` zurückgegeben werden sollten.

## Lösung

Die Methode `mapSettingType()` wurde so umgestellt, dass sie ein `Result<typeof String | typeof Number | typeof Boolean, SettingsError>` zurückgibt, anstatt eine Exception zu werfen. In der `register()`-Methode wird das Result von `mapSettingType()` nun behandelt: Wenn die Typ-Mappierung fehlschlägt, wird der Fehler direkt als `SettingsError` mit dem Code `SETTING_REGISTRATION_FAILED` zurückgegeben.

## Geänderte Dateien

- `src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter.ts`: 
  - `mapSettingType()` gibt jetzt ein `Result` zurück statt eine Exception zu werfen
  - `register()` behandelt das Result von `mapSettingType()` und gibt bei Fehlern ein `Result<void, SettingsError>` zurück
  - Die Fehlermeldung wurde verbessert und enthält nun auch Details über den unbekannten Typ

## Technische Details

- **Result-Pattern**: Die Lösung folgt dem Result-Pattern (ADR-0001), das im Projekt durchgängig verwendet wird. Alle erwartbaren Fehler werden als `Result<T, E>` zurückgegeben, anstatt Exceptions zu werfen.
- **Clean Architecture**: Die Änderung bleibt innerhalb der Infrastructure-Schicht und verletzt keine Schichttrennung.
- **Fehlerbehandlung**: Der Fehlercode `SETTING_REGISTRATION_FAILED` ist konsistent mit anderen Registrierungsfehlern in der Klasse.

## Review-Hinweise

- Die Änderung ist rückwärtskompatibel: Alle gültigen `SettingType`-Werte funktionieren weiterhin wie zuvor
- Bei ungültigen Typen wird jetzt ein strukturierter Fehler zurückgegeben statt einer Exception
- Keine Breaking Changes: Die öffentliche API (`register()`) bleibt unverändert, nur die interne Implementierung wurde verbessert
- Tests sollten weiterhin funktionieren, da nur die interne Fehlerbehandlung geändert wurde
