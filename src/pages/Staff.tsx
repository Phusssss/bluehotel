import React, { useEffect, useState } from 'react';
import { Button, Typography, Space, message, Modal, Spin, Input, Select, Checkbox } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useStaffStore } from '../store/useStaffStore';
import { useAuthStore } from '../store/useAuthStore';
import { StaffCard } from '../components/staff/StaffCard';
import { StaffForm } from '../components/staff/StaffForm';
import { formatFirebaseError } from '../utils/errorUtils';
import type { Staff } from '../types';

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
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (userProfile?.hotelId) {
      fetchStaffs(userProfile.hotelId);
    }
  }, [userProfile?.hotelId, filter]);

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

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowForm(true);
  };

  const handleViewStaff = (staff: Staff) => {
    // TODO: Implement staff detail view
    message.info('Chức năng xem chi tiết đang được phát triển');
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setFilter({ ...filter, search: value });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilter({ ...filter, [key]: value });
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
            onChange={(status) => {
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

  const filteredStaffs = staffs.filter(staff => {
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        staff.firstName.toLowerCase().includes(searchLower) ||
        staff.lastName.toLowerCase().includes(searchLower) ||
        staff.email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    return true;
  });

  if (error) {
    message.error(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Quản lý nhân viên</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedStaff(null);
            setShowForm(true);
          }}
        >
          Thêm nhân viên
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg space-y-4">
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Tìm kiếm nhân viên..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select
            placeholder="Vị trí"
            allowClear
            onChange={(value) => handleFilterChange('position', value)}
            className="min-w-32"
          >
            <Select.Option value="manager">Quản lý</Select.Option>
            <Select.Option value="receptionist">Lễ tân</Select.Option>
            <Select.Option value="housekeeper">Buồng phòng</Select.Option>
            <Select.Option value="maintenance">Kỹ thuật</Select.Option>
            <Select.Option value="accounting">Kế toán</Select.Option>
          </Select>
          <Select
            placeholder="Trạng thái"
            allowClear
            onChange={(value) => handleFilterChange('status', value)}
            className="min-w-32"
          >
            <Select.Option value="active">Hoạt động</Select.Option>
            <Select.Option value="inactive">Tạm nghỉ</Select.Option>
            <Select.Option value="terminated">Đã nghỉ</Select.Option>
          </Select>
        </div>

        {/* Bulk Operations */}
        {selectedStaffs.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-700">
              Đã chọn {selectedStaffs.length} nhân viên
            </span>
            <Button size="small" onClick={handleBulkStatusUpdate}>
              Cập nhật trạng thái
            </Button>
            <Button size="small" onClick={clearSelection}>
              Bỏ chọn
            </Button>
          </div>
        )}
      </div>

      {/* Staff List */}
      <div className="bg-white p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedStaffs.length === filteredStaffs.length && filteredStaffs.length > 0}
              indeterminate={selectedStaffs.length > 0 && selectedStaffs.length < filteredStaffs.length}
              onChange={(e) => {
                if (e.target.checked) {
                  filteredStaffs.forEach(staff => {
                    if (!selectedStaffs.includes(staff.id!)) {
                      toggleStaffSelection(staff.id!);
                    }
                  });
                } else {
                  clearSelection();
                }
              }}
            >
              Chọn tất cả
            </Checkbox>
            <span className="text-gray-600">
              Hiển thị {filteredStaffs.length} / {staffs.length} nhân viên
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" tip="Đang tải danh sách nhân viên..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredStaffs.map(staff => (
              <div key={staff.id} className="relative">
                <Checkbox
                  className="absolute top-2 left-2 z-10"
                  checked={selectedStaffs.includes(staff.id!)}
                  onChange={() => toggleStaffSelection(staff.id!)}
                />
                <StaffCard
                  staff={staff}
                  onEdit={handleEditStaff}
                  onDelete={handleDeleteStaff}
                  onView={handleViewStaff}
                />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredStaffs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {staffs.length === 0 ? 'Chưa có nhân viên nào' : 'Không tìm thấy nhân viên phù hợp'}
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-4">
            <Button 
              onClick={() => loadMoreStaffs(userProfile!.hotelId)}
              loading={loading}
            >
              Tải thêm
            </Button>
          </div>
        )}
      </div>

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