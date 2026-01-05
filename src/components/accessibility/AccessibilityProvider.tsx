import React from 'react';
import { ConfigProvider } from 'antd';

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#f5222d',
          controlOutline: 'rgba(24, 144, 255, 0.2)',
          controlOutlineWidth: 2,
          controlHeight: 40,
          padding: 16,
        },
        components: {
          Button: {
            controlHeight: 44,
            paddingContentHorizontal: 16,
          },
          Input: {
            controlHeight: 44,
            paddingInline: 12,
          },
          Select: {
            controlHeight: 44,
          },
        },
      }}
    >
      <div
        role="main"
        aria-label="Hotel Management System"
        className="accessibility-wrapper"
      >
        {children}
      </div>
    </ConfigProvider>
  );
};