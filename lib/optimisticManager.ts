/**
 * Cortex Optimistic Action & Graceful Rollback Engine
 *
 * Provides immediate (<16ms) local UI state updates for user actions
 * (likes, bookmarks, toggles, claims), background reconciliation with backend,
 * and transparent state rollback with user-visible toast error notifications upon failure.
 */

import * as Haptics from 'expo-haptics';

export interface OptimisticActionOptions<T> {
  actionName: string;
  previousState: T;
  optimisticState: T;
  applyState: (newState: T) => void;
  serverTask: () => Promise<void>;
  onRollbackError?: (errorMessage: string) => void;
}

export async function executeOptimisticAction<T>({
  actionName,
  previousState,
  optimisticState,
  applyState,
  serverTask,
  onRollbackError,
}: OptimisticActionOptions<T>): Promise<boolean> {
  // 1. Fire instant haptic feedback
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // ignore haptic error
  }

  // 2. IMMEDIATELY apply optimistic UI state update
  applyState(optimisticState);

  try {
    // 3. Asynchronously reconcile with server in background
    await serverTask();
    return true;
  } catch (error: any) {
    console.warn(`[OptimisticRollback:${actionName}] Server action failed. Rolling back state:`, error);

    // 4. Gracefully roll back UI to previous snapshot state
    applyState(previousState);

    // 5. Fire failure haptic feedback
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // ignore
    }

    // 6. Notify user of rollback
    const msg = `Action "${actionName}" failed. Restored previous state.`;
    if (onRollbackError) {
      onRollbackError(msg);
    }

    return false;
  }
}
