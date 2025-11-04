# Migration Guide

Dieser Guide hilft dir beim Upgrade zwischen Major- und Minor-Versionen des Modules.

---

## 🔮 Geplante Änderungen (Version 1.0.0)

Die folgenden Breaking Changes sind für Version 1.0.0 geplant:

### 1. MetricsCollector API-Änderung

**Aktuell (0.0.x)**:
```typescript
const metrics = MetricsCollector.getInstance();
```

**Geplant (1.0.0)**:
```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;
const metrics = api.resolve(api.tokens.metricsCollectorToken);
```

**Begründung**: Singleton-Pattern wird durch DI ersetzt für bessere Testbarkeit.

### 2. ServiceRegistration Type-Änderung

**Aktuell**: Interface mit optionalen Properties  
**Geplant**: Discriminated Union für Type-Safety

Dies ist eine interne Änderung und betrifft nur direkte Container-Erweiterungen.

### 3. Minimale Node.js-Version

**Aktuell**: Node.js 18+  
**Geplant**: Node.js 20+ (LTS)

---

## v0.0.14 → v0.0.15 (Aktuell)

### 🚨 Breaking Changes

#### 1. FoundryHooks API erweitert

**Änderung**: Das `FoundryHooks`-Interface wurde erweitert mit `once()` und geänderten Rückgabewerten.

**Vorher (v0.0.14)**:
```typescript
interface FoundryHooks {
  on(hook: string, callback: Function): Result<void, FoundryError>;
  off(hook: string, callback: Function): Result<void, FoundryError>;
}
```

**Nachher (v0.0.15)**:
```typescript
interface FoundryHooks {
  on(hook: string, callback: Function): Result<number, FoundryError>;
  once(hook: string, callback: Function): Result<number, FoundryError>;
  off(hook: string, callbackOrId: Function | number): Result<void, FoundryError>;
}
```

**Migration**:

```typescript
// Alt: on() gab void zurück
const hooksService = api.resolve(api.tokens.foundryHooksToken);
const result = hooksService.on('updateActor', callback);
// result.value war undefined

// Neu: on() gibt Hook-ID zurück
const result = hooksService.on('updateActor', callback);
if (result.ok) {
  const hookId = result.value; // number!
  // Später deregistrieren mit ID
  hooksService.off('updateActor', hookId);
}
```

**Auswirkung**: 
- ✅ Bestehender Code funktioniert weiter (Rückgabewert kann ignoriert werden)
- ⚠️ Wenn du den Rückgabewert verwendest, musst du von `void` auf `number` umstellen
- ⚠️ `off()` akzeptiert jetzt auch Hook-IDs als zweiten Parameter

#### 2. Multi-Version-Support Dokumentation korrigiert

**Änderung**: Dokumentation wurde angepasst - Modul unterstützt offiziell nur Foundry VTT v13+.

**Vorher**: Dokumentation erwähnte Kompatibilität mit v10-12  
**Nachher**: Klare Mindestanforderung von v13+

**Migration**:
- Keine Code-Änderungen erforderlich
- Falls du v10-12 nutzt: Upgrade auf Foundry VTT v13 erforderlich
- Bessere Fehlermeldung beim Start auf alten Versionen

#### 3. Logger-Konfiguration (Nicht-Breaking)

**Änderung**: Logger respektiert jetzt `ENV.logLevel`.

**Auswirkung**: 
- ✅ Production-Builds haben jetzt weniger Logs
- ✅ Debug-Mode funktioniert korrekt
- Keine Migration erforderlich

#### 4. Foundry Settings Integration (Neues Feature)

**Änderung**: Modul bietet jetzt eine Foundry-Setting für Log-Level-Steuerung.

**Neue Features**:
- UI-Einstellung in Modul-Konfiguration
- `foundrySettingsToken` in API verfügbar
- onChange-Hook aktualisiert Logger sofort
- Unterstützung für alle Scopes (world, client, user)

**Nutzung**:
```typescript
// Über UI: Einstellungen → Module-Konfiguration → Log Level

// Über API:
const api = game.modules.get('fvtt_relationship_app_module').api;
const settings = api.resolve(api.tokens.foundrySettingsToken);
await settings.set('fvtt_relationship_app_module', 'logLevel', 0); // DEBUG
```

**Auswirkung**: 
- ✅ Log-Level kann zur Laufzeit geändert werden
- ✅ Keine Code-Änderung für Debugging nötig
- ✅ Änderungen werden sofort aktiv
- Keine Migration erforderlich (neue Funktionalität)

---

## v0.0.13 → v0.0.14

### Änderungen

- Performance-Optimierung: Journal-Entry-Caching implementiert
- StructuredLoggerService entfernt (nur ConsoleLoggerService aktiv)

### Migration

Keine Breaking Changes.

---

## v0.0.12 → v0.0.13

### Änderungen

- Hook-Kompatibilität verbessert (jQuery + HTMLElement)
- Child-Scope Registrierungen

### Migration

Keine Breaking Changes.

---

## Allgemeine Upgrade-Hinweise

### Vor dem Upgrade

1. **Backup erstellen**: Sichere deine Foundry-Daten
2. **Tests ausführen**: Falls du das Modul programmatisch nutzt
3. **Changelog lesen**: Siehe `docs/development/foundry/releases/`

### Nach dem Upgrade

1. **Module-Cache leeren**: Foundry neu starten
2. **Browser-Cache leeren**: Strg+F5 in Foundry
3. **Tests ausführen**: Falls du externe Integration hast

### Bei Problemen

1. Console öffnen (F12) und Fehler prüfen
2. Issue auf GitHub erstellen mit:
   - Foundry Version
   - Modul Version
   - Error-Logs
   - Reproduktions-Schritte

---

## API-Kompatibilität

### Semantic Versioning

Dieses Modul folgt [Semantic Versioning](https://semver.org/):

- **MAJOR** (x.0.0): Breaking Changes
- **MINOR** (0.x.0): Neue Features (rückwärtskompatibel)
- **PATCH** (0.0.x): Bugfixes

### Breaking Change Policy

Breaking Changes werden **nur** in MAJOR-Versionen eingeführt, mit folgenden Ausnahmen:

- ⚠️ **Vor 1.0.0**: Minor-Versionen können Breaking Changes enthalten (Development-Phase)
- 🔒 **Ab 1.0.0**: Strikte Semantic Versioning

### Deprecation Policy

Features, die entfernt werden sollen:

1. Werden als `@deprecated` markiert
2. Bleiben mindestens 1 Minor-Version erhalten
3. Loggen Warnungen bei Verwendung
4. Werden in Major-Version entfernt

**Beispiel**: `PortRegistry.getAvailablePorts()` ist seit v0.0.14 deprecated:
```typescript
/**
 * @deprecated Use getFactories() with PortSelector.selectPortFromFactories() instead.
 */
getAvailablePorts(): Map<number, T>
```

---

## Support

Bei Fragen zur Migration:

- **Discord**: lewellyen
- **Email**: forenadmin.tir@gmail.com
- **Issues**: [GitHub Issues](link-hier-einfügen)

---

**Letzte Aktualisierung**: 2025-01-03 (v0.0.15)

