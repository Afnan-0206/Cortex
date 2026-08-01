import React from 'react';
import { StyleSheet, Platform, View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useUserStore } from '../../src/store/userStore';

interface TabIconProps {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  focused: boolean;
  badge?: string;
}

const TabIcon: React.FC<TabIconProps> = ({ name, label, focused, badge }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(focused ? 1.08 : 1.0, {
          duration: 180,
          easing: Easing.out(Easing.ease),
        }),
      },
    ],
  }));

  return (
    <Animated.View style={[styles.tabItemContainer, animatedStyle]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={name}
          size={22}
          color={focused ? '#84cc16' : '#6b7280'}
        />
        {badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, { color: focused ? '#84cc16' : '#6b7280' }]}>
        {label}
      </Text>
      {focused && <View style={styles.activeIndicator} />}
    </Animated.View>
  );
};

export default function TabsLayout() {
  const profile = useUserStore((state) => state.profile);
  const completedCount = Math.min(4, (profile.completedQuests ?? []).length);
  const questBadgeText = `${completedCount}/4`;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 76 : 64,
          backgroundColor: '#121418',
          borderTopWidth: 1,
          borderTopColor: '#20242d',
          paddingBottom: Platform.OS === 'ios' ? 16 : 4,
          paddingTop: 4,
          elevation: 10,
        },
      }}
    >
      {/* 1. ARENA (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Arena',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="sword-cross" label="ARENA" focused={focused} />
          ),
        }}
      />

      {/* 2. COMPETE */}
      <Tabs.Screen
        name="compete"
        options={{
          title: 'Compete',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="trophy-outline" label="COMPETE" focused={focused} />
          ),
        }}
      />

      {/* 3. QUESTS */}
      <Tabs.Screen
        name="puzzles"
        options={{
          title: 'Quests',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="treasure-chest-outline" label="QUESTS" focused={focused} badge={questBadgeText} />
          ),
        }}
      />

      {/* 4. FEED */}
      <Tabs.Screen
        name="nets"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="cards-outline" label="FEED" focused={focused} />
          ),
        }}
      />

      {/* 5. DAILY */}
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Daily Workout',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="calendar-check" label="DAILY" focused={focused} />
          ),
        }}
      />

      {/* 6. MORE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="dots-horizontal-circle-outline" label="MORE" focused={focused} />
          ),
        }}
      />

      {/* Hidden secondary tabs */}
      <Tabs.Screen
        name="battle"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 52,
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -14,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 3,
    backgroundColor: '#84cc16',
    borderRadius: 2,
  },
});

