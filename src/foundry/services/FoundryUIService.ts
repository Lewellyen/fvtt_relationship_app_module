import type { Result } from "@/types/result";
import type { FoundryNotificationOptions, FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import type { RetryService } from "@/services/RetryService";
import { portSelectorToken, foundryUIPortRegistryToken } from "@/foundry/foundrytokens";
import { retryServiceToken } from "@/tokens/tokenindex";
import { FoundryServiceBase } from "./FoundryServiceBase";

/**
 * Service wrapper for FoundryUI that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Extends FoundryServiceBase for consistent port selection and retry logic.
 */
export class FoundryUIService extends FoundryServiceBase<FoundryUI> implements FoundryUI {
  static dependencies = [portSelectorToken, foundryUIPortRegistryToken, retryServiceToken] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryUI>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }

  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.removeJournalElement(journalId, journalName, html);
    }, "FoundryUI.removeJournalElement");
  }

  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.findElement(container, selector);
    }, "FoundryUI.findElement");
  }

  notify(
    message: string,
    type: "info" | "warning" | "error",
    options?: FoundryNotificationOptions
  ): Result<void, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.notify(message, type, options);
    }, "FoundryUI.notify");
  }
}
