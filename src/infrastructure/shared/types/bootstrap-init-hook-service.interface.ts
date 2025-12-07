/**
 * Interface for bootstrap init hook service.
 * Extracted from Framework layer to avoid Infrastructure → Framework dependency.
 */
export interface BootstrapInitHookService {
  /**
   * Registers the init event.
   */
  register(): void;
}
