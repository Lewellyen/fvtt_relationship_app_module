/**
 * Cast utilities für Bootstrap Orchestrators.
 *
 * Separate Datei, um Zyklen zu vermeiden.
 * Nur von Bootstrap-Code verwendet.
 *
 * Diese Datei verwendet GENERICS - die nutzenden Dateien geben den Type explizit an.
 * Type-Imports (import type) erzeugen KEINE Zyklen, da sie nur zur Compile-Zeit existieren.
 *
 * Re-exportiert castResolvedService von runtime-safe-cast für Bootstrap-Kontext.
 *
 * @ts-expect-error - Type coverage exclusion
 */

export { castResolvedService } from "../utilities/runtime-safe-cast";
