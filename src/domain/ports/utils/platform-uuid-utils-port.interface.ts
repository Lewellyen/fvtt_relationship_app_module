import type { Result } from "@/domain/types/result";
import type { PlatformUtilsError } from "./platform-utils-error.interface";

/**
 * Platform-agnostic UUID/document utility port.
 *
 * Provides UUID helpers and UUID-based document resolution in a platform-neutral way.
 */
export interface PlatformUuidUtilsPort {
  randomID(): string;

  fromUuid(uuid: string): Promise<Result<unknown | null, PlatformUtilsError>>;
  fromUuidSync(uuid: string): Result<unknown | null, PlatformUtilsError>;

  parseUuid(uuid: string): Result<PlatformUuidComponents, PlatformUtilsError>;

  buildUuid(
    type: string,
    documentName: string,
    documentId: string,
    pack?: string
  ): Result<string, PlatformUtilsError>;
}

export interface PlatformUuidComponents {
  type: string;
  documentName: string;
  documentId: string;
  pack?: string | undefined;
}
