/**
 * Dependency Modules Manifest
 *
 * This file contains the list of all dependency configuration modules.
 * New modules can be added here without modifying dependencyconfig.ts,
 * following the Open/Closed Principle (OCP).
 *
 * DESIGN: Direct imports are used to trigger side-effects (self-registration)
 * in each module. Each module registers itself via registerDependencyStep()
 * when imported.
 *
 * @example
 * To add a new module:
 * 1. Create your module config file (e.g., `my-module.config.ts`)
 * 2. Add an import statement here:
 *    import "./modules/my-module.config";
 */

// Import all dependency configuration modules
// These imports trigger side-effects that register each module's dependency steps
import "./modules/core-services.config";
import "./modules/observability.config";
import "./modules/port-infrastructure.config";
import "./modules/foundry-services.config";
import "./modules/utility-services.config";
import "./modules/cache-services.config";
import "./modules/i18n-services.config";
import "./modules/notifications.config";
import "./modules/registrars.config";
import "./modules/event-ports.config";
import "./modules/entity-ports.config";
import "./modules/settings-ports.config";
import "./modules/journal-visibility.config";
import "./modules/window-services.config";
import "./modules/journal-overview-window.config";
import "./modules/relationship-page-services.config";
import "./modules/relationship-app-services.config";
