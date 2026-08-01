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
  | 'streak_milestone_claimed'
  | 'first_game_guide_started'
  | 'first_game_guide_completed'
  | 'first_game_reward_claimed'
  | 'first_game_guide_skipped'
  | 'daily_challenge_opened'
  | 'daily_challenge_started'
  | 'daily_challenge_section_completed'
  | 'daily_challenge_completed'
  | 'daily_challenge_abandoned'
  | 'daily_streak_incremented'
  | 'daily_reward_claimed';

class AnalyticsTracker {
  track(event: AnalyticsEvent, properties?: Record<string, any>) {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, properties || '');
    }
  }
}

export const analytics = new AnalyticsTracker();
