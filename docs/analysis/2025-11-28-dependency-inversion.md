# Dependency Inversion Check – 2025-11-28

## Beobachtungen
- **Benachrichtigungen (Application Layer → Infrastructure Types):**
  - Mehrere Application-Handler und Use-Cases importieren `NotificationService` aus `src/infrastructure/notifications/notification-center.interface.ts`.
  - Das Interface hängt wiederum von Foundry-spezifischen Typen (`FoundryNotificationOptions`) und Infrastruktur-Channel-Interfaces ab.
  - Ergebnis: High-Level-Module kennen Infrastruktur-Details und Foundry-spezifische Typen, wodurch die Abstraktion der Port-Schicht verletzt wird.

## Bewertung (DIP)
- High-Level-Module sollen ausschließlich von Abstraktionen/Ports abhängen.
- Aktuell koppeln sie direkt an Infrastruktur-Interfaces mit Foundry-Details.
- Dies erschwert Austauschbarkeit (z. B. andere UI/Logging-Kanäle) und Tests ohne Foundry-spezifische Typen.

## Vorschlag zur Behebung
- Einführung eines domänen-/anwendungsneutralen Notification-Ports im Domain-Layer (reine Typen, keine Foundry-Optionen).
- Application-Services/Use-Cases sollten diesen Port injizieren statt Infrastruktur-Interfaces.
- Infrastruktur-Adapter (NotificationCenter, Channels) implementieren den neuen Port und übersetzen optionale UI-Optionen per Typ-Guard.
- DI-Tokens werden auf den neuen Port umgestellt, damit die Verkabelung weiterhin zentral bleibt.
