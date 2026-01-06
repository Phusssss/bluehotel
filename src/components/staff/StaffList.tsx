import React from 'react';
import { Table, Space, Button, Tag, Tooltip, Popover } from 'antd';
import { EditOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import type { Staff } from '../../types';

interface StaffListProps {
  staffs: Staff[];
  loading: boolean;
  selectedStaffs?: string[];
  onEdit: (staff: Staff) => void;
  onDelete: (staffId: string) => void;
  onSelectChange?: (selectedIds: string[]) => void;
  onPermissionsEdit?: (staffId: string) => void;
}

export const StaffList: React.FC<StaffListProps> = ({
  staffs,
  loading,
  selectedStaffs = [],
  onEdit,
  onDelete,
  onSelectChange,
  onPermissionsEdit
}) => {
  const columns = [
    {
      title: 'Tên',
      dataIndex: 'firstName',
      key: 'name',
      render: (firstName: string, record: Staff) => (
        <div>
          <strong>{`${firstName} ${record.lastName}`}</strong>
          <br />
          <span className="text-xs text-gray-500">{record.email}</span>
        </div>
      )
    },
    {
      title: 'Vị trí',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => <Tag color="blue">{position}</Tag>
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => dept || '-'
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors = {
          admin: 'red',
          manager: 'orange',
          staff: 'green'
        };
        return <Tag color={colors[role as keyof typeof colors]}>{role}</Tag>;
      }
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'green',
          inactive: 'orange',
          terminated: 'red'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      }
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: Date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-'
    },
    {
      title: 'Quyền',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms: string[], record: Staff) => (
        <Popover
          title="Quyền hạn"
          content={
            <div>
              {perms?.map(p => (
                <Tag key={p} size="small">{p}</Tag>
              ))}
            </div>
          }
        >
          <Button type="link" size="small">
            <LockOutlined /> {perms?.length || 0} quyền
          </Button>
        </Popover>
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record: Staff) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button 
              icon={<EditOutlined />}
              size="small"
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          {onPermissionsEdit && (
            <Tooltip title="Quản lý quyền">
              <Button 
                icon={<LockOutlined />}
                size="small"
                onClick={() => onPermissionsEdit(record.id!)}
              />
            </Tooltip>
          )}
          <Tooltip title="Xóa">
            <Button 
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => onDelete(record.id!)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={staffs}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      rowSelection={onSelectChange ? {
        selectedRowKeys: selectedStaffs,
        onChange: (keys) => onSelectChange(keys as string[])
      } : undefined}
      className="mt-6"
    />
  );
};