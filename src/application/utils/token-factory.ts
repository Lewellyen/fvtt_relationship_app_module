/**
 * Re-export of token factory from Application DI layer.
 *
 * InjectionTokens sind Teil der DI-Infrastruktur im Application Layer,
 * um Implementierungen aus Infrastructure/Framework mit Domain-Contracts zu verbinden.
 */
export { createInjectionToken } from "@/application/di/token-factory";
export type { InjectionToken } from "@/application/di/injection-token";
