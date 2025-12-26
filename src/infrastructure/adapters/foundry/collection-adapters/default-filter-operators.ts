import { FilterOperatorRegistry } from "./filter-operator-registry";
import { EqualsOperator } from "./operators/equals-operator";
import { NotEqualsOperator } from "./operators/not-equals-operator";
import { ContainsOperator } from "./operators/contains-operator";
import { StartsWithOperator } from "./operators/starts-with-operator";
import { EndsWithOperator } from "./operators/ends-with-operator";
import { InOperator } from "./operators/in-operator";
import { NotInOperator } from "./operators/not-in-operator";
import { GreaterThanOperator } from "./operators/greater-than-operator";
import { LessThanOperator } from "./operators/less-than-operator";
import { GreaterThanOrEqualOperator } from "./operators/greater-than-or-equal-operator";
import { LessThanOrEqualOperator } from "./operators/less-than-or-equal-operator";

/**
 * Creates a FilterOperatorRegistry with all default filter operators registered.
 *
 * This factory function provides the standard set of filter operators used by
 * Foundry collection adapters. Custom operators can be registered after creation.
 *
 * @returns A FilterOperatorRegistry with all default operators registered
 */
export function createDefaultFilterOperators(): FilterOperatorRegistry {
  const registry = new FilterOperatorRegistry();

  // Register all default operators
  registry.register(new EqualsOperator());
  registry.register(new NotEqualsOperator());
  registry.register(new ContainsOperator());
  registry.register(new StartsWithOperator());
  registry.register(new EndsWithOperator());
  registry.register(new InOperator());
  registry.register(new NotInOperator());
  registry.register(new GreaterThanOperator());
  registry.register(new LessThanOperator());
  registry.register(new GreaterThanOrEqualOperator());
  registry.register(new LessThanOrEqualOperator());

  return registry;
}
