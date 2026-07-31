import React from 'react';
import { LinearChart } from './LinearChart';

export const AccuracyChart: React.FC = () => {
  const data = [
    { label: 'M', value: 78 },
    { label: 'T', value: 82 },
    { label: 'W', value: 79 },
    { label: 'T', value: 85 },
    { label: 'F', value: 88 },
    { label: 'S', value: 90 },
    { label: 'S', value: 92 },
  ];

  return (
    <LinearChart
      title="Accuracy Trend"
      subtitle="Accuracy over the last 7 days"
      data={data}
      currentValue="92%"
    />
  );
};
