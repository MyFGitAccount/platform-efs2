import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  Table, 
  Card, 
  Button, 
  Modal, 
  message, 
  Space, 
  Typography, 
  Statistic, 
  Row, 
  Col, 
  Tag,
  Input,
  Image 
} from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, BookOutlined, FileOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { adminAPI } from '../utils/api';
import './AdminPanel.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const AdminPanel = ({ user }) => {
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedSid, setSelectedSid] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [accountsRes, coursesRes, usersRes, statsRes] = await Promise.all([
        adminAPI.getPendingAccounts(),
        adminAPI.getPendingCourses(),
        adminAPI.getUsers(),
        adminAPI.getStats()
      ]);
      
      setPendingAccounts(accountsRes.data);
      setPendingCourses(coursesRes.data);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (error) {
      message.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAccount = async (sid) => {
    try {
      await adminAPI.approveAccount(sid);
      message.success('Account approved successfully');
      loadData();
    } catch (error) {
      message.error(error.error || 'Failed to approve account');
    }
  };

  const showRejectModal = (sid) => {
    setSelectedSid(sid);
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.error('Please enter a reason for rejection');
      return;
    }

    try {
      await adminAPI.rejectAccount(selectedSid, rejectReason);
      message.success('Account rejected');
      setRejectModalVisible(false);
      setRejectReason('');
      setSelectedSid('');
      loadData();
    } catch (error) {
      message.error(error.error || 'Failed to reject account');
    }
  };

  const showPhotoModal = (account) => {
    setSelectedAccount(account);
    setPhotoModalVisible(true);
  };

  const handleApproveCourse = async (id) => {
    try {
      await adminAPI.approveCourse(id);
      message.success('Course approved successfully');
      loadData();
    } catch (error) {
      message.error(error.error || 'Failed to approve course');
    }
  };

  const handleDeleteUser = async (sid) => {
    if (sid === user.sid) {
      message.error('Cannot delete your own account');
      return;
    }

    Modal.confirm({
      title: 'Delete User',
      content: 'Are you sure you want to delete this user?',
      okText: 'Delete',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          await adminAPI.deleteUser(sid);
          message.success('User deleted successfully');
          loadData();
        } catch (error) {
          message.error(error.error || 'Failed to delete user');
        }
      },
    });
  };

  const accountColumns = [
    {
      title: 'Student ID',
      dataIndex: 'sid',
      key: 'sid',
      width: 120,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Student Card',
      key: 'photo',
      width: 150,
      render: (_, record) => (
        <Space>
          <Text strong>Student Card</Text>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showPhotoModal(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApproveAccount(record.sid)}
            size="small"
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => showRejectModal(record.sid)}
            size="small"
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const courseColumns = [
    {
      title: 'Course Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      width: 120,
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => handleApproveCourse(record._id)}
          size="small"
        >
          Approve
        </Button>
      ),
    },
  ];

  const userColumns = [
    {
      title: 'Student ID',
      dataIndex: 'sid',
      key: 'sid',
      width: 120,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Credits',
      dataIndex: 'credits',
      key: 'credits',
      width: 80,
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteUser(record.sid)}
          disabled={record.sid === user.sid}
          size="small"
        >
          Delete
        </Button>
      ),
    },
  ];

  const getPhotoUrl = (fileId) => {
    if (!fileId) return '';
    return `${import.meta.env.VITE_API_URL || '/api'}/admin/student-card/${fileId}`;
  };

  return (
    <div className="admin-panel-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Stats Overview */}
        {stats && (
          <Card title="Platform Statistics">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Users"
                  value={stats.totalUsers}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Courses"
                  value={stats.totalCourses}
                  prefix={<BookOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Materials"
                  value={stats.totalMaterials}
                  prefix={<FileOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Pending Accounts"
                  value={stats.pendingAccounts}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Tabs for different admin functions */}
        <Card>
          <Tabs defaultActiveKey="accounts">
            <TabPane tab="Pending Accounts" key="accounts">
              <Table
                columns={accountColumns}
                dataSource={pendingAccounts}
                loading={loading}
                rowKey="sid"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </TabPane>
            
            <TabPane tab="Pending Courses" key="courses">
              <Table
                columns={courseColumns}
                dataSource={pendingCourses}
                loading={loading}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </TabPane>
            
            <TabPane tab="All Users" key="users">
              <Table
                columns={userColumns}
                dataSource={users}
                loading={loading}
                rowKey="sid"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            </TabPane>
          </Tabs>
        </Card>
      </Space>

      {/* Student Card Photo Modal */}
      <Modal
        title="Student Card Verification"
        open={photoModalVisible}
        onCancel={() => setPhotoModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setPhotoModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedAccount && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Student ID: </Text>
              <Text>{selectedAccount.sid}</Text>
              <br />
              <Text strong>Email: </Text>
              <Text>{selectedAccount.email}</Text>
              <br />
              <Text strong>Submitted: </Text>
              <Text>{new Date(selectedAccount.createdAt).toLocaleString()}</Text>
            </div>
            
            {selectedAccount.photoFileId ? (
              <Image
                src={getPhotoUrl(selectedAccount.photoFileId)}
                alt={`Student Card - ${selectedAccount.sid}`}
                style={{ 
                  width: '100%',
                  maxHeight: '500px',
                  objectFit: 'contain',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px'
                }}
                placeholder={
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <Text type="secondary">Loading student card...</Text>
                  </div>
                }
                fallback={
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <Text type="warning">Failed to load image</Text>
                    <br />
                    <Text type="secondary">File ID: {selectedAccount.photoFileId}</Text>
                  </div>
                }
              />
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                backgroundColor: '#f9f9f9',
                border: '1px dashed #d9d9d9',
                borderRadius: '8px'
              }}>
                <Text type="secondary">No student card photo available</Text>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject Account Modal */}
      <Modal
        title="Reject Account"
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
          setSelectedSid('');
        }}
        onOk={handleReject}
        okText="Reject"
        cancelText="Cancel"
        okType="danger"
      >
        <p>Please enter reason for rejecting account <strong>{selectedSid}</strong>:</p>
        <TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter reason for rejection..."
          rows={4}
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
};

export default AdminPanel;
