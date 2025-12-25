/**
 * Error type for init orchestration failures.
 */
export interface InitError {
  phase: string;
  message: string;
  originalError?: string;
}
