import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  LinearTransition,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useUserStore } from '../store/userStore';

export interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

interface TabConfig {
  label: string;
  inactiveIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  activeIcon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  showBadge?: boolean;
}

const TAB_CONFIGS: Record<string, TabConfig> = {
  index: {
    label: 'Arena',
    inactiveIcon: 'home-variant-outline',
    activeIcon: 'home-variant',
  },
  compete: {
    label: 'Compete',
    inactiveIcon: 'trophy-outline',
    activeIcon: 'trophy',
  },
  puzzles: {
    label: 'Quests',
    inactiveIcon: 'treasure-chest-outline',
    activeIcon: 'treasure-chest',
    showBadge: true,
  },
  nets: {
    label: 'Feed',
    inactiveIcon: 'cards-outline',
    activeIcon: 'cards',
  },
  daily: {
    label: 'Daily',
    inactiveIcon: 'calendar-check-outline',
    activeIcon: 'calendar-check',
  },
  profile: {
    label: 'Profile',
    inactiveIcon: 'account-outline',
    activeIcon: 'account',
  },
};

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const completedCount = Math.min(4, (profile?.completedQuests ?? []).length);

  // STRICTLY filter out leaderboard & hidden routes so only 6 clean tabs display
  const visibleRoutes = state.routes.filter((route: any) => {
    if (route.name === 'leaderboard') return false;
    const descriptor = descriptors[route.key];
    return descriptor?.options?.href !== null;
  });

  return (
    <View
      style={[
        styles.containerWrapper,
        {
          bottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : Math.max(insets.bottom + 8, 12),
        },
      ]}
    >
      <View style={styles.tabBarContainer}>
        {visibleRoutes.map((route: any) => {
          const index = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === index;
          const config = TAB_CONFIGS[route.name] || {
            label: route.name,
            inactiveIcon: 'dots-horizontal',
            activeIcon: 'dots-horizontal',
          };

          const onPress = () => {
            Haptics.selectionAsync();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Animated.View
              key={route.key}
              layout={LinearTransition.duration(240).easing(Easing.out(Easing.cubic))}
              style={styles.tabItemWrapper}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.pressableItem}
              >
                {isFocused ? (
                  // Active White Pill Capsule
                  <View style={styles.activePill}>
                    <View style={styles.activeIconCircle}>
                      <MaterialCommunityIcons
                        name={config.activeIcon}
                        size={17}
                        color="#FFFFFF"
                      />
                    </View>
                    <Animated.Text
                      entering={FadeIn.duration(180)}
                      exiting={FadeOut.duration(120)}
                      style={styles.activeLabel}
                      numberOfLines={1}
                    >
                      {config.label}
                    </Animated.Text>
                  </View>
                ) : (
                  // Inactive Icon
                  <View style={styles.inactiveContainer}>
                    <MaterialCommunityIcons
                      name={config.inactiveIcon}
                      size={22}
                      color="#6B667C"
                    />
                    {config.showBadge && completedCount < 4 && (
                      <View style={styles.badgeDot} />
                    )}
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121017',
    borderRadius: 36,
    paddingHorizontal: 6,
    paddingVertical: 6,
    height: 58,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
    borderWidth: 1,
    borderColor: '#1E1B26',
  },
  tabItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressableItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingLeft: 4,
    paddingRight: 14,
    paddingVertical: 4,
    height: 44,
    gap: 8,
  },
  activeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#121017',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: {
    color: '#121017',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inactiveContainer: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
});
