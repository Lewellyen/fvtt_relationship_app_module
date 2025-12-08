/**
 * Re-export of token factory from Domain Layer.
 *
 * InjectionTokens sind framework-unabhängig und Teil der DI-Infrastruktur,
 * um Implementierungen aus Infrastructure/Framework mit Domain-Contracts zu verbinden.
 * Daher ist die Token-Factory im Domain-Layer implementiert.
 */
export { createInjectionToken } from "@/domain/utils/token-factory";
export type { InjectionToken } from "@/domain/types/injection-token";
