import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, SettingOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { formatFirebaseError } from '../utils/errorUtils';
import { useAuthStore } from '../store/useAuthStore';
import { SetupData } from '../components/common/SetupData';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const { setError } = useAuthStore();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      await authService.signIn(values.email, values.password);
      message.success('Đăng nhập thành công!');
    } catch (error: any) {
      const msg = formatFirebaseError(error);
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (showSetup) {
    return <SetupData />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-blue-600 mb-2">BlueHT</div>
          <Title level={3} className="mb-2">Hệ Thống Quản Lý Khách Sạn</Title>
          <Text type="secondary">Đăng nhập để tiếp tục</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="admin@hotel.com" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Mật khẩu" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              className="w-full"
              loading={loading}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider>hoặc</Divider>

        <Button 
          icon={<SettingOutlined />}
          onClick={() => setShowSetup(true)}
          className="w-full"
          type="dashed"
        >
          Tạo dữ liệu mẫu
        </Button>

        <div className="text-center text-sm text-gray-500 mt-4">
          <Text type="secondary">
            Demo: admin@hotel.com / password123
          </Text>
          <div className="mt-2">
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800">
              Quên mật khẩu?
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};