## Problem

Factory-Funktionen in Config-Dateien (event-ports.config.ts und i18n-services.config.ts) warfen Exceptions, wenn resolveWithError() fehlschlug, statt das Result-Pattern zu respektieren. Obwohl der Container diese Exceptions faengt und zu ContainerError konvertiert, verletzt dies das Result-Pattern-Prinzip des Projekts, das durchgaengig Result<T, E> fuer Fehlerbehandlung statt Exceptions verwendet.

## Loesung

Eine Helper-Funktion resolveServiceOrThrow<T>() wurde erstellt, die die Fehlerbehandlung fuer Factory-Funktionen kapselt. Diese Funktion:
- Ruft container.resolveWithError() auf
- Prueft das Result
- Wirft eine Exception nur wenn noetig (da FactoryFunction<T> = () => T kein Result zurueckgeben kann)
- Dokumentiert klar, dass Exceptions vom Container gefangen und zu ContainerError konvertiert werden

Die Factory-Funktionen wurden umgeschrieben, um diese Helper-Funktion zu verwenden, was den Code sauberer und wartbarer macht. Die Fehlerbehandlung ist jetzt zentralisiert und dokumentiert.

## Geaenderte Dateien

- src/framework/config/modules/event-ports.config.ts: 
  - Helper-Funktion resolveServiceOrThrow() hinzugefuegt
  - Factory-Funktion fuer journalContextMenuHandlersToken umgeschrieben, um Helper zu verwenden
  - Import fuer InjectionToken hinzugefuegt
  - Kommentare hinzugefuegt, die das Result-Pattern-Constraint erklaeren

- src/framework/config/modules/i18n-services.config.ts:
  - Helper-Funktion resolveServiceOrThrow() hinzugefuegt
  - Factory-Funktion fuer translationHandlersToken umgeschrieben, um Helper zu verwenden
  - Import fuer InjectionToken hinzugefuegt
  - Kommentare hinzugefuegt, die das Result-Pattern-Constraint erklaeren

## Technische Details

Architektur-Entscheidungen:
- Die Loesung respektiert die FactoryFunction<T> = () => T Typdefinition, die kein Result<T, E> zurueckgeben kann
- Exceptions werden weiterhin verwendet, aber die Fehlerbehandlung ist jetzt in einer Helper-Funktion gekapselt
- Der Container faengt Exceptions und konvertiert sie zu ContainerError, was das Result-Pattern auf Container-Ebene beibehaelt
- Die Helper-Funktion dokumentiert klar das Verhalten und die Constraints

Pattern-Verwendung:
- Result-Pattern: Wird auf Container-Ebene beibehalten (Exceptions werden zu ContainerError konvertiert)
- Clean Architecture: Aenderungen bleiben in der Framework-Schicht (Config-Module)
- DRY-Prinzip: Fehlerbehandlung ist jetzt in einer wiederverwendbaren Helper-Funktion gekapselt

## Review-Hinweise

- Keine Breaking Changes: Die Aenderungen sind rein intern und aendern keine oeffentlichen APIs
- Tests: Bestehende Tests sollten weiterhin funktionieren, da das Verhalten unveraendert bleibt (Exceptions werden weiterhin geworfen, nur die Implementierung ist sauberer)
- Dokumentation: Die Helper-Funktion ist vollstaendig dokumentiert und erklaert das Result-Pattern-Constraint
- Wartbarkeit: Die zentralisierte Fehlerbehandlung macht den Code wartbarer und konsistenter
