/**
 * Health status information for the module.
 * Provides diagnostic information about module state.
 *
 * This type is part of the Domain layer as it represents business logic
 * related to module health monitoring.
 */
export interface HealthStatus {
  /** Overall health status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Individual health checks */
  checks: {
    /** Whether DI container is validated and ready */
    containerValidated: boolean;
    /** Whether Foundry ports have been selected */
    portsSelected: boolean;
    /** Last error encountered (if any) */
    lastError: string | null;
  };
  /** Timestamp of health check */
  timestamp: string;
}
