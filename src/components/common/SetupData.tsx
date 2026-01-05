import React, { useState } from 'react';
import { Button, Card, Typography, message, Space } from 'antd';
import { importMockData } from '../../utils/importMockData';

const { Title, Text } = Typography;

export const SetupData: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleImportData = async () => {
    setLoading(true);
    try {
      // Đợi một chút để đảm bảo rules đã được áp dụng
      await new Promise(resolve => setTimeout(resolve, 1000));
      await importMockData();
      message.success('Dữ liệu đã được import thành công!');
    } catch (error: any) {
      console.error('Import error:', error);
      if (error.message.includes('permissions')) {
        message.error('Lỗi quyền truy cập. Vui lòng kiểm tra Firestore Rules và thử lại sau vài phút.');
      } else {
        message.error('Lỗi khi import dữ liệu: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <Title level={3}>Thiết lập dữ liệu ban đầu</Title>
          <Text type="secondary">
            Nhấn nút bên dưới để tạo tài khoản admin và import dữ liệu mẫu
          </Text>
        </div>

        <Space direction="vertical" className="w-full">
          <div className="bg-blue-50 p-4 rounded">
            <Text strong>Tài khoản admin sẽ được tạo:</Text>
            <br />
            <Text code>Email: admin@hotel.com</Text>
            <br />
            <Text code>Password: password123</Text>
          </div>

          <Button 
            type="primary" 
            size="large"
            className="w-full"
            loading={loading}
            onClick={handleImportData}
          >
            Tạo dữ liệu mẫu
          </Button>

          <Text type="secondary" className="text-xs text-center">
            Chỉ cần thực hiện một lần duy nhất
          </Text>
        </Space>
      </Card>
    </div>
  );
};