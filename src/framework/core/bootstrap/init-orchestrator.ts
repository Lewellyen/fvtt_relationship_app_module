import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { MetricsBootstrapper } from "./orchestrators/metrics-bootstrapper";
import { NotificationBootstrapper } from "./orchestrators/notification-bootstrapper";
import { ApiBootstrapper } from "./orchestrators/api-bootstrapper";
import { SettingsBootstrapper } from "./orchestrators/settings-bootstrapper";
import { LoggingBootstrapper } from "./orchestrators/logging-bootstrapper";
import { EventsBootstrapper } from "./orchestrators/events-bootstrapper";
import { ContextMenuBootstrapper } from "./orchestrators/context-menu-bootstrapper";

/**
 * Error type for init orchestration failures.
 */
export interface InitError {
  phase: string;
  message: string;
  originalError?: string;
}

/**
 * Orchestrator for the complete bootstrap initialization sequence.
 *
 * Responsibilities:
 * - Execute all bootstrap phases in order
 * - Handle errors with rollback capability
 * - Aggregate errors for reporting
 *
 * Design:
 * - Each phase is isolated and can be tested independently
 * - Errors are collected but don't stop the entire sequence (some phases are optional)
 * - Critical phases (API, Settings, Events) fail fast
 * - Optional phases (Notifications, Context Menu) log warnings but continue
 */
export class InitOrchestrator {
  /**
   * Executes the complete initialization sequence.
   *
   * Phase order:
   * 1. Metrics Initialization (optional - warnings only)
   * 2. Notification Channels (optional - warnings only)
   * 3. API Exposure (critical - fails on error)
   * 4. Settings Registration (critical - fails on error)
   * 5. Logging Configuration (optional - warnings only)
   * 6. Event Registration (critical - fails on error)
   * 7. Context Menu Registration (optional - warnings only)
   *
   * @param container - ContainerPort for service resolution
   * @param logger - Logger for error reporting
   * @returns Result indicating success or aggregated errors
   */
  static execute(container: ContainerPort, logger: Logger): Result<void, InitError[]> {
    const errors: InitError[] = [];

    // Phase 1: Metrics Initialization (optional)
    const metricsResult = MetricsBootstrapper.initializeMetrics(container);
    if (!metricsResult.ok) {
      logger.warn(`Metrics initialization failed: ${metricsResult.error}`);
      // Don't add to errors - this is optional
    }

    // Phase 2: Notification Channels (optional)
    const notificationResult = NotificationBootstrapper.attachNotificationChannels(container);
    if (!notificationResult.ok) {
      logger.warn(`Notification channels could not be attached: ${notificationResult.error}`, {
        phase: "notification-channels",
      });
      // Don't add to errors - this is optional
    }

    // Phase 2: API Exposure (critical)
    const apiResult = ApiBootstrapper.exposeApi(container);
    if (!apiResult.ok) {
      errors.push({
        phase: "api-exposure",
        message: apiResult.error,
      });
      logger.error(`Failed to expose API: ${apiResult.error}`);
      // Continue to collect all errors, but this is critical
    }

    // Phase 3: Settings Registration (critical)
    const settingsResult = SettingsBootstrapper.registerSettings(container);
    if (!settingsResult.ok) {
      errors.push({
        phase: "settings-registration",
        message: settingsResult.error,
      });
      logger.error(`Failed to register settings: ${settingsResult.error}`);
      // Continue to collect all errors, but this is critical
    }

    // Phase 4: Logging Configuration (optional)
    const loggingResult = LoggingBootstrapper.configureLogging(container, logger);
    if (!loggingResult.ok) {
      logger.warn(`Logging configuration failed: ${loggingResult.error}`);
      // Don't add to errors - this is optional
    }

    // Phase 5: Event Registration (critical)
    const eventsResult = EventsBootstrapper.registerEvents(container);
    if (!eventsResult.ok) {
      errors.push({
        phase: "event-registration",
        message: eventsResult.error,
      });
      logger.error(`Failed to register events: ${eventsResult.error}`);
      // Continue to collect all errors, but this is critical
    }

    // Phase 6: Context Menu Registration (optional)
    const contextMenuResult = ContextMenuBootstrapper.registerContextMenu(container);
    if (!contextMenuResult.ok) {
      logger.warn(`Context menu registration failed: ${contextMenuResult.error}`);
      // Don't add to errors - this is optional
    }

    // If any critical phases failed, return errors
    if (errors.length > 0) {
      return err(errors);
    }

    return ok(undefined);
  }
}
