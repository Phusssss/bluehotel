import React, { useEffect, useState } from 'react';
import { Button, Typography, Space, message, Modal } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/useAuthStore';
import { useGuestStore } from '../store/useGuestStore';
import { useReservationStore } from '../store/useReservationStore';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { GuestList } from '../components/guests/GuestList';
import { GuestForm } from '../components/guests/GuestForm';
import { GuestFilterComponent } from '../components/guests/GuestFilter';
import { ReservationList } from '../components/reservations/ReservationList';
import { ReservationForm } from '../components/reservations/ReservationForm';
import { ReservationCalendar } from '../components/reservations/ReservationCalendar';
import { CheckInCheckOutForm } from '../components/reservations/CheckInCheckOutForm';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import type { Guest } from '../types';

const { Title } = Typography;
const { confirm } = Modal;

export const Reservations: React.FC = () => {
  const { userProfile } = useAuthStore();
  const {
    reservations,
    loading,
    error,
    filter,
    selectedReservation,
    operationStatus,
    fetchReservations,
    createReservation,
    updateReservation,
    deleteReservation,
    checkInReservation,
    checkOutReservation,
    setFilter,
    setSelectedReservation,
  } = useReservationStore();

  const [showForm, setShowForm] = useState(false);
  const [showCheckInOut, setShowCheckInOut] = useState(false);
  const [checkInOutType, setCheckInOutType] = useState<'checkin' | 'checkout'>('checkin');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (userProfile?.hotelId) {
      fetchReservations(userProfile.hotelId);
    }
  }, [userProfile?.hotelId, filter]);

  const handleCreateReservation = async (values: any) => {
    try {
      await createReservation({
        ...values,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      message.success('Tạo đặt phòng thành công!');
      setShowForm(false);
      setSelectedReservation(null);
    } catch (error) {
      message.error('Lỗi khi tạo đặt phòng!');
    }
  };

  const handleUpdateReservation = async (values: any) => {
    if (!selectedReservation) return;
    
    try {
      await updateReservation(selectedReservation.id, values);
      message.success('Cập nhật đặt phòng thành công!');
      setShowForm(false);
      setSelectedReservation(null);
    } catch (error) {
      message.error('Lỗi khi cập nhật đặt phòng!');
    }
  };

  const handleDeleteReservation = (reservationId: string) => {
    confirm({
      title: 'Xác nhận xóa đặt phòng',
      content: 'Bạn có chắc chắn muốn xóa đặt phòng này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteReservation(reservationId);
          message.success('Xóa đặt phòng thành công!');
        } catch (error) {
          message.error('Lỗi khi xóa đặt phòng!');
        }
      },
    });
  };

  const handleEditReservation = (reservation: any) => {
    setSelectedReservation(reservation);
    setShowForm(true);
  };

  const handleViewReservation = (reservation: any) => {
    message.info('Chức năng xem chi tiết đang được phát triển');
  };

  // ✨ New check-in/out handlers
  const handleCheckIn = (reservation: any) => {
    setSelectedReservation(reservation);
    setCheckInOutType('checkin');
    setShowCheckInOut(true);
  };

  const handleCheckOut = (reservation: any) => {
    setSelectedReservation(reservation);
    setCheckInOutType('checkout');
    setShowCheckInOut(true);
  };

  const handleCheckInOutSubmit = async (values: any) => {
    if (!selectedReservation) return;
    
    try {
      if (checkInOutType === 'checkin') {
        await checkInReservation(selectedReservation.id, values);
        message.success('Check-in thành công!');
      } else {
        await checkOutReservation(selectedReservation.id, values);
        message.success('Check-out thành công!');
      }
      setShowCheckInOut(false);
      setSelectedReservation(null);
    } catch (error) {
      message.error(`Lỗi khi ${checkInOutType === 'checkin' ? 'check-in' : 'check-out'}!`);
    }
  };

  if (error) {
    message.error(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Quản lý đặt phòng</Title>
        <Space>
          <Button
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
          >
            {viewMode === 'list' ? 'Lịch' : 'Danh sách'}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedReservation(null);
              setShowForm(true);
            }}
          >
            Tạo đặt phòng
          </Button>
        </Space>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg">
          <ReservationList
            reservations={reservations}
            loading={loading}
            onEdit={handleEditReservation}
            onDelete={handleDeleteReservation}
            onView={handleViewReservation}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            operationStatus={operationStatus}
          />
        </div>
      ) : (
        <ReservationCalendar
          reservations={reservations}
          onDateSelect={(date) => {
            console.log('Selected date:', date.format('YYYY-MM-DD'));
          }}
        />
      )}

      <ReservationForm
        visible={showForm}
        reservation={selectedReservation}
        onCancel={() => {
          setShowForm(false);
          setSelectedReservation(null);
        }}
        onSubmit={selectedReservation ? handleUpdateReservation : handleCreateReservation}
        loading={loading}
      />

      <CheckInCheckOutForm
        visible={showCheckInOut}
        reservation={selectedReservation}
        type={checkInOutType}
        onCancel={() => {
          setShowCheckInOut(false);
          setSelectedReservation(null);
        }}
        onSubmit={handleCheckInOutSubmit}
        loading={operationStatus[selectedReservation?.id || '']?.[checkInOutType === 'checkin' ? 'checkingIn' : 'checkingOut']}
      />
    </div>
  );
};

export const Guests: React.FC = () => {
  const {
    guests,
    loading,
    error,
    filter,
    selectedGuest,
    fetchGuests,
    createGuest,
    updateGuest,
    deleteGuest,
    setFilter,
    setSelectedGuest,
  } = useGuestStore();

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, [filter]);

  const handleCreateGuest = async (values: any) => {
    try {
      await createGuest({
        ...values,
        totalStays: 0,
        createdAt: new Date(),
      });
      message.success('Tạo khách hàng thành công!');
      setShowForm(false);
      setSelectedGuest(null);
    } catch (error) {
      message.error('Lỗi khi tạo khách hàng!');
    }
  };

  const handleUpdateGuest = async (values: any) => {
    if (!selectedGuest) return;
    
    try {
      await updateGuest(selectedGuest.id, values);
      message.success('Cập nhật khách hàng thành công!');
      setShowForm(false);
      setSelectedGuest(null);
    } catch (error) {
      message.error('Lỗi khi cập nhật khách hàng!');
    }
  };

  const handleDeleteGuest = (guestId: string) => {
    confirm({
      title: 'Xác nhận xóa khách hàng',
      content: 'Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteGuest(guestId);
          message.success('Xóa khách hàng thành công!');
        } catch (error) {
          message.error('Lỗi khi xóa khách hàng!');
        }
      },
    });
  };

  const handleEditGuest = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowForm(true);
  };

  const handleViewGuest = (guest: Guest) => {
    // TODO: Implement guest detail view
    message.info('Chức năng xem chi tiết đang được phát triển');
  };

  const handleFilterChange = (newFilter: any) => {
    setFilter(newFilter);
  };

  const handleClearFilter = () => {
    setFilter({});
  };

  const filteredGuests = guests.filter(guest => {
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch = 
        guest.firstName.toLowerCase().includes(searchLower) ||
        guest.lastName.toLowerCase().includes(searchLower) ||
        guest.email.toLowerCase().includes(searchLower) ||
        guest.phone.toLowerCase().includes(searchLower);
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
        <Title level={2}>Quản lý khách hàng</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedGuest(null);
            setShowForm(true);
          }}
        >
          Thêm khách hàng
        </Button>
      </div>

      <GuestFilterComponent
        filter={filter}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilter}
      />

      <div className="bg-white rounded-lg">
        <GuestList
          guests={filteredGuests}
          loading={loading}
          onEdit={handleEditGuest}
          onDelete={handleDeleteGuest}
          onView={handleViewGuest}
        />
      </div>

      <GuestForm
        visible={showForm}
        guest={selectedGuest}
        onCancel={() => {
          setShowForm(false);
          setSelectedGuest(null);
        }}
        onSubmit={selectedGuest ? handleUpdateGuest : handleCreateGuest}
        loading={loading}
      />
    </div>
  );
};

export const Invoices: React.FC = () => {
  const { userProfile } = useAuthStore();
  const {
    invoices,
    loading,
    error,
    selectedInvoice,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    setSelectedInvoice,
  } = useInvoiceStore();

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (userProfile?.hotelId) {
      fetchInvoices(userProfile.hotelId);
    }
  }, [userProfile?.hotelId]);

  const handleCreateInvoice = async (values: any) => {
    try {
      await createInvoice({
        ...values,
        guestId: 'guest-001', // TODO: Get from reservation
        createdAt: new Date(),
      });
      message.success('Tạo hóa đơn thành công!');
      setShowForm(false);
      setSelectedInvoice(null);
    } catch (error) {
      message.error('Lỗi khi tạo hóa đơn!');
    }
  };

  const handleUpdateInvoice = async (values: any) => {
    if (!selectedInvoice) return;
    
    try {
      await updateInvoice(selectedInvoice.id, values);
      message.success('Cập nhật hóa đơn thành công!');
      setShowForm(false);
      setSelectedInvoice(null);
    } catch (error) {
      message.error('Lỗi khi cập nhật hóa đơn!');
    }
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    confirm({
      title: 'Xác nhận xóa hóa đơn',
      content: 'Bạn có chắc chắn muốn xóa hóa đơn này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteInvoice(invoiceId);
          message.success('Xóa hóa đơn thành công!');
        } catch (error) {
          message.error('Lỗi khi xóa hóa đơn!');
        }
      },
    });
  };

  const handleEditInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowForm(true);
  };

  const handleViewInvoice = (invoice: any) => {
    message.info('Chức năng xem chi tiết đang được phát triển');
  };

  const handleExportPDF = (invoice: any) => {
    message.info('Chức năng xuất PDF đang được phát triển');
  };

  if (error) {
    message.error(error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Quản lý hóa đơn</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setSelectedInvoice(null);
            setShowForm(true);
          }}
        >
          Tạo hóa đơn
        </Button>
      </div>

      <div className="bg-white rounded-lg">
        <InvoiceList
          invoices={invoices}
          loading={loading}
          onEdit={handleEditInvoice}
          onDelete={handleDeleteInvoice}
          onView={handleViewInvoice}
          onExportPDF={handleExportPDF}
        />
      </div>

      <InvoiceForm
        visible={showForm}
        invoice={selectedInvoice}
        onCancel={() => {
          setShowForm(false);
          setSelectedInvoice(null);
        }}
        onSubmit={selectedInvoice ? handleUpdateInvoice : handleCreateInvoice}
        loading={loading}
      />
    </div>
  );
};

export const Services: React.FC = () => {
  return (
    <div>
      <Title level={2}>Quản lý dịch vụ</Title>
      <p>Trang quản lý dịch vụ đang được phát triển...</p>
    </div>
  );
};

export const Staff: React.FC = () => {
  return (
    <div>
      <Title level={2}>Quản lý nhân viên</Title>
      <p>Trang quản lý nhân viên đang được phát triển...</p>
    </div>
  );
};

export const Maintenance: React.FC = () => {
  return (
    <div>
      <Title level={2}>Quản lý bảo trì</Title>
      <p>Trang quản lý bảo trì đang được phát triển...</p>
    </div>
  );
};

export const Reports: React.FC = () => {
  return (
    <div>
      <Title level={2}>Báo cáo & Thống kê</Title>
      <p>Trang báo cáo đang được phát triển...</p>
    </div>
  );
};

export const Settings: React.FC = () => {
  return (
    <div>
      <Title level={2}>Cài đặt hệ thống</Title>
      <p>Trang cài đặt đang được phát triển...</p>
    </div>
  );
};

export const NotFound: React.FC = () => {
  return (
    <div className="text-center py-20">
      <Title level={1}>404</Title>
      <p>Trang không tồn tại</p>
    </div>
  );
};