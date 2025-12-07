import { ValibotValidationAdapter } from "./valibot-validation-adapter";

/**
 * DI-enabled wrapper for ValibotValidationAdapter.
 * Resolves dependencies from container (currently none, but prepared for future dependencies).
 */
export class DIValibotValidationAdapter extends ValibotValidationAdapter {
  static dependencies = [] as const;

  constructor() {
    super();
  }
}
