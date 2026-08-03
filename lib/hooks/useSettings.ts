import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useUserStore } from '../../src/store/userStore';
import { setupStreakReminder, cancelStreakReminders } from '../notifications';

export interface UserSettings {
  notificationsEnabled: boolean;
  streakReminderTime: string;
  preferredMode: string;
  preferredDifficulty: number;
}

export function useSettings() {
  const user = useUserStore((s) => s.user);
  const { profile: userProfile, updateName } = useUserStore();
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    streakReminderTime: '20:00:00',
    preferredMode: 'math',
    preferredDifficulty: 1,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadSettings() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setSettings({
            notificationsEnabled: data.notifications_enabled ?? true,
            streakReminderTime: data.streak_reminder_time ?? '20:00:00',
            preferredMode: data.preferred_mode ?? 'math',
            preferredDifficulty: data.preferred_difficulty ?? 1,
          });
        }
      } catch (e) {
        // Table fallback
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [user]);

  const updateSettingField = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    if (!user) return;
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    setSaving(true);

    try {
      if (key === 'notificationsEnabled') {
        if (value) {
          await setupStreakReminder(userProfile.streak || 1);
        } else {
          await cancelStreakReminders();
        }
      }

      await supabase.from('user_settings').upsert({
        user_id: user.id,
        notifications_enabled: nextSettings.notificationsEnabled,
        streak_reminder_time: nextSettings.streakReminderTime,
        preferred_mode: nextSettings.preferredMode,
        preferred_difficulty: nextSettings.preferredDifficulty,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      // Table fallback
    } finally {
      setSaving(false);
    }
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) return;
    const clean = newUsername.trim();
    if (!clean) return;

    setSaving(true);
    try {
      await updateName(clean);

      await supabase
        .from('profiles')
        .update({ username: clean })
        .eq('id', user.id);
    } catch (e) {
      // Fallback
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    loading,
    saving,
    updateSettingField,
    updateUsername,
  };
}
