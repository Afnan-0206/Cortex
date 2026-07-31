import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface DataPoint {
  label: string;
  value: number;
}

interface LinearChartProps {
  title: string;
  subtitle?: string;
  data: DataPoint[];
  currentValue?: string;
}

export const LinearChart: React.FC<LinearChartProps> = ({
  title,
  subtitle,
  data,
  currentValue,
}) => {
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {currentValue && <Text style={styles.currentVal}>{currentValue}</Text>}
      </View>

      <View style={styles.chartContainer}>
        {data.map((item, idx) => {
          const heightPercent = (item.value / maxVal) * 100;
          return (
            <View key={idx} style={styles.col}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${heightPercent}%` },
                  ]}
                />
              </View>
              <Text style={styles.label}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  currentVal: {
    fontFamily: 'Inter_600SemiBold',
    fontVariant: ['tabular-nums'],
    fontSize: 18,
    color: colors.textPrimary,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  col: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.textPrimary,
    borderRadius: 7,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
  },
});
