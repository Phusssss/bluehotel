import React, { useEffect, useState } from 'react';
import { Button, Typography, Space, message, Modal, Spin, Tabs, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useStaffStore } from '../store/useStaffStore';
import { useAuthStore } from '../store/useAuthStore';
import { StaffCard } from '../components/staff/StaffCard';
import { StaffList } from '../components/staff/StaffList';
import { StaffForm } from '../components/staff/StaffForm';
import { StaffFilterComponent } from '../components/staff/StaffFilter';
import { formatFirebaseError } from '../utils/errorUtils';
import { hasPermission } from '../utils/permissionUtils';
import type { Staff as StaffType } from '../types';

const { Title } = Typography;
const { confirm } = Modal;

export const Staff: React.FC = () => {
  const { userProfile } = useAuthStore();
  const {
    staffs,
    loading,
    error,
    filter,
    selectedStaff,
    selectedStaffs,
    hasMore,
    fetchStaffs,
    loadMoreStaffs,
    createStaff,
    updateStaff,
    deleteStaff,
    setFilter,
    setSelectedStaff,
    toggleStaffSelection,
    clearSelection,
    bulkUpdateStatus
  } = useStaffStore();

  const [showForm, setShowForm] = useState(false);
  const [tabKey, setTabKey] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (userProfile?.hotelId && hasPermission(userProfile, ['view_staffs'], userProfile.hotelId)) {
      fetchStaffs(userProfile.hotelId);
    }
  }, [userProfile?.hotelId, filter, fetchStaffs]);

  const handleCreateStaff = async (values: any, createUserAccount = false) => {
    try {
      await createStaff({
        ...values,
        hotelId: userProfile!.hotelId,
        createdAt: new Date(),
        updatedAt: new Date()
      }, createUserAccount);
      message.success('Tạo nhân viên thành công!');
      setShowForm(false);
      setSelectedStaff(null);
    } catch (error: any) {
      message.error(formatFirebaseError(error));
    }
  };

  const handleUpdateStaff = async (values: any) => {
    if (!selectedStaff) return;
    
    try {
      await updateStaff(selectedStaff.id!, {
        ...values,
        updatedAt: new Date()
      });
      message.success('Cập nhật nhân viên thành công!');
      setShowForm(false);
      setSelectedStaff(null);
    } catch (error: any) {
      message.error(formatFirebaseError(error));
    }
  };

  const handleDeleteStaff = (staffId: string) => {
    confirm({
      title: 'Xác nhận xóa nhân viên',
      content: 'Bạn có chắc chắn muốn xóa nhân viên này? Thao tác này có thể được hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteStaff(staffId);
          message.success('Xóa nhân viên thành công!');
        } catch (error: any) {
          message.error(formatFirebaseError(error));
        }
      },
    });
  };

  const handleEditStaff = (staff: StaffType) => {
    setSelectedStaff(staff);
    setShowForm(true);
  };

  const handleViewStaff = (staff: StaffType) => {
    message.info('Chức năng xem chi tiết đang được phát triển');
  };

  const handleBulkStatusUpdate = () => {
    if (selectedStaffs.length === 0) return;

    Modal.confirm({
      title: 'Cập nhật trạng thái nhân viên',
      content: (
        <div className="mt-4">
          <p>Chọn trạng thái mới cho {selectedStaffs.length} nhân viên đã chọn:</p>
          <Select
            className="w-full mt-2"
            placeholder="Chọn trạng thái"
            onChange={(status: string) => {
              Modal.destroyAll();
              bulkUpdateStatus(selectedStaffs, status).then(() => {
                message.success(`Đã cập nhật trạng thái cho ${selectedStaffs.length} nhân viên`);
              });
            }}
          >
            <Select.Option value="active">Hoạt động</Select.Option>
            <Select.Option value="inactive">Tạm nghỉ</Select.Option>
            <Select.Option value="terminated">Đã nghỉ</Select.Option>
          </Select>
        </div>
      ),
      okText: 'Cập nhật',
      cancelText: 'Hủy',
      onOk: () => {},
    });
  };

  const getFilteredStaffs = (status?: string) => {
    let filtered = staffs;
    if (status) {
      filtered = staffs.filter(s => s.status === status);
    }
    return filtered;
  };

  // Check permission before rendering
  if (!hasPermission(userProfile, ['view_staffs'], userProfile?.hotelId)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Title level={3}>Không có quyền truy cập</Title>
          <p>Bạn không có quyền xem danh sách nhân viên.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Quản lý nhân viên</Title>
        <Space>
          <Button
            icon={viewMode === 'grid' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? 'Danh sách' : 'Lưới'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedStaff(null);
              setShowForm(true);
            }}
            disabled={!hasPermission(userProfile, ['create_staff'], userProfile?.hotelId)}
          >
            Thêm nhân viên
          </Button>
        </Space>
      </div>

      <StaffFilterComponent 
        filter={filter}
        onFilterChange={setFilter}
      />

      <Tabs
        activeKey={tabKey}
        onChange={setTabKey}
        items={[
          {
            key: 'all',
            label: `Tất cả (${staffs.length})`,
            children: viewMode === 'grid' ? (
              <StaffGridView 
                staffs={getFilteredStaffs()}
                loading={loading}
                selectedStaffs={selectedStaffs}
                onEdit={handleEditStaff}
                onDelete={handleDeleteStaff}
                onView={handleViewStaff}
                onToggleSelection={toggleStaffSelection}
                clearSelection={clearSelection}
                error={error}
              />
            ) : (
              <StaffList
                staffs={getFilteredStaffs()}
                loading={loading}
                selectedStaffs={selectedStaffs}
                onEdit={handleEditStaff}
                onDelete={handleDeleteStaff}
                onSelectChange={(ids) => {
                  ids.forEach(id => {
                    if (!selectedStaffs.includes(id)) {
                      toggleStaffSelection(id);
                    }
                  });
                  selectedStaffs.forEach(id => {
                    if (!ids.includes(id)) {
                      toggleStaffSelection(id);
                    }
                  });
                }}
              />
            )
          },
          {
            key: 'active',
            label: `Hoạt động (${staffs.filter(s => s.status === 'active').length})`,
            children: viewMode === 'grid' ? (
              <StaffGridView 
                staffs={getFilteredStaffs('active')}
                loading={loading}
                selectedStaffs={selectedStaffs}
                onEdit={handleEditStaff}
                onDelete={handleDeleteStaff}
                onView={handleViewStaff}
                onToggleSelection={toggleStaffSelection}
                clearSelection={clearSelection}
                error={error}
              />
            ) : (
              <StaffList
                staffs={getFilteredStaffs('active')}
                loading={loading}
                selectedStaffs={selectedStaffs}
                onEdit={handleEditStaff}
                onDelete={handleDeleteStaff}
                onSelectChange={(ids) => {
                  ids.forEach(id => {
                    if (!selectedStaffs.includes(id)) {
                      toggleStaffSelection(id);
                    }
                  });
                  selectedStaffs.forEach(id => {
                    if (!ids.includes(id)) {
                      toggleStaffSelection(id);
                    }
                  });
                }}
              />
            )
          },
          {
            key: 'inactive',
            label: `Tạm nghỉ (${staffs.filter(s => s.status === 'inactive').length})`,
            children: viewMode === 'grid' ? (
              <StaffGridView 
                staffs={getFilteredStaffs('inactive')}
                loading={loading}
                selectedStaffs={selectedStaffs}
                onEdit={handleEditStaff}
                onDelete={handleDeleteStaff}
                onView={handleViewStaff}
                onToggleSelection={toggleStaffSelection}
                clearSelection={clearSelection}
                error={error}
              />
            ) : (
              <StaffList
                staffs={getFilteredStaffs('inactive')}
                loading={loading}
                selectedStaffs={selectedStaffs}
                onEdit={handleEditStaff}
                onDelete={handleDeleteStaff}
                onSelectChange={(ids) => {
                  ids.forEach(id => {
                    if (!selectedStaffs.includes(id)) {
                      toggleStaffSelection(id);
                    }
                  });
                  selectedStaffs.forEach(id => {
                    if (!ids.includes(id)) {
                      toggleStaffSelection(id);
                    }
                  });
                }}
              />
            )
          }
        ]}
      />

      <StaffForm
        visible={showForm}
        staff={selectedStaff}
        onCancel={() => {
          setShowForm(false);
          setSelectedStaff(null);
        }}
        onSubmit={selectedStaff ? handleUpdateStaff : handleCreateStaff}
        loading={loading}
      />
    </div>
  );
};

// Helper component for grid view
interface StaffGridViewProps {
  staffs: StaffType[];
  loading: boolean;
  selectedStaffs: string[];
  onEdit: (staff: StaffType) => void;
  onDelete: (staffId: string) => void;
  onView: (staff: StaffType) => void;
  onToggleSelection: (staffId: string) => void;
  clearSelection: () => void;
  error: string | null;
}

const StaffGridView: React.FC<StaffGridViewProps> = ({
  staffs,
  loading,
  selectedStaffs,
  onEdit,
  onDelete,
  onView,
  onToggleSelection,
  clearSelection,
  error
}) => {
  return (
    <div className="bg-white p-4 rounded-lg">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          Lỗi: {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spin size="large" tip="Đang tải danh sách nhân viên..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {staffs.map(staff => (
            <div key={staff.id} className="relative">
              <StaffCard
                staff={staff}
                onEdit={onEdit}
                onDelete={onDelete}
                onView={onView}
              />
            </div>
          ))}
        </div>
      )}

      {!loading && staffs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Chưa có nhân viên nào
        </div>
      )}
    </div>
  );
};