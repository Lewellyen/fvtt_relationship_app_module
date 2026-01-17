import type { Result } from "@/domain/types/result";
import type { PlatformUtilsError } from "./platform-utils-error.interface";

/**
 * Platform-agnostic HTML/string utilities.
 */
export interface PlatformHtmlUtilsPort {
  cleanHTML(html: string): Result<string, PlatformUtilsError>;
  escapeHTML(str: string): string;
  unescapeHTML(str: string): string;
}
