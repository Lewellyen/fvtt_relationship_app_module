/**
 * Service Type Registry
 *
 * Diese Datei enthielt früher eine Union aller Service-Typen, was zu massiven
 * Circular Dependencies führte (85-90 von 104 Zyklen!).
 *
 * **GEÄNDERT:** ServiceType ist jetzt `unknown` statt einer Union.
 * - Container nutzt freie Generics (`<T>` statt `<T extends ServiceType>`)
 * - Runtime-Validierung ersetzt Compile-Time Type-Safety
 * - Tokens selbst sorgen weiterhin für Type-Safety zwischen Token und Service
 *
 * **Vorteile:**
 * - ✅ 85-90% weniger Circular Dependencies
 * - ✅ Keine transitive Imports mehr
 * - ✅ Schnellere TypeScript-Compilation
 * - ✅ Einfacherer, wartbarerer Code
 *
 * **Trade-off:**
 * - Fehler werden zur Laufzeit statt zur Compile-Zeit erkannt
 * - Runtime-Check erfolgt beim App-Start (erste Sekunde)
 * - Tests fangen alle Fehler sofort
 *
 * @see docs/refactoring/CIRCULAR-DEPS-FIX-PLAN-4-SERVICE-TYPE-REGISTRY.md
 */

/**
 * ServiceType represents any service type that can be registered in the DI container.
 *
 * Früher: Union aller Service-Typen (verursachte Circular Dependencies)
 * Jetzt: `unknown` (freie Generics, Runtime-Validierung)
 *
 * @internal - Nur für DI-Container interne Nutzung
 */
export type ServiceType = unknown;
