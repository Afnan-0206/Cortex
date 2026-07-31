export type AnalyticsEvent =
  | 'app_open'
  | 'battle_started'
  | 'battle_completed'
  | 'puzzle_completed'
  | 'streak_kept'
  | 'notification_opened'
  | 'tutorial_completed'
  | 'guest_to_auth_conversion'
  | 'match_rating_delta'
  | 'post_match_insight_viewed'
  | 'division_promoted'
  | 'streak_milestone_claimed';

class AnalyticsTracker {
  track(event: AnalyticsEvent, properties?: Record<string, any>) {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, properties || '');
    }
  }
}

export const analytics = new AnalyticsTracker();
