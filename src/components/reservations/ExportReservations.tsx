import React, { useState } from 'react';
import { 
  Button, 
  Dropdown, 
  Modal, 
  Form, 
  Select, 
  DatePicker, 
  message,
  Space
} from 'antd';
import { 
  DownloadOutlined, 
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reservationService } from '../../services/reservationService';

const { RangePicker } = DatePicker;

interface ExportReservationsProps {
  hotelId: string;
  currentFilters?: any;
}

export const ExportReservations: React.FC<ExportReservationsProps> = ({
  hotelId,
  currentFilters = {}
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleQuickExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      setLoading(true);
      const blob = await reservationService.exportReservations(
        hotelId,
        currentFilters,
        format
      );
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reservations_${dayjs().format('YYYY-MM-DD')}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(`Reservations exported as ${format.toUpperCase()}`);
    } catch (error) {
      message.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomExport = async (values: any) => {
    try {
      setLoading(true);
      
      const filters = {
        ...currentFilters,
        dateRange: values.dateRange ? {
          start: values.dateRange[0].format('YYYY-MM-DD'),
          end: values.dateRange[1].format('YYYY-MM-DD')
        } : undefined,
        paymentStatus: values.paymentStatus,
        sources: values.sources
      };
      
      const blob = await reservationService.exportReservations(
        hotelId,
        filters,
        values.format
      );
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reservations_custom_${dayjs().format('YYYY-MM-DD')}.${values.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success(`Custom export completed`);
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Export failed');
    } finally {
      setLoading(false);
    }
  };

  const quickExportItems = [
    {
      key: 'csv',
      label: 'Export as CSV',
      icon: <FileTextOutlined />,
      onClick: () => handleQuickExport('csv')
    },
    {
      key: 'excel',
      label: 'Export as Excel',
      icon: <FileExcelOutlined />,
      onClick: () => handleQuickExport('excel')
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      icon: <FilePdfOutlined />,
      onClick: () => handleQuickExport('pdf')
    },
    {
      type: 'divider'
    },
    {
      key: 'custom',
      label: 'Custom Export...',
      icon: <DownloadOutlined />,
      onClick: () => setModalVisible(true)
    }
  ];

  return (
    <>
      <Dropdown
        menu={{ 
          items: quickExportItems,
          onClick: ({ key }) => {
            const item = quickExportItems.find(i => i.key === key);
            if (item?.onClick) item.onClick();
          }
        }}
        trigger={['click']}
      >
        <Button 
          icon={<DownloadOutlined />}
          loading={loading}
        >
          Export
        </Button>
      </Dropdown>

      <Modal
        title="Custom Export"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCustomExport}
          initialValues={{
            format: 'csv',
            dateRange: [dayjs().subtract(30, 'days'), dayjs()]
          }}
        >
          <Form.Item
            label="Export Format"
            name="format"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="csv">CSV</Select.Option>
              <Select.Option value="excel">Excel</Select.Option>
              <Select.Option value="pdf">PDF</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Date Range"
            name="dateRange"
          >
            <RangePicker className="w-full" />
          </Form.Item>

          <Form.Item
            label="Payment Status"
            name="paymentStatus"
          >
            <Select
              mode="multiple"
              placeholder="All payment statuses"
              allowClear
            >
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="partial">Partial</Select.Option>
              <Select.Option value="paid">Paid</Select.Option>
              <Select.Option value="refunded">Refunded</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Booking Sources"
            name="sources"
          >
            <Select
              mode="multiple"
              placeholder="All sources"
              allowClear
            >
              <Select.Option value="online">Online</Select.Option>
              <Select.Option value="phone">Phone</Select.Option>
              <Select.Option value="walk-in">Walk-in</Select.Option>
              <Select.Option value="agent">Agent</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              icon={<DownloadOutlined />}
            >
              Export
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};