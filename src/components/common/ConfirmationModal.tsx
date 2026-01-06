import React from 'react';
import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmationModalProps {
  title: string;
  content: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
}

export const showConfirmationModal = ({
  title,
  content,
  onConfirm,
  onCancel,
  okText = 'Xác nhận',
  cancelText = 'Hủy',
  danger = false
}: ConfirmationModalProps) => {
  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined />,
    content,
    okText,
    cancelText,
    okType: danger ? 'danger' : 'primary',
    onOk: onConfirm,
    onCancel
  });
};