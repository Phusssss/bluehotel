import React from 'react';
import { AnalyticsDashboard } from '../components/analytics/AnalyticsDashboard';
import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';

export const Analytics: React.FC = () => {
  return (
    <ResponsiveLayout>
      <AnalyticsDashboard />
    </ResponsiveLayout>
  );
};