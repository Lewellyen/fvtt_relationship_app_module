# Liskov Substitution Principle (LSP)

## Gefundene Verstöße

1. **Seiteneffekte im abgeleiteten Collector** – `PersistentMetricsCollector` führt im Konstruktor unmittelbare Storage-I/O über `restoreFromStorage()` aus und verschluckt Fehler still. Wird die Klasse als `MetricsCollector`-Ersatz eingesetzt, verändert sie damit die Instanziierungs-Semantik (I/O vs. reiner In-Memory-Zustand) und unterdrückt beobachtbare Fehlermeldungen, mit denen Aufrufer bei der Basisklasse rechnen könnten.
   - Folgen: unerwartete Latenzen/Fehlerunterdrückung in Kontexten, die einen leichten Collector erwarten (z. B. Tests oder Headless-Läufe), wodurch Substitution ohne Anpassungen nicht valide ist.
   - Fundstelle: `src/infrastructure/observability/metrics-persistence/persistent-metrics-collector.ts`.

## Verbesserungsvorschläge

- Vermeide I/O im Konstruktor; führe Wiederherstellung über ein explizites `initialize()`-Port/Factory durch, das optional aufgerufen werden kann.
- Melde Persistenzfehler konsequent über das Logger-/Result-Pattern, damit die abgeleitete Klasse dieselben verifizierbaren Zusicherungen wie die Basisklasse bietet und substituierbar bleibt.
