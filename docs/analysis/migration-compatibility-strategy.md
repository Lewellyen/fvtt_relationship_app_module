# Tiefenanalyse: Migration- & Kompatibilitäts-Strategie - Strategische Entscheidungen

**Status:** Diskussionsdokument
**Datum:** 2026-01-11
**Kontext:** Langfristige Projektausrichtung - Entscheidungen mit langfristigen Konsequenzen

---

## Einleitung

Diese Analyse untersucht tiefgreifend die Migration- und Kompatibilitäts-Strategie für das Relationship Graph Modul. Während Schema-Versioning bereits teilweise analysiert wurde, fehlt noch eine umfassende Strategie für Schema-Migration, Foundry-Version-Migration und Modul-Version-Migration.

**Wichtige Überlegung:** Migration-Strategien prägen die User-Experience und Datenintegrität langfristig. Entscheidungen hier haben Konsequenzen für Datenverlust-Risiko, User-Frustration und Wartbarkeit.

---

## Aktuelle Situation

### Was ist bereits implementiert/entschieden?

**Schema-Migration:**
- ✅ MigrationV2 vorhanden (siehe `relationship-app/src/core/migrations/MigrationV2.ts`)
- ✅ Graph-Version-Feld vorhanden
- ⚠️ Keine systematische Migration-Strategie

**Foundry-Version-Migration:**
- ✅ Port-Adapter-Pattern für Version-Kompatibilität
- ⚠️ Keine explizite Migration-Strategie

**Modul-Version-Migration:**
- ⚠️ Keine Strategie für Modul-Version-Updates

**Code-Referenzen:**
- `relationship-app/src/core/migrations/MigrationV2.ts` - Migration-Implementierung
- `src/infrastructure/adapters/foundry/versioning/` - Foundry-Versioning

### Was funktioniert gut/schlecht?

**Gut:**
- ✅ Migration-System vorhanden
- ✅ Port-Adapter-Pattern für Foundry-Kompatibilität

**Schlecht:**
- ⚠️ Keine systematische Migration-Strategie dokumentiert
- ⚠️ Keine Migration-Tests
- ⚠️ Backup-Mechanismus vorhanden, aber nicht dokumentiert

**Bereits vorhanden:**
- ✅ Backup-Mechanismus: N-1 Version wird in `system.lastVersion` gespeichert
- ✅ Ermöglicht Rollback auf vorherige Schema-Version

---

## Optionen & Alternativen

### Ansatz 1: Automatische Migration beim Laden

#### Vollständige Beschreibung

**Prinzip:** Migration wird automatisch beim Laden durchgeführt (aktuell implementiert).

**Implementation-Details:**

```typescript
async function loadGraph(pageUuid: string): Promise<GraphModel> {
  const raw = await loadRawGraph(pageUuid);
  const migrated = migrateToLatest(raw); // Automatisch
  return migrated;
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Transparent:** User merkt Migration nicht
- ✅ **Automatisch:** Keine User-Interaktion nötig
- ✅ **Konsistent:** Alle Daten werden migriert

**Nachteile:**
- ❌ **Risiko:** Fehlerhafte Migration kann Daten beschädigen
- ❌ **Performance:** Migration bei jedem Laden
- ❌ **Rollback:** Schwer zu rollbacken

---

### Ansatz 2: Explizite Migration (User-Triggered)

#### Vollständige Beschreibung

**Prinzip:** Migration wird explizit vom User oder beim ersten Modul-Update ausgelöst.

**Implementation-Details:**

```typescript
// Beim Modul-Update
if (needsMigration(graph)) {
  showMigrationDialog();
  if (userAccepts) {
    migrateGraph(graph);
  }
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Kontrolliert:** User hat Kontrolle
- ✅ **Backup:** User kann vorher backupen
- ✅ **Transparenz:** User weiß was passiert

**Nachteile:**
- ❌ **User-Frustration:** Zusätzlicher Schritt
- ❌ **Vergesslich:** User kann Migration vergessen
- ❌ **Komplexität:** UI für Migration nötig

---

### Ansatz 3: Hybrid (Automatisch + Backup) - BEREITS VORHANDEN

#### Vollständige Beschreibung

**Prinzip:** Automatische Migration, N-1 Version wird in `system.lastVersion` gespeichert.

**Implementation-Details:**

```typescript
// Bereits vorhanden: Backup in system.lastVersion
JournalEntryPage.system = {
  version: 2, // Aktuelle Version
  lastVersion: {
    version: 1, // N-1 Version (Backup)
    nodes: { ... },
    edges: { ... },
    policy: { ... }
  },
  nodes: { ... },
  edges: { ... },
  policy: { ... }
}

async function loadGraph(pageUuid: string): Promise<GraphModel> {
  const raw = await loadRawGraph(pageUuid);
  if (needsMigration(raw)) {
    // Backup ist bereits in system.lastVersion vorhanden
    const migrated = migrateToLatest(raw);
    await saveGraph(pageUuid, migrated); // lastVersion wird automatisch aktualisiert
  }
  return migrated;
}
```

#### Detaillierte Trade-offs

**Vorteile:**
- ✅ **Sicher:** Backup in system.lastVersion (bereits vorhanden)
- ✅ **Transparent:** Automatisch, aber sicher
- ✅ **Rollback:** lastVersion ermöglicht Rollback
- ✅ **Implementiert:** Bereits vorhanden, keine zusätzliche Implementierung nötig

**Nachteile:**
- ❌ **Storage:** Backups verbrauchen Storage (aber nur N-1, nicht alle Versionen)
- ⚠️ **Performance:** Backup-Speicherung kann langsam sein (minimal, da nur N-1)

---

## Migration-Strategien

### Schema-Migration

**Prinzip:** Sequenzielle Migration durch alle Versionen.

**Vorteile:**
- Klar strukturiert
- Jede Version kann getestet werden

**Nachteile:**
- Kann langsam werden bei vielen Versionen

### Foundry-Version-Migration

**Prinzip:** Port-Adapter-Pattern ermöglicht Kompatibilität ohne Migration.

**Vorteile:**
- Keine Daten-Migration nötig
- Kompatibilität durch Adapter

**Nachteile:**
- Adapter müssen für jede Version erstellt werden

### Modul-Version-Migration

**Prinzip:** Migration beim Modul-Update.

**Vorteile:**
- Kontrollierte Migration
- User weiß was passiert

**Nachteile:**
- User-Interaktion nötig

---

## Offene Fragen & Entscheidungspunkte

### 1. Schema-Migration-Strategie

**Frage:** Wie sollen Schema-Migrationen durchgeführt werden?

**✅ Entscheidung: Hybrid (Automatisch + Backup)**

**Strategie:**
- **Automatische Migration beim Laden:** Migration wird automatisch durchgeführt, wenn Daten geladen werden (user-transparent)
- **Backup in system.lastVersion:** N-1 Version wird in `system.lastVersion` gespeichert (bereits vorhanden)
- **Bereits implementiert:** Diese Strategie ist bereits vorhanden und wird beibehalten

**Begründung:**
- **User-freundlich:** Automatische Migration ohne User-Interaktion
- **Sicher:** Backup schützt vor Datenverlust
- **Implementiert:** Bereits vorhanden, keine zusätzliche Implementierung nötig

---

### 2. Backup-Strategie (bereits vorhanden)

**Frage:** Wie soll der Backup-Mechanismus genutzt werden?

**✅ Entscheidung: Beibehalten (system.lastVersion)**

**Strategie:**
- **N-1 Version in system.lastVersion:** Aktueller Mechanismus wird beibehalten (bereits vorhanden)
- **Keine Erweiterung:** Mehrere Versionen werden nicht gespeichert (nur N-1)
- **Kein Optional:** Backup ist immer aktiv (nicht deaktivierbar)

**Begründung:**
- **Ausreichend:** N-1 Version reicht für Rollback-Zwecke
- **Storage-effizient:** Nur eine Version als Backup, nicht alle Versionen
- **Implementiert:** Bereits vorhanden, keine Änderungen nötig
- **Sicherheit:** Backup schützt vor Datenverlust bei fehlgeschlagener Migration

---

### 3. Rollback-Mechanismen

**Frage:** Sollen Rollback-Mechanismen implementiert werden?

**✅ Entscheidung: Rollback bei fehlgeschlagener Migration (Graceful Degradation)**

**Rollback-Strategie:**

Wenn eine Migration fehlschlägt:
1. **Daten wiederherstellen:** Backup aus `system.lastVersion` verwenden, um Daten auf N-1 Version zurückzusetzen
2. **Fehlermeldung anzeigen:** User informieren über fehlgeschlagene Migration (klare Fehlermeldung)
3. **Modulladen abbrechen:** Modul-Laden wird abgebrochen (graceful degradation - Modul bleibt deaktiviert)
4. **User-Aktion:** User kann manuell intervenieren (z.B. manuelle Migration, Backup wiederherstellen, etc.)

**Implementation-Details:**

```typescript
async function migrateGraphWithRollback(graph: GraphModel): Promise<GraphModel> {
  try {
    // Backup ist bereits in system.lastVersion vorhanden
    const migrated = await migrateToLatest(graph);
    return migrated;
  } catch (error) {
    // Migration fehlgeschlagen → Rollback
    console.error('Migration failed:', error);

    // 1. Daten wiederherstellen (Backup aus system.lastVersion)
    if (graph.system.lastVersion) {
      const rolledBack = restoreFromBackup(graph);
      await saveGraph(graph.id, rolledBack); // Backup-Version speichern
    }

    // 2. Fehlermeldung anzeigen
    ui.notifications.error(
      'Migration fehlgeschlagen',
      'Die Migration der Graph-Daten ist fehlgeschlagen. Das Modul wurde deaktiviert. Bitte kontaktieren Sie den Support.'
    );

    // 3. Modulladen abbrechen (graceful degradation)
    throw new MigrationError('Migration failed, module disabled', error);
  }
}

// Im Init-Hook: Migration mit Rollback
async function initModule() {
  try {
    const graphs = await loadAllGraphs();
    for (const graph of graphs) {
      await migrateGraphWithRollback(graph);
    }
  } catch (error) {
    if (error instanceof MigrationError) {
      // Modul deaktivieren (graceful degradation)
      game.modules.get(MODULE_ID).active = false;
      return; // Modulladen abbrechen
    }
    throw error;
  }
}
```

**Begründung:**
- **Graceful Degradation:** Modul bleibt deaktiviert statt Daten zu beschädigen
- **Datenintegrität:** Backup ermöglicht sichere Wiederherstellung
- **User-Information:** Klare Fehlermeldung informiert User über Problem
- **Wartbarkeit:** Fehlerbehandlung ist explizit und nachvollziehbar
- **Sicherheit:** Verhindert Datenverlust bei fehlgeschlagener Migration

---

## Empfehlung & Begründung

### Empfehlung: Hybrid (Automatisch + Backup) + Sequenzielle Schema-Migration

**Komponenten:**
1. **Schema-Migration:** Automatisch beim Laden + Backup in `system.lastVersion` (bereits vorhanden)
2. **Foundry-Version-Migration:** Port-Adapter-Pattern (bereits vorhanden)
3. **Modul-Version-Migration:** Automatisch beim ersten Laden nach Update
4. **Backup-Strategie:** N-1 Version in `system.lastVersion` (bereits vorhanden, beibehalten)
5. **Rollback-Strategie:** ✅ Bei fehlgeschlagener Migration - Daten wiederherstellen, Fehlermeldung, Modulladen abbrechen (Graceful Degradation)

**Begründung:**

**Für MVP:**
- ✅ Automatische Migration ist user-freundlich
- ✅ Backup in system.lastVersion ist bereits vorhanden und schützt vor Datenverlust
- ✅ Port-Adapter-Pattern funktioniert bereits

**Für Langzeit:**
- ✅ Sicherheit durch Backup (bereits vorhanden)
- ✅ User-Freundlichkeit durch Automatik
- ✅ Kompatibilität durch Port-Adapter
- ✅ Rollback möglich durch system.lastVersion

**Risiken:**
- ⚠️ Backup kann Storage verbrauchen (nur N-1, minimal)
- ⚠️ Migration-Fehler können Daten beschädigen
- ⚠️ Performance-Impact durch Backup (minimal, da nur N-1)

**Mitigation:**
- **Bereits implementiert:** Backup-Mechanismus ist vorhanden
- **Umfassende Tests:** Migration-Tests für alle Versionen
- **Rollback:** ✅ Expliziter Rollback-Mechanismus bei fehlgeschlagener Migration (Daten wiederherstellen, Fehlermeldung, Modulladen abbrechen)
- **Graceful Degradation:** Modul bleibt deaktiviert statt Daten zu beschädigen

**Abweichungskriterien:**
- Wenn Backup Storage-Probleme verursacht → Cleanup-Strategie evaluieren
- Wenn Migration-Fehler auftreten → Explizite Migration evaluieren
- Wenn mehrere Versionen nötig → Backup-System erweitern (nicht empfohlen, nur N-1 ist ausreichend)

---

## Nächste Schritte

1. ✅ **Rollback-Mechanismus:** ✅ Strategie definiert (Daten wiederherstellen, Fehlermeldung, Modulladen abbrechen)
2. **Backup-System:** Backup-Implementierung (bereits vorhanden, system.lastVersion)
3. **Migration-Tests:** Tests für alle Versionen
4. **Migration-Dokumentation:** Migration-Prozess dokumentieren
5. **Rollback-Implementierung:** Rollback-Mechanismus implementieren (Error-Handling, Daten-Wiederherstellung, Graceful Degradation)
6. **Cleanup-Strategie:** Backup-Cleanup implementieren (optional)

---

## Referenzen

- [Datenmodell & Schema-Strategie Analyse](./data-model-schema-strategy.md)
- [Foundry-Integration & Kompatibilität Analyse](./foundry-integration-compatibility.md)
- `relationship-app/src/core/migrations/MigrationV2.ts` - Migration-Implementierung
- `src/infrastructure/adapters/foundry/versioning/` - Foundry-Versioning
