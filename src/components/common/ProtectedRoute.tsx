import React, { memo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';
import { hasPermission, hasRole } from '../../utils/permissionUtils';
import { Result, Button } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = memo(({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [] 
}) => {
  const { isAuthenticated, loading, userProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner tip="Đang xác thực..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check permissions
  if (requiredPermissions.length > 0 && !hasPermission(userProfile, requiredPermissions)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Result
          status="403"
          title="403"
          subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  // Check roles
  if (requiredRoles.length > 0 && !hasRole(userProfile, requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Result
          status="403"
          title="403"
          subTitle="Xin lỗi, vai trò của bạn không được phép truy cập trang này."
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
});