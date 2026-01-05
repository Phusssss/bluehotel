import React, { useEffect, useState } from 'react';
import { Button, Typography, Space, message, Modal, Spin, Checkbox } from 'antd';
import { PlusOutlined, AppstoreOutlined, UnorderedListOutlined, EyeOutlined } from '@ant-design/icons';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { RoomCard } from '../components/rooms/RoomCard';
import { RoomForm } from '../components/rooms/RoomForm';
import { RoomFilterComponent } from '../components/rooms/RoomFilter';
import { RoomDetailModal } from '../components/rooms/RoomDetailModal';
import { BulkOperations } from '../components/rooms/BulkOperations';
import { formatFirebaseError } from '../utils/errorUtils';
import type { Room } from '../types';

const { Title } = Typography;
const { confirm } = Modal;

export const Rooms: React.FC = () => {
  const { userProfile } = useAuthStore();
  const {
    rooms,
    loading,
    error,
    filter,
    selectedRoom,
    selectedRooms,
    hasMore,
    fetchRooms,
    loadMoreRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    setFilter,
    setSelectedRoom,
    toggleRoomSelection,
    clearSelection,
  } = useRoomStore();

  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDetail, setShowDetail] = useState(false);
  const [detailRoom, setDetailRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (userProfile?.hotelId) {
      fetchRooms(userProfile.hotelId);
    }
  }, [userProfile?.hotelId, filter]);

  const handleCreateRoom = async (values: any) => {
    try {
      await createRoom({
        ...values,
        hotelId: userProfile!.hotelId,
        images: [],
        createdAt: new Date(),
        lastUpdated: new Date(),
      });
      message.success('Tạo phòng thành công!');
      setShowForm(false);
      setSelectedRoom(null);
    } catch (error: any) {
      message.error(formatFirebaseError(error));
    }
  };

  const handleUpdateRoom = async (values: any) => {
    if (!selectedRoom) return;
    
    try {
      await updateRoom(selectedRoom.id, {
        ...values,
        lastUpdated: new Date(),
      });
      message.success('Cập nhật phòng thành công!');
      setShowForm(false);
      setSelectedRoom(null);
    } catch (error: any) {
      message.error(formatFirebaseError(error));
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    confirm({
      title: 'Xác nhận xóa phòng',
      content: 'Bạn có chắc chắn muốn xóa phòng này? Thao tác này có thể được hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteRoom(roomId);
          message.success('Xóa phòng thành công!');
        } catch (error: any) {
          if (error.message.includes('đặt phòng đang hoạt động')) {
            confirm({
              title: 'Phòng có đặt phòng đang hoạt động',
              content: 'Phòng này có đặt phòng đang hoạt động. Bạn có muốn xóa bắt buộc không?',
              okText: 'Xóa bắt buộc',
              okType: 'danger',
              cancelText: 'Hủy',
              onOk: async () => {
                try {
                  await deleteRoom(roomId, true);
                  message.success('Xóa phòng thành công!');
                } catch (forceError: any) {
                  message.error(forceError.message);
                }
              },
            });
          } else {
            message.error(error.message);
          }
        }
      },
    });
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setShowForm(true);
  };

  const handleViewRoom = (room: Room) => {
    setDetailRoom(room);
    setShowDetail(true);
  };

  const handleFilterChange = (newFilter: any) => {
    setFilter(newFilter);
  };

  const handleClearFilter = () => {
    setFilter({});
  };

  const filteredRooms = rooms.filter(room => {
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch = 
        room.roomNumber.toLowerCase().includes(searchLower) ||
        room.amenities.some(amenity => amenity.toLowerCase().includes(searchLower));
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
        <Title level={2}>Quản lý phòng</Title>
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
              setSelectedRoom(null);
              setShowForm(true);
            }}
          >
            Thêm phòng
          </Button>
        </Space>
      </div>

      <BulkOperations selectedCount={selectedRooms.length} />

      <RoomFilterComponent
        filter={filter}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilter}
      />

      <div className="bg-white p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedRooms.length === filteredRooms.length && filteredRooms.length > 0}
              indeterminate={selectedRooms.length > 0 && selectedRooms.length < filteredRooms.length}
              onChange={(e) => {
                if (e.target.checked) {
                  filteredRooms.forEach(room => {
                    if (!selectedRooms.includes(room.id!)) {
                      toggleRoomSelection(room.id!);
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
              Hiển thị {filteredRooms.length} / {rooms.length} phòng
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" tip="Đang tải danh sách phòng..." />
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-4'
          }>
            {filteredRooms.map(room => (
              <div key={room.id} className="relative">
                <Checkbox
                  className="absolute top-2 left-2 z-10"
                  checked={selectedRooms.includes(room.id!)}
                  onChange={() => toggleRoomSelection(room.id!)}
                />
                <RoomCard
                  room={room}
                  onEdit={handleEditRoom}
                  onDelete={handleDeleteRoom}
                  onView={handleViewRoom}
                />
              </div>
            ))}
          </div>
        )}

        {!loading && filteredRooms.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {rooms.length === 0 ? 'Chưa có phòng nào' : 'Không tìm thấy phòng phù hợp'}
          </div>
        )}
        
        {hasMore && (
          <div className="text-center mt-4">
            <Button 
              onClick={() => loadMoreRooms(userProfile!.hotelId)}
              loading={loading}
            >
              Tải thêm
            </Button>
          </div>
        )}
      </div>

      <RoomForm
        visible={showForm}
        room={selectedRoom}
        onCancel={() => {
          setShowForm(false);
          setSelectedRoom(null);
        }}
        onSubmit={selectedRoom ? handleUpdateRoom : handleCreateRoom}
        loading={loading}
      />
      
      <RoomDetailModal
        room={detailRoom}
        visible={showDetail}
        onClose={() => {
          setShowDetail(false);
          setDetailRoom(null);
        }}
      />
    </div>
  );
};