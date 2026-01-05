import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Input, 
  Select, 
  message,
  Tabs,
  Row,
  Col,
  Grid
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  CalendarOutlined,
  UnorderedListOutlined,
  DragOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useReservationStore } from '../store/useReservationStore';
import { useRoomStore } from '../store/useRoomStore';
import type { Reservation } from '../types';
import { ReservationForm } from '../components/reservations/ReservationForm';
import { CheckInCheckOutForm } from '../components/reservations/CheckInCheckOutForm';
import { CalendarView } from '../components/reservations/CalendarView';
import { DragDropCalendar } from '../components/reservations/DragDropCalendar';
import { AdvancedFilters } from '../components/reservations/AdvancedFilters';
import { BulkOperations } from '../components/reservations/BulkOperations';
import { ModificationHistory } from '../components/reservations/ModificationHistory';
import { ExportReservations } from '../components/reservations/ExportReservations';
import { ResponsiveLayout } from '../components/layout/ResponsiveLayout';

const { Search } = Input;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

export const Reservations: React.FC = () => {
  const {
    reservations,
    loading,
    error,
    operationStatus,
    fetchReservations,
    fetchReservationsAdvanced,
    createReservation,
    updateReservation,
    deleteReservation,
    checkInReservation,
    checkOutReservation,
    bulkUpdate,
    bulkDelete,
    moveReservation
  } = useReservationStore();
  
  const { rooms, fetchRooms } = useRoomStore();
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [checkInOutReservation, setCheckInOutReservation] = useState<Reservation | null>(null);
  const [checkInOutMode, setCheckInOutMode] = useState<'checkin' | 'checkout'>('checkin');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('list');
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [historyReservation, setHistoryReservation] = useState<string | null>(null);
  
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  
  const hotelId = 'hotel-1';
  
  useEffect(() => {
    fetchReservations(hotelId);
    fetchRooms(hotelId);
  }, [fetchReservations, fetchRooms, hotelId]);
  
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.guestName.toLowerCase().includes(searchText.toLowerCase()) ||
                         reservation.roomNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
                         reservation.confirmationCode?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || reservation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  
  const handleCreateReservation = async (values: any) => {
    try {
      await createReservation({
        ...values,
        hotelId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setIsFormVisible(false);
      message.success('Reservation created successfully');
    } catch (error) {
      message.error('Failed to create reservation');
    }
  };
  
  const handleUpdateReservation = async (values: any) => {
    if (!editingReservation) return;
    
    try {
      await updateReservation(editingReservation.id, values);
      setEditingReservation(null);
      setIsFormVisible(false);
      message.success('Reservation updated successfully');
    } catch (error) {
      message.error('Failed to update reservation');
    }
  };
  
  const handleDeleteReservation = async (reservationId: string) => {
    try {
      await deleteReservation(reservationId);
      message.success('Reservation deleted successfully');
    } catch (error) {
      message.error('Failed to delete reservation');
    }
  };
  
  const handleCheckInOut = async (values: any) => {
    if (!checkInOutReservation) return;
    
    try {
      if (checkInOutMode === 'checkin') {
        await checkInReservation(checkInOutReservation.id, {
          actualCheckInTime: values.actualTime,
          notes: values.notes,
          guestPreferences: values.guestPreferences
        });
        message.success('Guest checked in successfully');
      } else {
        await checkOutReservation(checkInOutReservation.id, {
          actualCheckOutTime: values.actualTime,
          notes: values.notes
        });
        message.success('Guest checked out successfully');
      }
      setCheckInOutReservation(null);
    } catch (error) {
      message.error(`Failed to ${checkInOutMode === 'checkin' ? 'check in' : 'check out'} guest`);
    }
  };
  
  const handleAdvancedFilters = async (filters: any) => {
    if (Object.keys(filters).length === 0) {
      await fetchReservations(hotelId);
    } else {
      await fetchReservationsAdvanced(hotelId, filters);
    }
  };
  
  const handleMoveReservation = async (reservationId: string, newRoomId: string) => {
    try {
      await moveReservation(reservationId, newRoomId);
      message.success('Reservation moved successfully');
    } catch (error) {
      message.error('Failed to move reservation');
    }
  };
  
  const columns: ColumnsType<Reservation> = [
    {
      title: 'Guest Name',
      dataIndex: 'guestName',
      key: 'guestName',
      sorter: (a, b) => a.guestName.localeCompare(b.guestName),
    },
    {
      title: 'Room',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      sorter: (a, b) => (a.roomNumber || '').localeCompare(b.roomNumber || ''),
    },
    {
      title: 'Check-in',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.checkInDate).unix() - dayjs(b.checkInDate).unix(),
    },
    {
      title: 'Check-out',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => dayjs(a.checkOutDate).unix() - dayjs(b.checkOutDate).unix(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pending: 'orange',
          confirmed: 'blue',
          'checked-in': 'green',
          'checked-out': 'purple',
          cancelled: 'red'
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Confirmed', value: 'confirmed' },
        { text: 'Checked In', value: 'checked-in' },
        { text: 'Checked Out', value: 'checked-out' },
        { text: 'Cancelled', value: 'cancelled' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Payment',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string = 'pending') => {
        const colors = { pending: 'orange', partial: 'blue', paid: 'green', refunded: 'red' };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${amount?.toFixed(2) || '0.00'}`,
      sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isCheckingIn = operationStatus[record.id]?.checkingIn;
        const isCheckingOut = operationStatus[record.id]?.checkingOut;
        
        return (
          <Space size="small">
            {record.status === 'confirmed' && (
              <Button
                size="small"
                type="primary"
                loading={isCheckingIn}
                onClick={() => {
                  setCheckInOutReservation(record);
                  setCheckInOutMode('checkin');
                }}
              >
                Check In
              </Button>
            )}
            {record.status === 'checked-in' && (
              <Button
                size="small"
                loading={isCheckingOut}
                onClick={() => {
                  setCheckInOutReservation(record);
                  setCheckInOutMode('checkout');
                }}
              >
                Check Out
              </Button>
            )}
            <Button
              size="small"
              onClick={() => {
                setEditingReservation(record);
                setIsFormVisible(true);
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              onClick={() => setHistoryReservation(record.id)}
            >
              History
            </Button>
            <Button
              size="small"
              danger
              onClick={() => handleDeleteReservation(record.id)}
            >
              Delete
            </Button>
          </Space>
        );
      },
    },
  ];
  
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys as string[]),
  };
  
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }
  
  return (
    <ResponsiveLayout>
      <div className="p-6">
        <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'justify-between items-center'} mb-6`}>
          <h1 className="text-2xl font-bold">Reservations</h1>
          <div className={`flex ${isMobile ? 'flex-col' : ''} space-x-2`}>
            <ExportReservations 
              hotelId={hotelId}
              currentFilters={{}}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingReservation(null);
                setIsFormVisible(true);
              }}
              className={isMobile ? 'w-full mt-2' : ''}
            >
              New Reservation
            </Button>
          </div>
        </div>
      
      <AdvancedFilters
        onFiltersChange={handleAdvancedFilters}
        loading={loading}
      />
      
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={<span><UnorderedListOutlined /> List View</span>} 
            key="list"
          >
            <div className="mb-4">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12} lg={8}>
                  <Search
                    placeholder="Search reservations..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    prefix={<SearchOutlined />}
                  />
                </Col>
                <Col xs={24} md={12} lg={6}>
                  <Select
                    placeholder="Filter by status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    allowClear
                    className="w-full"
                  >
                    <Select.Option value="pending">Pending</Select.Option>
                    <Select.Option value="confirmed">Confirmed</Select.Option>
                    <Select.Option value="checked-in">Checked In</Select.Option>
                    <Select.Option value="checked-out">Checked Out</Select.Option>
                    <Select.Option value="cancelled">Cancelled</Select.Option>
                  </Select>
                </Col>
              </Row>
            </div>
            
            <Table
              columns={columns}
              dataSource={filteredReservations}
              rowKey="id"
              loading={loading}
              rowSelection={rowSelection}
              scroll={{ x: isMobile ? 800 : undefined }}
              pagination={{
                pageSize: isMobile ? 5 : 10,
                showSizeChanger: !isMobile,
                showQuickJumper: !isMobile,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reservations`,
                simple: isMobile
              }}
            />
          </TabPane>
          
          <TabPane 
            tab={<span><CalendarOutlined /> Calendar View</span>} 
            key="calendar"
          >
            <CalendarView
              reservations={filteredReservations}
              onReservationClick={(reservation) => {
                setEditingReservation(reservation);
                setIsFormVisible(true);
              }}
              onDateSelect={(date) => {
                console.log('Selected date:', date);
              }}
            />
          </TabPane>
          
          <TabPane 
            tab={<span><DragOutlined /> Timeline View</span>} 
            key="timeline"
          >
            <DragDropCalendar
              reservations={filteredReservations}
              rooms={rooms}
              onMoveReservation={handleMoveReservation}
              onReservationClick={(reservation) => {
                setEditingReservation(reservation);
                setIsFormVisible(true);
              }}
            />
          </TabPane>
        </Tabs>
      </Card>
      
      <BulkOperations
        selectedReservations={selectedRowKeys}
        reservations={reservations}
        onBulkUpdate={bulkUpdate}
        onBulkDelete={bulkDelete}
        onClearSelection={() => setSelectedRowKeys([])}
      />
      
      <ReservationForm
        visible={isFormVisible}
        onCancel={() => {
          setIsFormVisible(false);
          setEditingReservation(null);
        }}
        onSubmit={editingReservation ? handleUpdateReservation : handleCreateReservation}
        initialValues={editingReservation}
        rooms={rooms}
      />
      
      <CheckInCheckOutForm
        visible={!!checkInOutReservation}
        mode={checkInOutMode}
        reservation={checkInOutReservation}
        onCancel={() => setCheckInOutReservation(null)}
        onSubmit={handleCheckInOut}
      />
      
      <ModificationHistory
        visible={!!historyReservation}
        reservationId={historyReservation}
        onClose={() => setHistoryReservation(null)}
      />
    </div>
    </ResponsiveLayout>
  );
};