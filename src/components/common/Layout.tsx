import React, { useState } from 'react';
import { Layout as AntLayout } from 'antd';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

const { Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <AntLayout className="min-h-screen">
      <Sidebar collapsed={collapsed} />
      <AntLayout>
        <Header collapsed={collapsed} onToggle={toggleSidebar} />
        <Content className="p-6 bg-gray-50">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};