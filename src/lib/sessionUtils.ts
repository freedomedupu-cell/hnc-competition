/**
 * Utilities for Session Timeout and Activity Management
 */

export const STORAGE_LAST_ACTIVE_KEY = 'hnc_session_last_active';
export const SESSION_TIMEOUT_MSG_KEY = 'hnc_session_timeout_msg';

/**
 * Triggers a simulated session timeout warning for preview or admin testing.
 * @param testSeconds Number of seconds to display on the countdown timer (default: 60)
 */
export function simulateSessionTimeoutWarning(testSeconds: number = 60): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('hnc_simulate_session_timeout', {
        detail: { testSeconds },
      })
    );
  }
}

/**
 * Updates the last active timestamp across all tabs
 */
export function touchSessionActivity(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_LAST_ACTIVE_KEY, String(Date.now()));
    } catch {}
  }
}
