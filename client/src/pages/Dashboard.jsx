import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Avatar, Button, Typography, Space, Progress, Alert, Spin } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  FileOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';
import './Dashboard.css';

const { Title, Text } = Typography;

// Icon mapping
const iconComponents = {
  'calendar': CalendarOutlined,
  'team': TeamOutlined,
  'file-text': FileTextOutlined,
  'file': FileOutlined,
  'setting': SettingOutlined,
};

const Dashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading dashboard data...');
      
      const response = await dashboardAPI.getSummary();
      console.log('Dashboard API response:', response);
      
      // Handle different response formats
      if (response) {
        // If response has ok property
        if (response.ok === false) {
          throw new Error(response.error || 'Failed to load dashboard');
        }
        
        // If response has data property
        if (response.data) {
          setDashboardData(response.data);
        } else {
          // Response might be the data directly
          setDashboardData(response);
        }
      } else {
        throw new Error('Empty response from server');
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      
      // Extract error message
      let errorMessage = 'Failed to load dashboard data';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      
      // If 500 error, suggest checking backend
      if (error.response?.status === 500) {
        setError('Server error (500). Please check if the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName) => {
    return iconComponents[iconName] || UserOutlined;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading Dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <Alert
          type="error"
          message="Error Loading Dashboard"
          description={
            <div>
              <p>{error}</p>
              <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                Please check:
                <br />1. Backend server is running
                <br />2. API endpoints are correct
                <br />3. You have proper permissions
              </p>
            </div>
          }
          showIcon
          action={
            <Space>
              <Button size="small" type="primary" onClick={loadDashboard}>
                Retry
              </Button>
              <Button size="small" onClick={() => navigate('/')}>
                Go Home
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  // Fallback if no data
  const data = dashboardData || {
    user: {
      sid: user?.sid || 'Guest',
      email: user?.email || '',
      credits: user?.credits || 0,
      major: user?.major || 'No major specified',
      year_of_study: user?.year_of_study || 'Not specified'
    },
    stats: {
      courses: 0,
      myGroupRequests: 0,
      myQuestionnaires: 0,
      myMaterials: 0,
      pendingApprovals: 0
    },
    quickActions: []
  };

  const quickActions = [
    {
      id: 'timetable',
      title: 'Timetable Planner',
      description: 'Organize your weekly schedule',
      icon: 'calendar',
      link: '/timetable-planner',
      color: '#1890ff',
      available: true
    },
    {
      id: 'group',
      title: 'Group Formation',
      description: 'Find study partners',
      icon: 'team',
      link: '/group-formation',
      color: '#52c41a',
      available: true
    },
    {
      id: 'questionnaire',
      title: 'Questionnaire Exchange',
      description: 'Share and fill surveys',
      icon: 'file-text',
      link: '/questionnaire',
      color: '#722ed1',
      available: true
    },
    {
      id: 'materials',
      title: 'Learning Materials',
      description: 'Access course resources',
      icon: 'file',
      link: '/materials',
      color: '#fa8c16',
      available: true
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      description: 'Manage system settings',
      icon: 'setting',
      link: '/admin',
      color: '#f5222d',
      available: user?.role === 'admin'
    }
  ];

  const recentActivities = [
    { 
      title: 'Timetable Planner', 
      description: 'Plan your weekly schedule', 
      icon: <ClockCircleOutlined />,
      link: '/timetable-planner'
    },
    { 
      title: 'Group Formation', 
      description: 'Connect with fellow students', 
      icon: <TeamOutlined />,
      link: '/group-formation'
    },
    { 
      title: 'Questionnaire Exchange', 
      description: 'Share academic surveys', 
      icon: <FileTextOutlined />,
      link: '/questionnaire'
    },
  ];

  return (
    <div className="dashboard-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Welcome Section */}
        <Card>
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={3}>Welcome back, {data.user.sid}!</Title>
              <Text type="secondary">
                {user?.role === 'admin' ? 'Administrator' : 'Student'} • {data.user.major}
              </Text>
            </Col>
            <Col>
              <Statistic
                title="Credits"
                value={data.user.credits}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
          </Row>
        </Card>

        {/* Stats Section */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Courses"
                value={data.stats.courses}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="My Group Requests"
                value={data.stats.myGroupRequests}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="My Questionnaires"
                value={data.stats.myQuestionnaires}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="My Materials"
                value={data.stats.myMaterials}
                prefix={<FileOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <Row gutter={[16, 16]}>
            {quickActions.map((action) => (
              action.available && (
                <Col xs={24} sm={12} md={8} lg={6} key={action.id}>
                  <div 
                    onClick={() => navigate(action.link)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Card
                      hoverable
                      style={{ 
                        borderColor: action.color,
                        borderLeft: `4px solid ${action.color}` 
                      }}
                    >
                      <Space direction="vertical" align="center" style={{ width: '100%' }}>
                        <Avatar
                          size="large"
                          icon={React.createElement(getIconComponent(action.icon))}
                          style={{ backgroundColor: action.color }}
                        />
                        <Title level={5} style={{ margin: 0 }}>
                          {action.title}
                        </Title>
                        <Text type="secondary" style={{ textAlign: 'center' }}>
                          {action.description}
                        </Text>
                      </Space>
                    </Card>
                  </div>
                </Col>
              )
            ))}
          </Row>
        </Card>

        {/* Admin Section */}
        {user?.role === 'admin' && data.stats.pendingApprovals > 0 && (
          <Card 
            title="Admin Notifications" 
            type="inner"
            style={{ borderColor: '#f5222d' }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <Avatar style={{ backgroundColor: '#f5222d' }}>
                    {data.stats.pendingApprovals}
                  </Avatar>
                  <div>
                    <Text strong>Pending Account Approvals</Text>
                    <br />
                    <Text type="secondary">
                      {data.stats.pendingApprovals} account request{data.stats.pendingApprovals !== 1 ? 's' : ''} need review
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  danger
                  onClick={() => navigate('/admin')}
                >
                  Review Now
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {/* Recent Activities */}
        <Card title="Recent Activities">
          <List
            itemLayout="horizontal"
            dataSource={recentActivities}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button type="link" onClick={() => navigate(item.link)}>
                    Go
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={item.icon} />}
                  title={
                    <a onClick={() => navigate(item.link)} style={{ cursor: 'pointer' }}>
                      {item.title}
                    </a>
                  }
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Card>
      </Space>
    </div>
  );
};

export default Dashboard;
