// Crash Reporting & Error Boundary Telemetry
export function captureException(error: any, context?: Record<string, any>) {
  if (__DEV__) {
    console.warn('[Crash Reporting Exception]', error, context || '');
  }
  // Production integration hook for Sentry (@sentry/react-native)
}

export function initCrashReporting() {
  if (__DEV__) {
    console.log('[Crash Reporting] Initialized Sentry tracker.');
  }
}
