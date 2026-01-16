import type { FoundryUtilsUuidPort } from "./FoundryUtilsUuidPort";
import type { FoundryUtilsObjectPort } from "./FoundryUtilsObjectPort";
import type { FoundryUtilsHtmlPort } from "./FoundryUtilsHtmlPort";
import type { FoundryUtilsAsyncPort } from "./FoundryUtilsAsyncPort";

/**
 * Convenience interface that combines all Foundry Utils ports.
 *
 * Services that need multiple capabilities can depend on this interface.
 * Services that only need one capability should depend on the specific port.
 *
 * This follows Interface Segregation Principle by providing a composition interface
 * while allowing consumers to depend on minimal interfaces.
 *
 * @example
 * ```typescript
 * // Service that needs multiple utils
 * class MyService {
 *   constructor(private readonly utils: FoundryUtils) {}
 *
 *   async doSomething() {
 *     const id = this.utils.randomID(); // UUID port
 *     const cloned = this.utils.deepClone({ a: 1 }); // Object port
 *   }
 * }
 *
 * // Service that only needs UUID
 * class AnotherService {
 *   constructor(private readonly uuidUtils: FoundryUtilsUuidPort) {}
 *
 *   generateId() {
 *     return this.uuidUtils.randomID();
 *   }
 * }
 * ```
 */
export interface FoundryUtils
  extends
    FoundryUtilsUuidPort,
    FoundryUtilsObjectPort,
    FoundryUtilsHtmlPort,
    FoundryUtilsAsyncPort {}
