import React from 'react';
import { Card, Tag, Avatar, Button, Dropdown } from 'antd';
import { UserOutlined, MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../store/useAuthStore';
import { hasPermission } from '../../utils/permissionUtils';
import type { Staff } from '../../types';

interface StaffCardProps {
  staff: Staff;
  onEdit: (staff: Staff) => void;
  onDelete: (staffId: string) => void;
  onView: (staff: Staff) => void;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  onEdit,
  onDelete,
  onView
}) => {
  const { userProfile } = useAuthStore();
  
  const canEdit = hasPermission(userProfile, ['update_staff'], userProfile?.hotelId);
  const canDelete = hasPermission(userProfile, ['delete_staff'], userProfile?.hotelId);
  const getStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      inactive: 'orange',
      terminated: 'red'
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getPositionText = (position: string) => {
    const texts = {
      manager: 'Quản lý',
      receptionist: 'Lễ tân',
      housekeeper: 'Buồng phòng',
      maintenance: 'Kỹ thuật',
      accounting: 'Kế toán'
    };
    return texts[position as keyof typeof texts] || position;
  };

  const menuItems = [
    {
      key: 'view',
      label: 'Xem chi tiết',
      icon: <EyeOutlined />,
      onClick: () => onView(staff)
    },
    ...(canEdit ? [{
      key: 'edit',
      label: 'Chỉnh sửa',
      icon: <EditOutlined />,
      onClick: () => onEdit(staff)
    }] : []),
    ...(canDelete ? [{
      key: 'delete',
      label: 'Xóa',
      icon: <DeleteOutlined />,
      onClick: () => onDelete(staff.id!),
      danger: true
    }] : [])
  ];

  return (
    <Card
      size="small"
      className="hover:shadow-md transition-shadow"
      actions={[
        <Button
          key="view"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => onView(staff)}
        >
          Xem
        </Button>,
        ...(canEdit ? [<Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={() => onEdit(staff)}
        >
          Sửa
        </Button>] : []),
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ]}
    >
      <div className="flex items-start gap-3">
        <Avatar size={48} icon={<UserOutlined />} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {staff.firstName} {staff.lastName}
          </h4>
          <p className="text-sm text-gray-600 truncate">{staff.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Tag color="blue">{getPositionText(staff.position)}</Tag>
            <Tag color={getStatusColor(staff.status)}>
              {staff.status === 'active' ? 'Hoạt động' : 
               staff.status === 'inactive' ? 'Tạm nghỉ' : 'Đã nghỉ'}
            </Tag>
          </div>
          {staff.phone && (
            <p className="text-xs text-gray-500 mt-1">{staff.phone}</p>
          )}
        </div>
      </div>
    </Card>
  );
};