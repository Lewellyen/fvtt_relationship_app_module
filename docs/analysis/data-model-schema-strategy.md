# Tiefenanalyse: Datenmodell & Schema-Strategie - Strategische Entscheidungen

**Status:** Diskussionsdokument
**Datum:** 2026-01-11
**Kontext:** Langfristige Projektausrichtung - Entscheidungen mit langfristigen Konsequenzen

---

## Einleitung

Diese Analyse untersucht tiefgreifend die Datenmodell- und Schema-Strategie für das Relationship Graph Modul. Während die Node-Daten-Erweiterbarkeit bereits analysiert wurde, fehlt noch eine umfassende Betrachtung der Graph-Datenstruktur, des Schema-Versioning und der Persistenz-Strategie.

**Wichtige Überlegung:** Die Datenmodell-Entscheidungen prägen die gesamte Architektur. Jede Entscheidung hat Konsequenzen für:
- Entwickler-Erfahrung (DX)
- User-Erfahrung (UX)
- Wartbarkeit
- Performance
- Migrationspfade
- Community-Erweiterungen
- Foundry-Kompatibilität

---

## Aktuelle Situation

### Was ist bereits implementiert/entschieden?

**Graph-Modell (Domain):**
```typescript
interface GraphModel {
  version: number;
  nodes: Record<string, NodeData>;
  edges: Record<string, EdgeData>;
  policy?: PolicyMap;
  factions?: Record<string, FactionDefinition>;
}
```

**Persistenz:**
- Daten werden in `JournalEntryPage.system` gespeichert
- Verwendet Foundry's native System-Struktur
- Migration-System vorhanden (MigrationV2)

**Schema-Versioning:**
- Graph-Modell hat `version` Feld (aktuell Version 2)
- Migration-Funktion `migrateToV2()` vorhanden
- Migration wird automatisch beim Laden angewendet

**Code-Referenzen:**
- `relationship-app/src/domain/types/RelationshipGraphDomain.ts` - Domain-Modelle
- `relationship-app/src/core/adapters/GraphRepositoryAdapter.ts` - Persistenz-Logik
- `relationship-app/src/core/migrations/MigrationV2.ts` - Migration-Implementierung
- `relationship-app/src/core/validation/graphSchemas.ts` - Validierungs-Schemas

### Bestehende ADRs/Entscheidungen

- ✅ **Node-Erweiterbarkeit:** Hybrid-Ansatz (Core-Schema + Extensions) empfohlen (siehe `node-data-extension-deep-analysis.md`)
- ✅ **Persistenz-Ort:** `JournalEntryPage.system` (nicht `flags`)
- ⚠️ **Schema-Versioning:** Implementiert, aber keine langfristige Strategie definiert
- ⚠️ **Graph-Erweiterbarkeit:** Nicht analysiert

### Was funktioniert gut/schlecht?

**Gut:**
- Klare Trennung zwischen Domain-Modell und Persistenz
- Migration-System funktioniert
- Validierung mit Valibot-Schemas
- System-Struktur ist Foundry-native

**Schlecht:**
- Keine klare Strategie für zukünftige Schema-Versionen
- Graph-Level Erweiterbarkeit nicht definiert
- Migration-Strategie nicht dokumentiert
- Persistenz-Strategie (system vs flags) nicht evaluiert

---

## Optionen & Alternativen

### Ansatz 1: System-Struktur (aktuell) - Weiterentwicklung

#### Vollständige Beschreibung

**Prinzip:** Graph-Daten bleiben in `JournalEntryPage.system`, Schema-Versioning wird systematisch weiterentwickelt.

**Implementation-Details:**

```typescript
// Aktuelle Struktur
JournalEntryPage.system = {
  version: 2,
  nodes: { ... },
  edges: { ... },
  policy: { ... },
  factions: { ... }
}

// Zukünftige Versionen
JournalEntryPage.system = {
  version: 3,
  nodes: { ... },
  edges: { ... },
  policy: { ... },
  factions: { ... },
  metadata: { ... } // NEU
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Foundry-native:** System-Struktur ist Standard für TypeDataModels
- ✅ **Typsicherheit:** Foundry's TypeScript-Typen unterstützen system
- ✅ **Validierung:** System wird automatisch validiert
- ✅ **Performance:** Native Foundry-Struktur, optimiert für Zugriff
- ✅ **Konsistenz:** Andere TypeDataModels nutzen ebenfalls system
- ✅ **Tooling:** Foundry-Tools unterstützen system-Struktur

**Nachteile:**
- ❌ **Modul-spezifisch:** system ist primär für Game-System-Module gedacht
- ❌ **Konflikte:** Potenzielle Konflikte mit Game-System-Modulen möglich
- ❌ **Migration-Overhead:** Schema-Änderungen erfordern Migration-Scripts
- ❌ **Begrenzt erweiterbar:** System-Struktur ist relativ statisch

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- 3-5 Graph-Versionen wahrscheinlich
- Migration-Pipeline mit 3-5 Schritten
- System-Struktur gut etabliert
- Potenzielle Konflikte mit Game-System-Modulen möglich

**Nach 5 Jahren:**
- 8-10 Graph-Versionen möglich
- Migration-Pipeline komplexer
- System-Struktur möglicherweise begrenzend für Erweiterungen
- Performance-Impact bei Migration (viele Schritte)

**Wartbarkeit:**
- Jede Version erfordert Migration-Script
- Tests für alle Versionen nötig
- Dokumentation für Breaking Changes
- Risiko: Fehler in Migration-Scripts können Daten beschädigen

**Performance:**
- Migration läuft beim Laden (einmalig pro Page)
- Bei vielen Versionen: Sequenzielle Migration (kann langsam werden)
- Cache-Strategien nötig (gemigrated Data cachen)

**Entwickler-Erfahrung:**
- Gute DX für typsichere Struktur
- Schlechte DX für schnelle Experimente (Version-Update nötig)
- Komplexität steigt mit Anzahl Versionen

**User-Erfahrung:**
- Transparent (Migration automatisch)
- Potenzielle Latenz beim ersten Laden nach Update
- Fehler bei Migration → Datenverlust möglich

#### Risiken & Mitigation

**Risiko 1: Konflikte mit Game-System-Modulen**
- **Wahrscheinlichkeit:** Mittel (abhängig von Game-System)
- **Impact:** Hoch (Daten-Konflikte, Fehlfunktionen)
- **Mitigation:** Namespace-Strategie, Dokumentation, Kompatibilitäts-Tests

**Risiko 2: Migration-Komplexität**
- **Wahrscheinlichkeit:** Hoch (nach 3+ Jahren)
- **Impact:** Hoch (Wartbarkeit, Fehler-Risiko)
- **Mitigation:** Automatisierte Tests, Backup-Strategien, Migration-Tooling

**Risiko 3: System-Struktur zu begrenzend**
- **Wahrscheinlichkeit:** Mittel (nach 2+ Jahren)
- **Impact:** Mittel (Erweiterbarkeit)
- **Mitigation:** Hybrid-Ansatz (system + flags für Erweiterungen), Plugin-System

---

### Ansatz 2: Flags-Struktur (Alternative)

#### Vollständige Beschreibung

**Prinzip:** Graph-Daten werden in `JournalEntryPage.flags[moduleId]` gespeichert, vollständige Kontrolle über Struktur.

**Implementation-Details:**

```typescript
// Flag-Struktur
JournalEntryPage.flags = {
  "fvtt_relationship_app_module": {
    graph: {
      version: 2,
      nodes: { ... },
      edges: { ... },
      policy: { ... },
      factions: { ... }
    }
  }
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Namespace-Isolation:** Keine Konflikte mit Game-System-Modulen
- ✅ **Flexibilität:** Volle Kontrolle über Datenstruktur
- ✅ **Erweiterbarkeit:** Einfacher für Plugin-System
- ✅ **Modul-spezifisch:** Klar getrennt von System-Daten

**Nachteile:**
- ❌ **Nicht-native:** Flags sind nicht der Standard für TypeDataModels
- ❌ **Typsicherheit:** Geringere TypeScript-Unterstützung
- ❌ **Validierung:** Muss selbst implementiert werden
- ❌ **Performance:** Flags können langsamer sein als system
- ❌ **Tooling:** Weniger Foundry-Tool-Unterstützung

#### Langfristige Konsequenzen

**Nach 2 Jahren:**
- Flexiblere Erweiterungen möglich
- Aber geringere Foundry-Integration
- Mehr Eigenentwicklung nötig

**Nach 5 Jahren:**
- Sehr flexibel für Erweiterungen
- Aber möglicherweise Performance-Probleme
- Höhere Wartungskosten

#### Risiken & Mitigation

**Risiko 1: Performance-Probleme**
- **Wahrscheinlichkeit:** Mittel
- **Impact:** Mittel
- **Mitigation:** Caching, Optimierungen

**Risiko 2: Geringere Foundry-Integration**
- **Wahrscheinlichkeit:** Hoch
- **Impact:** Mittel
- **Mitigation:** Eigenentwicklung, Dokumentation

---

### Ansatz 3: Hybrid-Ansatz (system + flags)

#### Vollständige Beschreibung

**Prinzip:** Core-Daten in `system`, Erweiterungen/Plugin-Data in `flags`.

**Implementation-Details:**

```typescript
// Core in system
JournalEntryPage.system = {
  version: 2,
  nodes: { ... },
  edges: { ... },
  policy: { ... }
}

// Erweiterungen in flags
JournalEntryPage.flags = {
  "fvtt_relationship_app_module": {
    extensions: { ... },
    pluginData: { ... }
  }
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Best of both worlds:** Native system + flexible flags
- ✅ **Namespace-Isolation:** Erweiterungen in flags
- ✅ **Typsicherheit:** Core-Daten in system
- ✅ **Erweiterbarkeit:** Plugin-Data in flags

**Nachteile:**
- ❌ **Komplexität:** Zwei Persistenz-Orte
- ❌ **Synchronisation:** Daten müssen zusammengeführt werden
- ❌ **Wartbarkeit:** Mehr Code, mehr Fehlerquellen

---

## Schema-Versioning-Strategie

### Option A: Einfaches Versions-Upgrade (aktuell) ✅ EMPFOHLEN

**Prinzip:** Jede Schema-Änderung führt zu neuer sequenzieller Versionsnummer (1, 2, 3, 4...), sequenzielle Migration durch alle Versionen.

**Beispiel:**
- Version 1: MVP-Schema
- Version 2: Neue Felder hinzugefügt
- Version 3: Felder umbenannt
- Version 4: Neue Struktur

**Vorteile:**
- Einfach zu verstehen (nur Versionsnummer, keine semantische Bedeutung)
- Klare Versions-Historie (jede Version ist eindeutig)
- Einfache Migration-Logik (sequenziell: 1→2→3→4)

**Nachteile:**
- Migration-Pipeline wird komplexer (bei vielen Versionen)
- Performance-Impact bei vielen Versionen (sequenzielle Migration)

### Option B: Semantisches Versioning

**Prinzip:** Major.Minor.Patch für Schema-Versionen, nur Major erfordert Migration.

**Vorteile:**
- Klarere Versions-Semantik
- Kleinere Änderungen ohne Migration

**Nachteile:**
- Komplexere Versions-Logik
- Mehr Implementierungs-Overhead

### Option C: Lazy Migration

**Prinzip:** Migration nur bei Bedarf, nicht automatisch beim Laden.

**Vorteile:**
- Bessere Performance
- Weniger Migration-Overhead

**Nachteile:**
- Komplexere Logik
- Potenzielle Inkonsistenzen

---

## Offene Fragen & Entscheidungspunkte

### 1. Persistenz-Ort: system vs flags ✅ Geklärt

**Frage:** Sollen wir bei system bleiben oder zu flags wechseln?

**✅ Entscheidung:** System-Struktur beibehalten

**Begründung:**
- system ist Single Source of Truth
- Flags können optional als Marker für Filterung verwendet werden (z.B. `flags.fvtt_relationship_app_module.isArchived` für Filterung)
- Aber: Alle Graph-Daten bleiben in system

**Optionen:**
- A: system (aktuell, beibehalten) ✅ EMPFOHLEN
- B: flags (vollständiger Wechsel) ❌ Nicht empfohlen
- C: Hybrid (system + flags) ⚠️ Nur für Marker, nicht für Daten

**Konsequenzen:**
- A: Native, Single Source of Truth, Flags optional für Marker
- B: Isoliert, aber weniger native, Daten-Migration nötig
- C: Flexibel, aber komplexer, system bleibt Single Source of Truth

**Entscheidung:** System-Struktur beibehalten, Flags optional für Marker

---

### 2. Schema-Versioning-Strategie ✅ Geklärt

**Frage:** Wie sollen Schema-Versionen verwaltet werden?

**✅ Entscheidung:** Einfaches Versions-Upgrade (sequenzielle Versionsnummern: 1, 2, 3...)

**Erklärung "Einfaches Versions-Upgrade":**
- Sequenzielle Versionsnummern ohne semantische Bedeutung (1, 2, 3, 4...)
- Jede Schema-Änderung führt zu neuer Versionsnummer
- Sequenzielle Migration durch alle Versionen (1→2→3→4)
- Keine Unterscheidung zwischen Major/Minor/Patch wie bei Semantic Versioning

**Optionen:**
- A: Einfaches Upgrade (aktuell) ✅ EMPFOHLEN
- B: Semantisches Versioning (Major.Minor.Patch) ❌ Nicht empfohlen
- C: Lazy Migration (nur bei Bedarf) ❌ Nicht empfohlen

**Entscheidung:** Einfaches Versions-Upgrade beibehalten

---

### 3. Graph-Level Erweiterbarkeit ✅ Geklärt

**Frage:** Wie sollen Graph-Level Erweiterungen (Metadata, Plugin-Data) gespeichert werden?

**✅ Entscheidung:** Graph-Level Erweiterungen in system erweitern

**Begründung:**
- system ist Single Source of Truth
- GraphModel kann erweitert werden (z.B. `metadata`, `pluginData` Felder in system)
- Konsistent mit Core-Daten (alles in system)

**Optionen:**
- A: In system (erweitert GraphModel) ✅ EMPFOHLEN
- B: In flags (separat) ❌ Nicht empfohlen (widerspricht Single Source of Truth)
- C: Hybrid (Core in system, Erweiterungen in flags) ❌ Nicht empfohlen (komplex, system bleibt Single Source of Truth)

**Entscheidung:** Graph-Level Erweiterungen in system erweitern

---

### 4. Migration-Strategie

**Frage:** Wann und wie sollen Migrationen durchgeführt werden?

**Optionen:**
- A: Beim Laden (automatisch, aktuell)
- B: Lazy (bei Bedarf)
- C: Explizit (User-Trigger)

**Entscheidungspunkt:** Migration-Strategie?

---

## Empfehlung & Begründung

### Empfehlung: System-Struktur beibehalten + systematisches Schema-Versioning

**Komponenten:**
1. **Core-Daten in system:** GraphModel (nodes, edges, policy, factions) bleibt in system (Single Source of Truth)
2. **Schema-Versioning:** Einfaches Versions-Upgrade (sequenzielle Versionsnummern: 1, 2, 3...) beibehalten, aber systematisiert
3. **Erweiterungen:** Graph-Level Erweiterungen in system erweitern (nicht flags)
4. **Flags als Marker:** Flags können optional als Marker für Filterung verwendet werden, aber system bleibt Single Source of Truth

**Begründung:**

**Für MVP:**
- ✅ System-Struktur ist bereits implementiert und funktioniert
- ✅ Foundry-native, gute Performance
- ✅ Typsicherheit durch Foundry's TypeScript-Typen
- ✅ Migration-System bereits vorhanden

**Für Langzeit:**
- ✅ System-Struktur ist Standard für TypeDataModels
- ✅ Bessere Foundry-Integration als flags
- ✅ Konsistent mit Foundry-Best-Practices
- ✅ Schema-Versioning kann systematisiert werden

**Risiken:**
- ⚠️ Potenzielle Konflikte mit Game-System-Modulen
- ⚠️ Migration-Komplexität bei vielen Versionen
- ⚠️ System-Struktur möglicherweise begrenzend

**Mitigation:**
- **Namespace-Strategie:** Klare Dokumentation, Tests mit verschiedenen Game-Systemen
- **Migration-Tooling:** Automatisierte Tests, Backup-Strategien, Migration-Validierung
- **Erweiterbarkeit:** GraphModel erweitern für neue Features (nicht flags verwenden)

**Abweichungskriterien:**
- Wenn system-Konflikte zu häufig auftreten → Hybrid-Ansatz evaluieren
- Wenn Performance-Probleme mit system auftreten → Flags evaluieren
- Wenn Erweiterbarkeit zu begrenzt → Hybrid-Ansatz evaluieren

---

## Nächste Schritte

1. **Schema-Versioning systematisiert:** Dokumentation für Migration-Prozess
2. **Graph-Level Erweiterbarkeit:** Definition für Metadata/Plugin-Data
3. **Migration-Tooling:** Automatisierte Tests, Backup-Strategien
4. **Kompatibilitäts-Tests:** Tests mit verschiedenen Game-Systemen
5. **Dokumentation:** Persistenz-Strategie dokumentieren

---

## Referenzen

- [Node-Daten-Erweiterbarkeit Analyse](./node-data-extension-deep-analysis.md)
- [JournalEntryPageSheet-Registrierung Analyse](./journal-entry-page-sheet-registration-analyse.md)
- `relationship-app/src/core/adapters/GraphRepositoryAdapter.ts` - Persistenz-Implementierung
- `relationship-app/src/core/migrations/MigrationV2.ts` - Migration-Implementierung
- `relationship-app/src/domain/types/RelationshipGraphDomain.ts` - Domain-Modelle
