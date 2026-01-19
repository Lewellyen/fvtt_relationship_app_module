/**
 * Public-API Facade Tokens.
 *
 * These tokens represent stable API entrypoints for third-party style consumers
 * (including Foundry-instantiated classes like sheets).
 */
import { createUnsafeInjectionToken } from "@/application/di/unsafe-token-factory";

export const sheetFacadeToken = createUnsafeInjectionToken("SheetFacade");
