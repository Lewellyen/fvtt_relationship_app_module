# Dependency Inversion Principle (DIP)

## Gefundene Verstöße

1. **Abhängigkeit von konkretem Handler statt Port** – `RegisterContextMenuUseCase` erwartet explizit einen `HideJournalContextMenuHandler` statt ein Interface wie `JournalContextMenuHandler`. Damit hängt die Anwendungsschicht an einer konkreten Implementierung und erschwert alternative Handler (z. B. Feature-Flags, andere Module) ohne Codeanpassung.
   - Folgen: reduzierte Austauschbarkeit, Test-Doubles müssen die konkrete Klasse kennen, Erweiterungen verletzen OCP/DIP gemeinsam.
   - Fundstelle: `src/application/use-cases/register-context-menu.use-case.ts` (Konstruktor-Signatur).

## Verbesserungsvorschläge

- Signatur auf das abstrakte Handler-Interface umstellen und die konkrete Instanz in der DI-Konfiguration binden. So bleibt der Use-Case unabhängig von Implementierungsdetails und kann neue Handler-Varianten aufnehmen.
- Ergänze optionale Kompositionsports (z. B. `JournalContextMenuHandler[]`), die externe Module befüllen können, ohne die Anwendungsschicht zu ändern.
