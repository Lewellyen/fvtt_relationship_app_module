import type { FilterOperator } from "./filter-operator.interface";

/**
 * Registry for filter operators.
 *
 * Enables dynamic registration and lookup of filter operators (Strategy Pattern).
 * This allows extending the filter system without modifying existing code (OCP-compliant).
 */
export class FilterOperatorRegistry {
  private readonly operators = new Map<string, FilterOperator>();

  /**
   * Registers a filter operator.
   *
   * @param operator - The operator to register
   * @throws Error if an operator with the same name is already registered
   */
  register(operator: FilterOperator): void {
    if (this.operators.has(operator.name)) {
      throw new Error(
        `Filter operator "${operator.name}" is already registered. Use unregister() first to replace an existing operator.`
      );
    }
    this.operators.set(operator.name, operator);
  }

  /**
   * Unregisters a filter operator.
   *
   * @param name - The name of the operator to unregister
   * @returns true if the operator was unregistered, false if it wasn't registered
   */
  unregister(name: string): boolean {
    return this.operators.delete(name);
  }

  /**
   * Gets a filter operator by name.
   *
   * @param name - The name of the operator
   * @returns The operator if found, undefined otherwise
   */
  get(name: string): FilterOperator | undefined {
    return this.operators.get(name);
  }

  /**
   * Checks if an operator is registered.
   *
   * @param name - The name of the operator
   * @returns true if registered, false otherwise
   */
  has(name: string): boolean {
    return this.operators.has(name);
  }

  /**
   * Gets all registered operator names.
   *
   * @returns Array of operator names
   */
  getOperatorNames(): string[] {
    return Array.from(this.operators.keys());
  }
}
