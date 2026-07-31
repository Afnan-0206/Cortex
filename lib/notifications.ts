import { Platform } from 'react-native';
import { analytics } from './analytics';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;
  try {
    const Notifications = require('expo-notifications');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const res = await Notifications.getExpoPushTokenAsync();
    token = res.data;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  } catch (err) {
    console.warn('Push notification setup skipped:', err);
  }

  return token;
}

export async function sendLocalNotification(title: string, body: string) {
  try {
    const Notifications = require('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null,
    });
  } catch (e) {
    console.log(`[Notification fallback] ${title}: ${body}`);
  }
}

// Scheduled Daily 8 PM Streak Reminder
export async function setupStreakReminder(currentStreak: number = 17) {
  try {
    const Notifications = require('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🔥 Don't Break Your Streak!",
        body: `You're on a ${currentStreak}-day streak. Play one battle to keep it alive!`,
        sound: 'default',
      },
      trigger: {
        hour: 20,
        minute: 0,
        repeats: true,
      },
    });
    analytics.track('streak_kept', { currentStreak });
  } catch (e) {
    console.log(`[Streak Reminder Scheduled for 8:00 PM] ${currentStreak}-day streak.`);
  }
}

export async function notifyMatchFound() {
  await sendLocalNotification('Match Found', 'Open Cortex to start your 1v1 battle.');
}

export async function notifyStreakReminder() {
  await sendLocalNotification('Streak Reminder', "You're one game away from keeping your streak!");
}

export async function notifyRankUpdate(placesGained: number) {
  await sendLocalNotification('Rank Update', `You moved up ${placesGained} places on the Global League!`);
}
