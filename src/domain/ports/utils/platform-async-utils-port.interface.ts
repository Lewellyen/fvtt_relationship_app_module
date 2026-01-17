import type { Result } from "@/domain/types/result";
import type { PlatformUtilsError } from "./platform-utils-error.interface";

/**
 * Platform-agnostic async/network utility port.
 */
export interface PlatformAsyncUtilsPort {
  fetchWithTimeout(
    url: string,
    options: unknown,
    timeoutMs: number
  ): Promise<Result<Response, PlatformUtilsError>>;

  fetchJsonWithTimeout(
    url: string,
    options: unknown,
    timeoutMs: number
  ): Promise<Result<unknown, PlatformUtilsError>>;
}
