import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';

const { Title, Text } = Typography;

export const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await authService.sendPasswordResetEmail(values.email);
      setEmailSent(true);
      message.success('Email đặt lại mật khẩu đã được gửi!');
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <MailOutlined className="text-4xl text-green-500 mb-4" />
            <Title level={3}>Email đã được gửi!</Title>
            <Text className="text-gray-600">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn.
              Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
            </Text>
            <div className="mt-6">
              <Link to="/login">
                <Button type="primary" icon={<ArrowLeftOutlined />}>
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <Title level={3}>Quên mật khẩu?</Title>
          <Text className="text-gray-600">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
          </Text>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark={false}
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
              prefix={<MailOutlined />}
              placeholder="Nhập email của bạn"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              className="w-full"
            >
              Gửi email đặt lại mật khẩu
            </Button>
          </Form.Item>

          <div className="text-center">
            <Link to="/login" className="text-blue-600 hover:text-blue-800">
              <ArrowLeftOutlined className="mr-1" />
              Quay lại đăng nhập
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};