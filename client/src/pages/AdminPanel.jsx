import React, { useState, useEffect } from 'react';
import { Tabs, Table, Card, Button, Modal, message, Space, Typography, Statistic, Row, Col, Tag, Image } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, BookOutlined, FileOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminAPI } from '../utils/api';
import './AdminPanel.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const AdminPanel = ({ user }) => {
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState('');

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

  const handleRejectAccount = async (sid) => {
    Modal.confirm({
      title: 'Reject Account',
      content: 'Please enter reason for rejection:',
      onOk: async (reason) => {
        try {
          await adminAPI.rejectAccount(sid, reason);
          message.success('Account rejected');
          loadData();
        } catch (error) {
          message.error(error.error || 'Failed to reject account');
        }
      },
    });
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
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Student Card',
      key: 'photo',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedPhoto(record.photoFileId);
            setPhotoModalVisible(true);
          }}
        >
          View Photo
        </Button>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleApproveAccount(record.sid)}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={() => handleRejectAccount(record.sid)}
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
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={() => handleApproveCourse(record._id)}
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
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
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
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteUser(record.sid)}
          disabled={record.sid === user.sid}
        >
          Delete
        </Button>
      ),
    },
  ];

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
              />
            </TabPane>
            
            <TabPane tab="Pending Courses" key="courses">
              <Table
                columns={courseColumns}
                dataSource={pendingCourses}
                loading={loading}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
              />
            </TabPane>
            
            <TabPane tab="All Users" key="users">
              <Table
                columns={userColumns}
                dataSource={users}
                loading={loading}
                rowKey="sid"
                pagination={{ pageSize: 10 }}
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
        footer={null}
        width={800}
      >
        {selectedPhoto && (
          <Image
            src={`/api/upload/profile-photo/${selectedPhoto}`}
            alt="Student Card"
            style={{ width: '100%' }}
          />
        )}
      </Modal>
    </div>
  );
};

export default AdminPanel;
