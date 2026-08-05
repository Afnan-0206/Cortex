import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const CHANNEL_ID = 'cortex_reminders';

export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#84cc16',
      sound: 'default',
    });
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    await setupAndroidChannel();
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      await scheduleDailyReminders();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('[Notifications] Permission request error:', error);
    return false;
  }
}

export async function scheduleDailyReminders(): Promise<void> {
  try {
    await setupAndroidChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. 10:00 AM Reward Reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎁 Daily Reward Ready!',
        body: 'Log in to Cortex now to claim your daily login XP bonus.',
        sound: true,
        channelId: CHANNEL_ID,
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 10,
        minute: 0,
      },
    });

    // 2. 6:00 PM Daily Missions Reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Daily Missions Available',
        body: 'Complete your rotating daily missions to earn +40 XP each!',
        sound: true,
        channelId: CHANNEL_ID,
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 18,
        minute: 0,
      },
    });

    // 3. 8:00 PM Streak Preservation Reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 Don't lose your streak!",
        body: '2 minutes of Cortex today will keep your streak alive.',
        sound: true,
        channelId: CHANNEL_ID,
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });
  } catch (error) {
    console.warn('[Notifications] Scheduling error:', error);
  }
}

export async function ensureDailyRemindersScheduled(): Promise<void> {
  try {
    await setupAndroidChannel();
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      if (scheduled.length === 0) {
        await scheduleDailyReminders();
      }
    }
  } catch (error) {
    console.warn('[Notifications] Ensure scheduled error:', error);
  }
}

export async function sendTestNotification(): Promise<boolean> {
  try {
    await setupAndroidChannel();
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (status !== 'granted') {
      const res = await Notifications.requestPermissionsAsync();
      finalStatus = res.status;
    }

    if (finalStatus !== 'granted') return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡ Cortex Test Notification',
        body: 'Local notifications are working perfectly on your device!',
        sound: true,
        channelId: CHANNEL_ID,
      } as any,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
        repeats: false,
      },
    });
    return true;
  } catch (error) {
    console.warn('[Notifications] Test notification error:', error);
    return false;
  }
}

export async function setupStreakReminder(currentStreak?: number): Promise<void> {
  await scheduleDailyReminders();
}

export async function cancelStreakReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[Notifications] Cancel error:', error);
  }
}

export async function notifyMatchFound(): Promise<void> {
  try {
    await setupAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚔️ AI Rival Found!',
        body: 'Your 60s Sprint duel is ready to start.',
        sound: true,
        channelId: CHANNEL_ID,
      } as any,
      trigger: null,
    });
  } catch (error) {
    console.warn('[Notifications] Match found notification error:', error);
  }
}

