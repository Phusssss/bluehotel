import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
  CustomerServiceOutlined,
  TeamOutlined,
  ToolOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/rooms',
      icon: <HomeOutlined />,
      label: 'Quản lý phòng',
    },
    {
      key: '/reservations',
      icon: <CalendarOutlined />,
      label: 'Đặt phòng',
    },
    {
      key: '/guests',
      icon: <UserOutlined />,
      label: 'Khách hàng',
    },
    {
      key: '/invoices',
      icon: <FileTextOutlined />,
      label: 'Hóa đơn',
    },
    {
      key: '/services',
      icon: <CustomerServiceOutlined />,
      label: 'Dịch vụ',
    },
    {
      key: '/staff',
      icon: <TeamOutlined />,
      label: 'Nhân viên',
    },
    {
      key: '/maintenance',
      icon: <ToolOutlined />,
      label: 'Bảo trì',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={collapsed}
      className="bg-white shadow-lg"
      width={250}
    >
      <div className="p-4 text-center border-b">
        {!collapsed ? (
          <div>
            <h2 className="text-xl font-bold text-blue-600 mb-1">BlueHT</h2>
            <p className="text-xs text-gray-500">Hotel Management</p>
          </div>
        ) : (
          <div className="text-2xl font-bold text-blue-600">B</div>
        )}
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        className="border-r-0"
      />
    </Sider>
  );
};