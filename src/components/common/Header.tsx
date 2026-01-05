import React from 'react';
import { Layout, Avatar, Dropdown, Button, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined, BellOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/authService';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  const { user, userProfile } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader className="bg-white shadow-sm px-6 flex items-center justify-between">
      <div className="flex items-center">
        <Button
          type="text"
          icon={collapsed ? <span>☰</span> : <span>✕</span>}
          onClick={onToggle}
          className="mr-4"
        />
        <Text strong className="text-lg">
          Hệ Thống Quản Lý Khách Sạn
        </Text>
      </div>

      <Space size="middle">
        <Button
          type="text"
          icon={<BellOutlined />}
          className="flex items-center"
        />
        
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <div className="flex items-center cursor-pointer hover:bg-gray-50 px-3 py-2 rounded">
            <Avatar 
              size="small" 
              icon={<UserOutlined />} 
              className="mr-2"
            />
            <div className="flex flex-col">
              <Text strong className="text-sm">
                {userProfile?.email || user?.email}
              </Text>
              <Text type="secondary" className="text-xs">
                {userProfile?.role === 'admin' ? 'Quản trị viên' : 
                 userProfile?.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
              </Text>
            </div>
          </div>
        </Dropdown>
      </Space>
    </AntHeader>
  );
};