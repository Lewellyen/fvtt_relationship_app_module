import type { Result } from "@/domain/types/result";
import type { PlatformAsyncUtilsPort } from "@/domain/ports/utils/platform-async-utils-port.interface";
import type { PlatformHtmlUtilsPort } from "@/domain/ports/utils/platform-html-utils-port.interface";
import type { PlatformObjectUtilsPort } from "@/domain/ports/utils/platform-object-utils-port.interface";
import type {
  PlatformUuidComponents,
  PlatformUuidUtilsPort,
} from "@/domain/ports/utils/platform-uuid-utils-port.interface";
import type { PlatformUtilsError } from "@/domain/ports/utils/platform-utils-error.interface";
import type { FoundryError } from "../errors/FoundryErrors";
import type { FoundryUtilsPort } from "../services/FoundryUtilsPort";
import { foundryUtilsToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils.token";

function mapFoundryError(error: FoundryError): PlatformUtilsError {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
    cause: error.cause,
  };
}

function mapResult<T>(result: Result<T, FoundryError>): Result<T, PlatformUtilsError> {
  return result.ok ? result : { ok: false, error: mapFoundryError(result.error) };
}

/**
 * Foundry implementation for platform-agnostic utility ports.
 *
 * Wraps FoundryUtilsPort but maps FoundryError -> PlatformUtilsError to avoid leaking
 * Foundry-specific error types into Domain/API consumers.
 *
 * Implements multiple ports (ISP is provided by separate tokens/aliases).
 */
export class FoundryPlatformUtilsAdapter
  implements
    PlatformUuidUtilsPort,
    PlatformObjectUtilsPort,
    PlatformHtmlUtilsPort,
    PlatformAsyncUtilsPort
{
  constructor(private readonly foundryUtils: FoundryUtilsPort) {}

  randomID(): string {
    return this.foundryUtils.randomID();
  }

  async fromUuid(uuid: string): Promise<Result<unknown | null, PlatformUtilsError>> {
    return mapResult(await this.foundryUtils.fromUuid(uuid));
  }

  fromUuidSync(uuid: string): Result<unknown | null, PlatformUtilsError> {
    return mapResult(this.foundryUtils.fromUuidSync(uuid));
  }

  parseUuid(uuid: string): Result<PlatformUuidComponents, PlatformUtilsError> {
    return mapResult(this.foundryUtils.parseUuid(uuid));
  }

  buildUuid(
    type: string,
    documentName: string,
    documentId: string,
    pack?: string
  ): Result<string, PlatformUtilsError> {
    return mapResult(this.foundryUtils.buildUuid(type, documentName, documentId, pack));
  }

  deepClone<T>(obj: T): Result<T, PlatformUtilsError> {
    return mapResult(this.foundryUtils.deepClone(obj));
  }

  mergeObject<T>(original: T, updates: unknown, options?: unknown): Result<T, PlatformUtilsError> {
    return mapResult(this.foundryUtils.mergeObject(original, updates, options));
  }

  diffObject(
    original: unknown,
    updated: unknown
  ): Result<Record<string, unknown>, PlatformUtilsError> {
    return mapResult(this.foundryUtils.diffObject(original, updated));
  }

  flattenObject(obj: unknown): Result<Record<string, unknown>, PlatformUtilsError> {
    return mapResult(this.foundryUtils.flattenObject(obj));
  }

  expandObject(obj: Record<string, unknown>): Result<unknown, PlatformUtilsError> {
    return mapResult(this.foundryUtils.expandObject(obj));
  }

  cleanHTML(html: string): Result<string, PlatformUtilsError> {
    return mapResult(this.foundryUtils.cleanHTML(html));
  }

  escapeHTML(str: string): string {
    return this.foundryUtils.escapeHTML(str);
  }

  unescapeHTML(str: string): string {
    return this.foundryUtils.unescapeHTML(str);
  }

  async fetchWithTimeout(
    url: string,
    options: unknown,
    timeoutMs: number
  ): Promise<Result<Response, PlatformUtilsError>> {
    return mapResult(await this.foundryUtils.fetchWithTimeout(url, options, timeoutMs));
  }

  async fetchJsonWithTimeout(
    url: string,
    options: unknown,
    timeoutMs: number
  ): Promise<Result<unknown, PlatformUtilsError>> {
    return mapResult(await this.foundryUtils.fetchJsonWithTimeout(url, options, timeoutMs));
  }
}

export class DIFoundryPlatformUtilsAdapter extends FoundryPlatformUtilsAdapter {
  static dependencies = [foundryUtilsToken] as const;

  constructor(foundryUtils: FoundryUtilsPort) {
    super(foundryUtils);
  }
}
