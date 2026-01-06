import React, { useEffect, useState } from 'react';
import { Button, Typography, Space, message, Modal, Tabs, Select, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, UserOutlined, CheckOutlined } from '@ant-design/icons';
import { useMaintenanceStore } from '../store/useMaintenanceStore';
import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';
import { useStaffStore } from '../store/useStaffStore';
import { MaintenanceList } from '../components/maintenance/MaintenanceList';
import { MaintenanceForm } from '../components/maintenance/MaintenanceForm';
import { MaintenanceFilter } from '../components/maintenance/MaintenanceFilter';
import { MaintenanceStats } from '../components/maintenance/MaintenanceStats';
import { formatFirebaseError } from '../utils/errorUtils';
import { hasPermission } from '../utils/permissionUtils';
import { maintenanceService } from '../services/maintenanceService';
import type { MaintenanceRequest } from '../types/maintenance';

const { Title } = Typography;
const { confirm } = Modal;

export const Maintenance: React.FC = () => {
  const { userProfile } = useAuthStore();
  const {
    requests,
    loading,
    error,
    filter,
    selectedRequest,
    selectedRequests,
    fetchRequests,
    createRequest,
    updateRequest,
    updateStatus,
    assignToStaff,
    deleteRequest,
    bulkUpdateStatus,
    setFilter,
    setSelectedRequest,
    clearSelection
  } = useMaintenanceStore();

  const { rooms, fetchRooms } = useRoomStore();
  const { staffs, fetchStaffs } = useStaffStore();

  const [showForm, setShowForm] = useState(false);
  const [tabKey, setTabKey] = useState('all');
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.hotelId && hasPermission(userProfile, ['manage_maintenance'], userProfile.hotelId)) {
      fetchRequests(userProfile.hotelId);
      fetchRooms(userProfile.hotelId);
      fetchStaffs(userProfile.hotelId);
      loadStats();
    }
  }, [userProfile?.hotelId, filter, fetchRequests, fetchRooms, fetchStaffs]);

  const loadStats = async () => {
    if (!userProfile?.hotelId) return;
    
    setStatsLoading(true);
    try {
      const statsData = await maintenanceService.getMaintenanceStats(userProfile.hotelId);
      setStats(statsData);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleCreateRequest = async (values: any) => {
    try {
      await createRequest({
        ...values,
        hotelId: userProfile!.hotelId,
        requestedBy: userProfile!.id || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      message.success('Maintenance request created successfully!');
      setShowForm(false);
      setSelectedRequest(null);
      loadStats();
    } catch (error: any) {
      message.error(formatFirebaseError(error));
    }
  };

  const handleUpdateRequest = async (values: any) => {
    if (!selectedRequest) return;
    
    try {
      await updateRequest(selectedRequest.id!, values, userProfile!.id || 'system');
      message.success('Maintenance request updated successfully!');
      setShowForm(false);
      setSelectedRequest(null);
      loadStats();
    } catch (error: any) {
      message.error(formatFirebaseError(error));
    }
  };

  const handleDeleteRequest = (requestId: string) => {
    confirm({
      title: 'Delete Maintenance Request',
      content: 'Are you sure you want to delete this maintenance request? This action can be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteRequest(requestId);
          message.success('Maintenance request deleted successfully!');
          loadStats();
        } catch (error: any) {
          message.error(formatFirebaseError(error));
        }
      },
    });
  };

  const handleEditRequest = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowForm(true);
  };

  const handleStatusChange = async (requestId: string, status: string) => {
    try {
      await updateStatus(requestId, status, userProfile!.id || 'system');
      message.success(`Status updated to ${status}`);
      loadStats();
    } catch (error: any) {
      message.error(formatFirebaseError(error));
    }
  };

  const handleAssignStaff = (requestId: string) => {
    const maintenanceStaff = staffs.filter(s => 
      s.position === 'maintenance' || s.permissions?.includes('manage_maintenance')
    );

    Modal.confirm({
      title: 'Assign Maintenance Staff',
      content: (
        <div className="mt-4">
          <p>Select staff member to assign this maintenance request:</p>
          <Select
            className="w-full mt-2"
            placeholder="Select staff member"
            onChange={(staffId: string) => {
              Modal.destroyAll();
              assignToStaff(requestId, staffId, userProfile!.id || 'system').then(() => {
                message.success('Maintenance request assigned successfully!');
              }).catch((error: any) => {
                message.error(formatFirebaseError(error));
              });
            }}
          >
            {maintenanceStaff.map(staff => (
              <Select.Option key={staff.id} value={staff.id}>
                {staff.firstName} {staff.lastName} - {staff.position}
              </Select.Option>
            ))}
          </Select>
        </div>
      ),
      okText: 'Assign',
      cancelText: 'Cancel',
      onOk: () => {},
    });
  };

  const handleBulkStatusUpdate = () => {
    if (selectedRequests.length === 0) return;

    Modal.confirm({
      title: 'Update Status',
      content: (
        <div className="mt-4">
          <p>Select new status for {selectedRequests.length} selected requests:</p>
          <Select
            className="w-full mt-2"
            placeholder="Select status"
            onChange={(status: string) => {
              Modal.destroyAll();
              bulkUpdateStatus(selectedRequests, status, userProfile!.id || 'system').then(() => {
                message.success(`Updated status for ${selectedRequests.length} requests`);
                loadStats();
              });
            }}
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="in-progress">In Progress</Select.Option>
            <Select.Option value="completed">Completed</Select.Option>
          </Select>
        </div>
      ),
      okText: 'Update',
      cancelText: 'Cancel',
      onOk: () => {},
    });
  };

  const getFilteredRequests = (status?: string) => {
    let filtered = requests;
    if (status) {
      filtered = requests.filter(r => r.status === status);
    }
    return filtered;
  };

  // Check permission before rendering
  if (!hasPermission(userProfile, ['manage_maintenance'], userProfile?.hotelId)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Title level={3}>Access Denied</Title>
          <p>You don't have permission to view maintenance requests.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>Maintenance Management</Title>
        <Space>
          {selectedRequests.length > 0 && (
            <>
              <Button
                icon={<CheckOutlined />}
                onClick={handleBulkStatusUpdate}
              >
                Update Status ({selectedRequests.length})
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  confirm({
                    title: 'Delete Selected Requests',
                    content: `Delete ${selectedRequests.length} maintenance requests?`,
                    onOk: () => {
                      selectedRequests.forEach(id => handleDeleteRequest(id));
                      clearSelection();
                    }
                  });
                }}
              >
                Delete ({selectedRequests.length})
              </Button>
            </>
          )}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedRequest(null);
              setShowForm(true);
            }}
            disabled={!hasPermission(userProfile, ['manage_maintenance'], userProfile?.hotelId)}
          >
            Create Request
          </Button>
        </Space>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <MaintenanceStats stats={stats} loading={statsLoading} />
      )}

      <MaintenanceFilter 
        filter={filter}
        onFilterChange={setFilter}
        staff={staffs}
        rooms={rooms}
      />

      <Tabs
        activeKey={tabKey}
        onChange={setTabKey}
        items={[
          {
            key: 'all',
            label: `All Requests (${requests.length})`,
            children: (
              <MaintenanceList
                requests={getFilteredRequests()}
                loading={loading}
                selectedRequests={selectedRequests}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
                onSelectChange={(ids) => {
                  // Update selection in store
                  ids.forEach(id => {
                    if (!selectedRequests.includes(id)) {
                      // toggleRequestSelection(id);
                    }
                  });
                }}
                onStatusChange={handleStatusChange}
                onAssign={handleAssignStaff}
              />
            )
          },
          {
            key: 'pending',
            label: `Pending (${requests.filter(r => r.status === 'pending').length})`,
            children: (
              <MaintenanceList
                requests={getFilteredRequests('pending')}
                loading={loading}
                selectedRequests={selectedRequests}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
                onSelectChange={(ids) => {}}
                onStatusChange={handleStatusChange}
                onAssign={handleAssignStaff}
              />
            )
          },
          {
            key: 'in-progress',
            label: `In Progress (${requests.filter(r => r.status === 'in-progress').length})`,
            children: (
              <MaintenanceList
                requests={getFilteredRequests('in-progress')}
                loading={loading}
                selectedRequests={selectedRequests}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
                onSelectChange={(ids) => {}}
                onStatusChange={handleStatusChange}
                onAssign={handleAssignStaff}
              />
            )
          },
          {
            key: 'completed',
            label: `Completed (${requests.filter(r => r.status === 'completed').length})`,
            children: (
              <MaintenanceList
                requests={getFilteredRequests('completed')}
                loading={loading}
                selectedRequests={selectedRequests}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
                onSelectChange={(ids) => {}}
                onStatusChange={handleStatusChange}
                onAssign={handleAssignStaff}
              />
            )
          },
          {
            key: 'urgent',
            label: `Urgent (${requests.filter(r => r.priority === 'urgent').length})`,
            children: (
              <MaintenanceList
                requests={requests.filter(r => r.priority === 'urgent')}
                loading={loading}
                selectedRequests={selectedRequests}
                onEdit={handleEditRequest}
                onDelete={handleDeleteRequest}
                onSelectChange={(ids) => {}}
                onStatusChange={handleStatusChange}
                onAssign={handleAssignStaff}
              />
            )
          }
        ]}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          Error: {error}
        </div>
      )}

      <MaintenanceForm
        visible={showForm}
        request={selectedRequest}
        onCancel={() => {
          setShowForm(false);
          setSelectedRequest(null);
        }}
        onSubmit={selectedRequest ? handleUpdateRequest : handleCreateRequest}
        loading={loading}
        rooms={rooms}
        staff={staffs}
      />
    </div>
  );
};