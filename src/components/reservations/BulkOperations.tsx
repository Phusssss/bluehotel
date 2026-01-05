import React, { useState } from 'react';
import { 
  Button, 
  Dropdown, 
  Modal, 
  Form, 
  Select, 
  Input, 
  message,
  Popconfirm,
  Space,
  Badge
} from 'antd';
import { 
  MoreOutlined, 
  DeleteOutlined, 
  EditOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import type { Reservation } from '../../types';

interface BulkOperationsProps {
  selectedReservations: string[];
  reservations: Reservation[];
  onBulkUpdate: (reservationIds: string[], updates: Partial<Reservation>) => Promise<void>;
  onBulkDelete: (reservationIds: string[]) => Promise<void>;
  onClearSelection: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedReservations,
  reservations,
  onBulkUpdate,
  onBulkDelete,
  onClearSelection
}) => {
  const [loading, setLoading] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const selectedCount = selectedReservations.length;
  
  if (selectedCount === 0) return null;

  const handleBulkUpdate = async (values: any) => {
    try {
      setLoading(true);
      const updates: Partial<Reservation> = {};
      
      if (values.status) updates.status = values.status;
      if (values.paymentStatus) updates.paymentStatus = values.paymentStatus;
      if (values.notes) updates.notes = values.notes;
      if (values.source) updates.source = values.source;

      await onBulkUpdate(selectedReservations, updates);
      message.success(`Updated ${selectedCount} reservations`);
      setUpdateModalVisible(false);
      onClearSelection();
      form.resetFields();
    } catch (error) {
      message.error('Failed to update reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    try {
      setLoading(true);
      await onBulkDelete(selectedReservations);
      message.success(`Deleted ${selectedCount} reservations`);
      onClearSelection();
    } catch (error) {
      message.error('Failed to delete reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      setLoading(true);
      await onBulkUpdate(selectedReservations, { status });
      message.success(`Updated ${selectedCount} reservations to ${status}`);
      onClearSelection();
    } catch (error) {
      message.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      key: 'confirm',
      label: 'Mark as Confirmed',
      icon: <CheckOutlined />,
      onClick: () => handleBulkStatusUpdate('confirmed')
    },
    {
      key: 'cancel',
      label: 'Mark as Cancelled',
      icon: <CloseOutlined />,
      onClick: () => handleBulkStatusUpdate('cancelled')
    },
    {
      key: 'edit',
      label: 'Bulk Edit',
      icon: <EditOutlined />,
      onClick: () => setUpdateModalVisible(true)
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      label: 'Delete Selected',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => {} // Handled by Popconfirm
    }
  ];

  return (
    <>
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg border p-4 z-50">
        <div className="flex items-center space-x-4">
          <Badge count={selectedCount} className="flex items-center">
            <span className="text-sm font-medium">
              {selectedCount} reservation{selectedCount > 1 ? 's' : ''} selected
            </span>
          </Badge>
          
          <Space>
            <Button size="small" onClick={onClearSelection}>
              Clear
            </Button>
            
            <Button 
              size="small" 
              type="primary"
              onClick={() => handleBulkStatusUpdate('confirmed')}
              loading={loading}
            >
              Confirm All
            </Button>
            
            <Dropdown
              menu={{ 
                items: menuItems.filter(item => item.key !== 'delete'),
                onClick: ({ key }) => {
                  const item = menuItems.find(i => i.key === key);
                  if (item?.onClick) item.onClick();
                }
              }}
              trigger={['click']}
            >
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
            
            <Popconfirm
              title={`Delete ${selectedCount} reservation${selectedCount > 1 ? 's' : ''}?`}
              description="This action cannot be undone."
              onConfirm={handleBulkDelete}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading }}
            >
              <Button 
                size="small" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        </div>
      </div>

      <Modal
        title="Bulk Update Reservations"
        open={updateModalVisible}
        onCancel={() => {
          setUpdateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleBulkUpdate}
        >
          <Form.Item label="Status" name="status">
            <Select
              placeholder="Select new status"
              allowClear
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Confirmed', value: 'confirmed' },
                { label: 'Checked In', value: 'checked-in' },
                { label: 'Checked Out', value: 'checked-out' },
                { label: 'Cancelled', value: 'cancelled' }
              ]}
            />
          </Form.Item>

          <Form.Item label="Payment Status" name="paymentStatus">
            <Select
              placeholder="Select payment status"
              allowClear
              options={[
                { label: 'Pending', value: 'pending' },
                { label: 'Partial', value: 'partial' },
                { label: 'Paid', value: 'paid' },
                { label: 'Refunded', value: 'refunded' }
              ]}
            />
          </Form.Item>

          <Form.Item label="Source" name="source">
            <Select
              placeholder="Select booking source"
              allowClear
              options={[
                { label: 'Direct', value: 'direct' },
                { label: 'Booking.com', value: 'booking' },
                { label: 'Expedia', value: 'expedia' },
                { label: 'Airbnb', value: 'airbnb' },
                { label: 'Phone', value: 'phone' },
                { label: 'Walk-in', value: 'walkin' }
              ]}
            />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea
              placeholder="Add notes to all selected reservations"
              rows={3}
            />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setUpdateModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update {selectedCount} Reservations
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};