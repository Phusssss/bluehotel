import React from 'react';
import { Spin } from 'antd';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'default', 
  tip = 'Đang tải...' 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Spin size={size} tip={tip} />
    </div>
  );
};