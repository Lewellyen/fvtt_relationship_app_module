# Migration Guide: vX.Y → vX+1.0

**Datum:** [Datum]  
**Von Version:** [Alte Version]  
**Zu Version:** [Neue Version]  
**Status:** ⚠️ **BREAKING CHANGES**

---

## 📋 Übersicht

Diese Migration-Guide beschreibt die Breaking Changes zwischen Version [X.Y] und [X+1.0] und zeigt, wie du deinen Code migrieren kannst.

**Deprecated seit:** v[X.Y]  
**Entfernt in:** v[X+1.0]  
**Deprecated-Zeitraum:** [X] Main-Versionen

---

## ⚠️ Breaking Changes

### [Service/Component Name]: [Änderung]

#### Was wurde geändert?

[Beschreibung der Änderung]

#### Warum wurde das geändert?

[Begründung: Architektur, Type Safety, Performance, etc.]

#### Wie migriere ich?

**Vorher (deprecated):**
```typescript
// Alter Code (funktioniert nicht mehr ab vX+1.0)
const result = await oldApi.method(param1, param2, param3);
```

**Nachher (empfohlen):**
```typescript
// Neuer Code (ab vX.Y verfügbar, Pflicht ab vX+1.0)
const result = await newApi.method({
  param1: param1,
  param2: param2,
  param3: param3
});
```

#### Automatische Migration (optional)

[Falls ein Script verfügbar ist]

```bash
npm run migrate:vX-to-vX+1
```

#### Weitere Informationen

- [Dokumentation: [Link]]
- [GitHub Issue: [Link]]
- [ADR: [Link zu Architecture Decision Record]]

---

## 🔍 Affected Code

### API-Änderungen

| Komponente | Alte API | Neue API | Action |
|------------|----------|----------|--------|
| [Service] | `oldMethod()` | `newMethod()` | Migrieren |
| [Service] | `deprecatedField` | `newField` | Umbenennen |
| [Service] | `removedMethod()` | - | Entfernen |

---

### Breaking Change Details

#### [Komponente 1]: [Änderung 1]

**Alte Signatur (entfernt):**
```typescript
function oldMethod(param: string): Result<T, E>;
```

**Neue Signatur:**
```typescript
function newMethod(options: { param: string }): Result<T, E>;
```

**Migration-Beispiele:**

**Beispiel 1: Einfache Migration**
```typescript
// Vorher
const result = service.oldMethod("value");

// Nachher
const result = service.newMethod({ param: "value" });
```

**Beispiel 2: Mit Error Handling**
```typescript
// Vorher
const result = service.oldMethod("value");
if (result.ok) {
  console.log(result.value);
}

// Nachher (unverändert - Result Pattern bleibt gleich)
const result = service.newMethod({ param: "value" });
if (result.ok) {
  console.log(result.value);
}
```

---

#### [Komponente 2]: [Änderung 2]

[Weitere Breaking Changes analog dokumentieren]

---

## ✅ Migrations-Checkliste

Arbeite diese Checkliste ab, um sicherzustellen, dass alle Breaking Changes migriert wurden:

- [ ] **[Service 1]:** `oldMethod()` → `newMethod()` migriert
- [ ] **[Service 2]:** `deprecatedField` → `newField` umbenannt
- [ ] **[Service 3]:** `removedMethod()` Aufrufe entfernt
- [ ] **Tests:** Alle Tests aktualisiert und grün
- [ ] **Dokumentation:** Interne Docs aktualisiert
- [ ] **Build:** `npm run build` erfolgreich
- [ ] **Linter:** `npm run lint` ohne Fehler
- [ ] **Type-Check:** `npm run type-check` erfolgreich

---

## 🆘 Hilfe & Support

### Häufige Probleme

#### Problem 1: [Fehlermeldung]

**Ursache:** [Beschreibung]

**Lösung:**
```typescript
// Code-Beispiel
```

#### Problem 2: [Fehlermeldung]

**Ursache:** [Beschreibung]

**Lösung:**
```typescript
// Code-Beispiel
```

---

### Support-Kanäle

- **GitHub Issues:** [Link zu Issues]
- **Discord:** lewellyen
- **Email:** forenadmin.tir@gmail.com

---

## 📚 Weitere Ressourcen

- [CHANGELOG.md](../CHANGELOG.md) - Vollständiges Change-Log
- [VERSIONING-STRATEGY.md](./VERSIONING-STRATEGY.md) - Versioning-Regeln
- [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) - Architektur-Analyse
- [API.md](./API.md) - API-Dokumentation

---

**Ende Migration Guide**

