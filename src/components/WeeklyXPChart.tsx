import React from 'react';
import { LinearChart } from './LinearChart';

export const WeeklyXPChart: React.FC = () => {
  const data = [
    { label: 'M', value: 120 },
    { label: 'T', value: 180 },
    { label: 'W', value: 160 },
    { label: 'T', value: 220 },
    { label: 'F', value: 260 },
    { label: 'S', value: 210 },
    { label: 'S', value: 320 },
  ];

  return (
    <LinearChart
      title="Weekly XP"
      subtitle="XP earned over the last 7 days"
      data={data}
      currentValue="1,470 XP"
    />
  );
};
