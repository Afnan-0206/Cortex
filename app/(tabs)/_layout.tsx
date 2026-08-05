import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '../../src/components/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* 1. ARENA (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Arena',
        }}
      />

      {/* 2. COMPETE */}
      <Tabs.Screen
        name="compete"
        options={{
          title: 'Compete',
        }}
      />

      {/* 3. QUESTS */}
      <Tabs.Screen
        name="puzzles"
        options={{
          title: 'Quests',
        }}
      />

      {/* 4. FEED */}
      <Tabs.Screen
        name="nets"
        options={{
          title: 'Feed',
        }}
      />

      {/* 5. DAILY */}
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Daily Workout',
        }}
      />

      {/* 6. PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />

      {/* Hidden secondary tabs */}
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}


