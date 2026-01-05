import React from 'react';
import { Layout, Grid } from 'antd';

const { useBreakpoint } = Grid;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  className = '' 
}) => {
  const screens = useBreakpoint();
  
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  
  const getResponsiveClass = () => {
    if (isMobile) return 'mobile-layout';
    if (isTablet) return 'tablet-layout';
    return 'desktop-layout';
  };

  return (
    <Layout className={`responsive-layout ${getResponsiveClass()} ${className}`}>
      {children}
    </Layout>
  );
};