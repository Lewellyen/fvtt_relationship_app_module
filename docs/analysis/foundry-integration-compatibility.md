# Tiefenanalyse: Foundry-Integration & Kompatibilität - Strategische Entscheidungen

**Status:** Diskussionsdokument
**Datum:** 2026-01-11
**Kontext:** Langfristige Projektausrichtung - Entscheidungen mit langfristigen Konsequenzen

---

## Einleitung

Diese Analyse untersucht tiefgreifend die Foundry-Integration und Kompatibilitäts-Strategie. Das Modul verwendet bereits ein Port-Adapter-Pattern für Version-Kompatibilität, aber es fehlt eine langfristige Strategie für Version-Support, Breaking Changes Handling und zukünftige Foundry-Versionen.

**Wichtige Überlegung:** Foundry VTT hat regelmäßige Major-Updates mit Breaking Changes. Die Entscheidungen hier prägen die langfristige Wartbarkeit und Kompatibilität des Moduls.

---

## Aktuelle Situation

### Was ist bereits implementiert/entschieden?

**Port-Adapter-Pattern:**
- ✅ Port-Interfaces (Domain Layer) - abstrakte Ports für Foundry-APIs
- ✅ Port-Registries - Version-basierte Registrierung von Port-Implementierungen
- ✅ Port-Selector - automatische Version-Erkennung und Port-Auswahl
- ✅ v13 Port-Implementierungen - konkrete Implementierungen für Foundry v13

**Version-Detection:**
- ✅ FoundryVersionDetector - erkennt aktuelle Foundry-Version
- ✅ Greedy Match Strategy - wählt höchste kompatible Version
- ✅ Lazy Instantiation - Ports werden nur bei Bedarf instanziiert

**Port-Implementierungen (v13):**
- FoundryV13GamePort
- FoundryV13DocumentPort
- FoundryV13HooksPort
- FoundryV13UIPort
- FoundryV13SettingsPort
- FoundryV13I18nPort
- FoundryV13ModulePort

**Code-Referenzen:**
- `src/infrastructure/adapters/foundry/versioning/` - Versioning-Logik
- `src/infrastructure/adapters/foundry/ports/v13/` - v13 Port-Implementierungen
- `src/infrastructure/adapters/foundry/interfaces/` - Port-Interfaces

### Was funktioniert gut/schlecht?

**Gut:**
- ✅ Saubere Trennung zwischen Domain und Infrastructure
- ✅ Port-Adapter-Pattern gut implementiert
- ✅ Version-Detection funktioniert
- ✅ Lazy Instantiation verhindert Crashes bei inkompatiblen Versionen
- ✅ Observability für Port-Selection vorhanden

**Schlecht:**
- ⚠️ Keine klare Strategie für Version-Support (wie viele Versionen?)
- ⚠️ Keine Strategie für Breaking Changes Handling
- ⚠️ Nur v13 unterstützt (keine v12/v14)
- ⚠️ Keine Dokumentation für Port-Erweiterung
- ⚠️ Keine Strategie für Deprecation von Port-Versionen

---

## Optionen & Alternativen

### Ansatz 1: N+1 Version Support

#### Vollständige Beschreibung

**Prinzip:** Unterstütze aktuelle Foundry-Version (N) + nächste Major-Version (N+1) sobald verfügbar.

**Implementation-Details:**

```typescript
// Aktuell: v13 unterstützt
// Wenn v14 released: v13 + v14 unterstützt
// Wenn v15 released: v14 + v15 unterstützt (v13 deprecated)

PortRegistry:
  - v13: FoundryV13GamePort (aktuell)
  - v14: FoundryV14GamePort (wenn v14 released)

// Port-Selector wählt automatisch passende Version
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Einfach zu warten:** Nur 2 Versionen gleichzeitig
- ✅ **Klare Migration:** Alte Version wird deprecated wenn neue released
- ✅ **Ressourcen-effizient:** Minimale Code-Duplikation
- ✅ **Schnelle Migration:** User migrieren zu neuer Version

**Nachteile:**
- ❌ **User-Frustration:** User müssen schnell updaten
- ❌ **Breaking Changes:** Keine Zeit für Graduelle Migration
- ❌ **Support-Overhead:** Häufige Version-Updates
- ❌ **Realitätsfremd:** Ignoriert, dass User auf System-/Modul-Kompatibilität warten

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- 4-5 Port-Versionen erstellt (v12, v13, v14, v15, v16)
- 2-3 Versionen gleichzeitig unterstützt
- Regelmäßige Deprecation-Cycles

**Nach 5 Jahren:**
- 10+ Port-Versionen erstellt
- Viele deprecated Versionen
- Wartbarkeit bleibt überschaubar (nur 3 aktiv)

**Wartbarkeit:**
- Mittel (3 Versionen gleichzeitig, aber notwendig)
- Regelmäßige Cleanup-Cycles nötig

**User-Erfahrung:**
- Frustrierend (häufige Updates nötig)
- Keine Flexibilität für langsame Updater

#### Risiken & Mitigation

**Risiko 1: User-Frustration**
- **Wahrscheinlichkeit:** Hoch
- **Impact:** Hoch (User verlassen Modul)
- **Mitigation:** Klare Kommunikation, Migration-Guides, Automatische Updates wo möglich

---

### Ansatz 2: N-1, N, N+1 Support (3 Versionen) ✅ EMPFOHLEN

#### Vollständige Beschreibung

**Prinzip:** Unterstütze vorherige (N-1), aktuelle (N) und nächste (N+1) Major-Version. Pragmatische Strategie basierend auf Realität: User warten auf System-/Modul-Kompatibilität.

**Implementation-Details:**

```typescript
// Beispiel: Aktuell Foundry v13
// v14 wird entwickelt (N+1)
// v12 wird noch unterstützt (N-1), weil nicht alle Systeme/Module v13-kompatibel sind
// Sobald v14 neue Hauptversion wird: v12 deprecated, v13 + v14 + v15 unterstützt

PortRegistry:
  - v12: FoundryV12GamePort (N-1, noch unterstützt)
  - v13: FoundryV13GamePort (N, aktuell)
  - v14: FoundryV14GamePort (N+1, in Entwicklung)

// Wenn v14 released und neue Hauptversion wird:
PortRegistry:
  - v13: FoundryV13GamePort (N-1, weiter unterstützt)
  - v14: FoundryV14GamePort (N, neue Hauptversion)
  - v15: FoundryV15GamePort (N+1, in Entwicklung)
// v12 wird deprecated
```

**Beispiel-Szenario:**
- **Aktuell:** Foundry v13 ist Hauptversion, v14 wird entwickelt
- **Realität:** v12 wird noch von vielen Usern verwendet (Systeme/Module noch nicht v13-kompatibel)
- **Support:** v12 (N-1) + v13 (N) + v14 (N+1, Beta) werden unterstützt
- **Wenn v14 released:** v12 wird deprecated, v13 (N-1) + v14 (N) + v15 (N+1, Beta) werden unterstützt

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **User-freundlich:** Berücksichtigt Realität (User warten auf Kompatibilität)
- ✅ **Flexibilität:** User können langsam updaten, wenn Systeme/Module bereit sind
- ✅ **Beta-Support:** N+1 ermöglicht Beta-Testing für neue Features
- ✅ **Pragmatisch:** Entspricht tatsächlicher Nutzung (alte Versionen werden weiter verwendet)
- ✅ **Kompatibilität:** Unterstützt User, die auf System-/Modul-Updates warten müssen

**Nachteile:**
- ❌ **Mehr Wartung:** 3 Versionen gleichzeitig (aber notwendig)
- ❌ **Code-Duplikation:** Mehr Port-Implementierungen (aber überschaubar)
- ❌ **Testing-Overhead:** Tests für 3 Versionen (aber durch Code-Sharing minimierbar)

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- 4-5 Port-Versionen erstellt (v12, v13, v14, v15)
- 3 Versionen gleichzeitig unterstützt (z.B. v13, v14, v15)
- Höherer Wartungsaufwand (aber notwendig für User-Kompatibilität)

**Nach 5 Jahren:**
- 10+ Port-Versionen erstellt
- 3 Versionen gleichzeitig unterstützt (z.B. v15, v16, v17)
- Wartbarkeit bleibt überschaubar (3 Versionen, aber notwendig)

**Wartbarkeit:**
- Mittel (3 Versionen gleichzeitig, aber notwendig)
- Code-Sharing minimiert Duplikation
- Automatisierung hilft bei Testing

**User-Erfahrung:**
- Sehr user-freundlich (unterstützt User, die auf Kompatibilität warten)
- Flexibilität für langsame Updater
- Realitätsnah (berücksichtigt tatsächliche Nutzung)

#### Risiken & Mitigation

**Risiko 1: Wartungs-Overhead**
- **Wahrscheinlichkeit:** Mittel (3 Versionen, aber notwendig)
- **Impact:** Mittel
- **Mitigation:** Code-Sharing minimiert Duplikation, Automatisierung für Testing, klare Support-Politik

---

### Ansatz 3: LTS Support (Long-Term Support)

#### Vollständige Beschreibung

**Prinzip:** Unterstütze aktuelle Version + LTS-Versionen (falls Foundry LTS hat) oder feste Anzahl Versionen.

**Implementation-Details:**

```typescript
// Unterstütze: aktuell + 2 vorherige Versionen (oder LTS)
PortRegistry:
  - v12: FoundryV12GamePort (LTS/alt)
  - v13: FoundryV13GamePort (aktuell)
  - v14: FoundryV14GamePort (wenn released)
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Stabilität:** LTS-Versionen länger unterstützt
- ✅ **Enterprise-freundlich:** Unternehmen bevorzugen LTS
- ✅ **Predictable:** Klare Support-Politik

**Nachteile:**
- ❌ **Komplexität:** Muss LTS-Versionen identifizieren
- ❌ **Foundry hat keine LTS:** Nur Major-Versionen

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- Abhängig von LTS-Politik
- Stabiler Support-Zyklus

**Nach 5 Jahren:**
- Langfristige Kompatibilität
- Aber möglicherweise veraltete Features

---

### Ansatz 4: Graduelle Deprecation

#### Vollständige Beschreibung

**Prinzip:** Unterstütze mehrere Versionen, aber deprecate schrittweise mit Warnungen.

**Implementation-Details:**

```typescript
// Version Support:
// - Latest: Vollständiger Support
// - Latest-1: Support mit Warnungen
// - Latest-2: Deprecated (nur Security-Fixes)
// - Älter: Nicht unterstützt

PortRegistry:
  - v12: Deprecated (nur Security)
  - v13: Supported (mit Warnungen wenn v14 released)
  - v14: Latest (vollständiger Support)
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Flexibilität:** User haben Zeit für Migration
- ✅ **Klare Kommunikation:** Deprecation-Warnungen
- ✅ **Sicherheit:** Security-Fixes für alte Versionen

**Nachteile:**
- ❌ **Komplexität:** Mehr Logik für Deprecation
- ❌ **Wartung:** Mehr Versionen zu warten

---

## Breaking Changes Handling

### Option A: Port-Versioning (aktuell)

**Prinzip:** Jede Foundry-Version bekommt eigene Port-Implementierung.

**Vorteile:**
- Klare Trennung
- Einfach zu verstehen

**Nachteile:**
- Code-Duplikation
- Maintenance-Overhead

### Option B: Feature-Flags in Ports

**Prinzip:** Ein Port mit Feature-Flags für verschiedene Versionen.

**Vorteile:**
- Weniger Code-Duplikation
- Einfachere Wartung

**Nachteile:**
- Komplexere Logik
- Schwerer zu testen

### Option C: Hybrid (Port-Versioning + Code-Sharing)

**Prinzip:** Port-Versioning, aber gemeinsamer Code wo möglich.

**Vorteile:**
- Best of both worlds
- Balance zwischen Trennung und Code-Sharing

**Nachteile:**
- Komplexität bei Code-Sharing

---

## Offene Fragen & Entscheidungspunkte

### 1. Version-Support-Strategie ✅ Geklärt

**Frage:** Wie viele Foundry-Versionen sollen gleichzeitig unterstützt werden?

**✅ Entscheidung:** N-1, N, N+1 Support (3 Versionen)

**Begründung:**
- Pragmatische Strategie basierend auf Realität
- User warten auf System-/Modul-Kompatibilität bevor sie updaten
- Beispiel: v12 wird noch verwendet, obwohl v13 aktuell ist (weil Systeme/Module noch nicht v13-kompatibel)
- Sobald N+1 neue Hauptversion wird, wird N-1 deprecated

**Optionen:**
- A: N+1 (aktuell + nächste) ❌ Nicht empfohlen (realitätsfremd)
- B: N-1, N, N+1 (3 Versionen) ✅ EMPFOHLEN
- C: LTS (wenn verfügbar) ❌ Nicht verfügbar (Foundry hat keine LTS)
- D: Graduelle Deprecation ⚠️ Teil von N-1, N, N+1

**Entscheidung:** N-1, N, N+1 Support (3 Versionen)

---

### 2. Breaking Changes Handling ✅ Geklärt

**Frage:** Wie sollen Breaking Changes in Foundry-API gehandhabt werden?

**✅ Entscheidung:** Port-Versioning (jede Version hat ihren Port)

**Begründung:**
- Jede Foundry-Version bekommt eigene Port-Implementierung
- Klare Trennung zwischen Versionen
- Bereits implementiert und bewährt

**Optionen:**
- A: Port-Versioning (aktuell) ✅ EMPFOHLEN
- B: Feature-Flags ❌ Nicht empfohlen
- C: Hybrid ❌ Nicht empfohlen

**Entscheidung:** Port-Versioning (jede Version hat ihren Port)

---

### 3. Deprecation-Strategie ✅ Geklärt

**Frage:** Wie sollen alte Port-Versionen deprecated werden?

**✅ Entscheidung:** Sofort (mit kritischen Updates für N-1)

**Begründung:**
- **N-1:** Nur noch critical updates (keine neuen Features)
- **N:** Aktiv entwickelt, vollständiger Support
- **N+1:** Wird vorbereitet sobald Ressourcen verfügbar
- **Älter als N-1:** Kein Support mehr, bleibt "as is"
  - Ports werden weiter mitgeliefert (für Kompatibilität)
  - Aber erhalten keine Wartung mehr
  - Keine Updates, keine Bug-Fixes, keine Security-Fixes

**Optionen:**
- A: Sofort (kein Support mehr) ✅ EMPFOHLEN (mit N-1 critical updates)
- B: Graduell (Warnungen, dann Removal) ❌ Nicht empfohlen
- C: LTS (längerer Support) ❌ Nicht verfügbar (Foundry hat keine LTS)

**Entscheidung:** Sofort - N-1 nur critical updates, älter als N-1 = kein Support (Ports bleiben aber im Code)

---

### 4. Testing-Strategie ✅ Geklärt

**Frage:** Wie sollen Tests für verschiedene Versionen organisiert werden?

**✅ Entscheidung:** Vollständige Tests für jeden Versioning-Port

**Begründung:**
- Jeder Port-Version wird vollständig getestet
- Sicherstellung der Funktionalität für jede unterstützte Version
- Klare Test-Abdeckung pro Version

**Optionen:**
- A: Separate Tests pro Version ✅ EMPFOHLEN
- B: Shared Tests mit Version-Parametern ❌ Nicht empfohlen
- C: Hybrid ❌ Nicht empfohlen

**Entscheidung:** Vollständige Tests für jeden Versioning-Port

---

## Empfehlung & Begründung

### Empfehlung: N-1, N, N+1 Version Support + Sofort-Deprecation + Port-Versioning

**Komponenten:**
1. **Version-Support:** N-1, N, N+1 (3 Versionen gleichzeitig)
   - N-1: Vorherige Hauptversion (nur critical updates, kein neuer Feature-Support)
   - N: Aktuelle Hauptversion (aktiv entwickelt, vollständiger Support)
   - N+1: Nächste Hauptversion (wird vorbereitet sobald Ressourcen verfügbar)
   - Älter als N-1: Kein Support mehr, Ports bleiben im Code aber erhalten keine Wartung
2. **Deprecation:** Sofort (N-1 nur critical updates, älter als N-1 = kein Support)
3. **Breaking Changes:** Port-Versioning (jede Version hat ihren Port)
4. **Testing:** Vollständige Tests für jeden Versioning-Port

**Begründung:**

**Für MVP:**
- ✅ N-1, N, N+1 ist pragmatisch (entspricht Realität)
- ✅ Port-Versioning ist bereits implementiert (jede Version hat ihren Port)
- ✅ Berücksichtigt, dass User auf System-/Modul-Kompatibilität warten
- ✅ Klare Deprecation-Politik (sofort, N-1 nur critical updates)

**Für Langzeit:**
- ✅ Wartbarkeit bleibt überschaubar (3 Versionen aktiv, N-1 nur critical, älter = kein Support)
- ✅ User-freundlich (unterstützt User, die auf Kompatibilität warten)
- ✅ Klare Support-Politik (sofortige Deprecation, keine langen Übergangsphasen)
- ✅ Vollständige Test-Abdeckung pro Port-Version

**Risiken:**
- ⚠️ Mehr Wartung (3 Versionen gleichzeitig, aber N-1 nur critical)
- ⚠️ Port-Versioning kann Code-Duplikation verursachen (aber akzeptabel)
- ⚠️ Testing-Overhead für 3 Versionen (aber notwendig für Qualität)

**Mitigation:**
- **Fokus auf N:** Hauptentwicklung auf N konzentrieren, N-1 nur critical fixes
- **Vollständige Tests:** Jeder Port wird vollständig getestet (Qualitätssicherung)
- **Klare Kommunikation:** Support-Politik dokumentieren (N-1 = nur critical, älter = kein Support)
- **Dokumentation:** Port-Erweiterungs-Guide für neue Versionen

**Beispiel:**
- **Aktuell (2026):** Foundry v13 ist Hauptversion (N), v14 wird vorbereitet (N+1)
- **Support:**
  - v12 (N-1): Nur critical updates, kein Feature-Support
  - v13 (N): Vollständiger Support, aktiv entwickelt
  - v14 (N+1): Wird vorbereitet sobald Ressourcen verfügbar
  - v11 und älter: Kein Support mehr, Ports bleiben im Code (keine Wartung)
- **Wenn v14 released (2027):**
  - v12: Kein Support mehr (wird "as is" gelassen)
  - v13 (N-1): Nur noch critical updates
  - v14 (N): Vollständiger Support, aktiv entwickelt
  - v15 (N+1): Wird vorbereitet

---

## Nächste Schritte

1. **Version-Support-Dokumentation:** Support-Politik dokumentieren (N-1 nur critical, älter = kein Support)
2. **Port-Versioning:** Jede Version hat ihren Port (bereits implementiert, beibehalten)
3. **Testing-Strategie:** Vollständige Tests für jeden Port-Version implementieren
4. **Port-Erweiterungs-Guide:** Dokumentation für neue Port-Versionen
5. **Support-Politik:** Klarstellen welche Versionen welche Art von Support erhalten

---

## Referenzen

- `src/infrastructure/adapters/foundry/versioning/portselector.ts` - Port-Auswahl
- `src/infrastructure/adapters/foundry/versioning/portregistry.ts` - Port-Registry
- `src/infrastructure/adapters/foundry/ports/v13/` - v13 Implementierungen
- Foundry VTT Versioning-Politik (externe Recherche nötig)
