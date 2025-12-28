import { InitPhaseRegistry } from "./init-phase-registry";
import { MetricsInitPhase } from "./phases/metrics-init-phase";
import { NotificationInitPhase } from "./phases/notification-init-phase";
import { ApiInitPhase } from "./phases/api-init-phase";
import { SettingsInitPhase } from "./phases/settings-init-phase";
import { LoggingInitPhase } from "./phases/logging-init-phase";
import { EventsInitPhase } from "./phases/events-init-phase";
import { ContextMenuInitPhase } from "./phases/context-menu-init-phase";
import { SidebarButtonInitPhase } from "./phases/sidebar-button-init-phase";

/**
 * Creates the default init phase registry with all standard phases.
 *
 * This factory function provides the default configuration of init phases
 * in the correct order. The registry can be extended or replaced for
 * testing or custom configurations.
 *
 * @returns InitPhaseRegistry with all default phases
 */
export function createDefaultInitPhaseRegistry(): InitPhaseRegistry {
  return new InitPhaseRegistry([
    new MetricsInitPhase(),
    new NotificationInitPhase(),
    new ApiInitPhase(),
    new SettingsInitPhase(),
    new LoggingInitPhase(),
    new EventsInitPhase(),
    new ContextMenuInitPhase(),
    new SidebarButtonInitPhase(),
  ]);
}
