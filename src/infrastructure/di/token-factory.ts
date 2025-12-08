/**
 * Re-export of token factory from Domain Layer for backward compatibility.
 *
 * InjectionTokens sind framework-unabhängig und Teil der DI-Infrastruktur,
 * um Implementierungen aus Infrastructure/Framework mit Domain-Contracts zu verbinden.
 * Die Implementierung befindet sich daher im Domain-Layer.
 */
export { createInjectionToken } from "@/domain/utils/token-factory";
export type { InjectionToken } from "@/domain/types/injection-token";
