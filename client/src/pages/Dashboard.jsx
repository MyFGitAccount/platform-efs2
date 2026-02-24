// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Typography, Space, Spin, Alert, Row, Col, Statistic, List, Tag } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  FileOutlined,
  CalendarOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';
import './Dashboard.css';
import '../responsive.css';

const { Title, Text } = Typography;

const Dashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getSummary();
      setDashboardData(response.data || response);
    } catch (error) {
      setError(error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      id: 'timetable',
      title: 'Timetable',
      description: 'Plan schedule',
      icon: <CalendarOutlined />,
      link: '/calendar',
      color: '#1890ff',
      available: true
    },
    {
      id: 'group',
      title: 'Group Formation',
      description: 'Find partners',
      icon: <TeamOutlined />,
      link: '/group-formation',
      color: '#52c41a',
      available: true
    },
    {
      id: 'questionnaire',
      title: 'Questionnaires',
      description: 'Share surveys',
      icon: <FileTextOutlined />,
      link: '/questionnaire',
      color: '#722ed1',
      available: true
    },
    {
      id: 'materials',
      title: 'Materials',
      description: 'Resources',
      icon: <FileOutlined />,
      link: '/materials',
      color: '#fa8c16',
      available: true
    },
    {
      id: 'admin',
      title: 'Admin Panel',
      description: 'Settings',
      icon: <SettingOutlined />,
      link: '/admin',
      color: '#f5222d',
      available: user?.role === 'admin'
    }
  ];

  const recentActivities = [
    { title: 'Timetable Planner', time: 'Just now', icon: <CalendarOutlined />, link: '/calendar' },
    { title: 'Group Formation', time: '2 hours ago', icon: <TeamOutlined />, link: '/group-formation' },
    { title: 'Questionnaire Exchange', time: 'Yesterday', icon: <FileTextOutlined />, link: '/questionnaire' },
  ];

  if (loading) {
    return (
      <div className="loading-responsive">
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="responsive-container">
        <Alert
          type="error"
          message="Error Loading Dashboard"
          description={error}
          showIcon
          action={
            <Button size="small" type="primary" onClick={loadDashboard} className="touch-target">
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const data = dashboardData || {
    user: {
      sid: user?.sid || 'Guest',
      credits: user?.credits || 0,
      major: user?.major || 'Student',
      email: user?.email || ''
    },
    stats: {
      courses: 0,
      myGroupRequests: 0,
      myQuestionnaires: 0,
      myMaterials: 0,
      pendingApprovals: 0
    }
  };

  return (
    <div className="responsive-container">
      <Space direction="vertical" size={isMobile ? 'middle' : 'large'} style={{ width: '100%' }}>
        {/* Welcome Card */}
        <Card className="welcome-card" bodyStyle={{ padding: isMobile ? '16px' : '20px' }}>
          <div className="responsive-flex">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar
                size={isMobile ? 48 : 64}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
              <div>
                <Title level={isMobile ? 4 : 3} style={{ margin: 0, marginBottom: '4px' }}>
                  Welcome, {data.user.sid}!
                </Title>
                <Text type="secondary" className="text-responsive">
                  {user?.role === 'admin' ? 'Administrator' : 'Student'} • {data.user.major}
                </Text>
              </div>
            </div>
            
            <Card size="small" style={{ background: '#f6ffed', minWidth: isMobile ? '100%' : '200px' }}>
              <Statistic
                title={<Text style={{ fontSize: '14px' }}>Available Credits</Text>}
                value={data.user.credits}
                prefix={<CreditCardOutlined />}
                valueStyle={{ color: '#3f8600', fontSize: isMobile ? '20px' : '24px' }}
              />
            </Card>
          </div>
        </Card>

        {/* Stats Grid */}
        <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
          <Col xs={12} sm={6}>
            <Card size="small" bodyStyle={{ padding: isMobile ? '12px' : '16px' }}>
              <Statistic
                title={<Text className="text-responsive-sm">Courses</Text>}
                value={data.stats.courses}
                prefix={<BookOutlined />}
                valueStyle={{ fontSize: isMobile ? '18px' : '24px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bodyStyle={{ padding: isMobile ? '12px' : '16px' }}>
              <Statistic
                title={<Text className="text-responsive-sm">Groups</Text>}
                value={data.stats.myGroupRequests}
                prefix={<TeamOutlined />}
                valueStyle={{ fontSize: isMobile ? '18px' : '24px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bodyStyle={{ padding: isMobile ? '12px' : '16px' }}>
              <Statistic
                title={<Text className="text-responsive-sm">Surveys</Text>}
                value={data.stats.myQuestionnaires}
                prefix={<FileTextOutlined />}
                valueStyle={{ fontSize: isMobile ? '18px' : '24px' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" bodyStyle={{ padding: isMobile ? '12px' : '16px' }}>
              <Statistic
                title={<Text className="text-responsive-sm">Materials</Text>}
                value={data.stats.myMaterials}
                prefix={<FileOutlined />}
                valueStyle={{ fontSize: isMobile ? '18px' : '24px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card 
          title={<Title level={4} style={{ margin: 0 }}>Quick Actions</Title>}
          bodyStyle={{ padding: isMobile ? '12px' : '16px' }}
        >
          <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]}>
            {quickActions.map((action) => (
              action.available && (
                <Col xs={12} sm={8} md={6} lg={4} key={action.id}>
                  <div
                    onClick={() => navigate(action.link)}
                    className="touch-target-block"
                    style={{ 
                      cursor: 'pointer',
                      background: '#f9f9f9',
                      borderRadius: '8px',
                      padding: isMobile ? '12px' : '16px',
                      textAlign: 'center',
                      border: `1px solid #f0f0f0`,
                      transition: 'all 0.3s',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Avatar
                      size={isMobile ? 40 : 48}
                      icon={action.icon}
                      style={{ backgroundColor: action.color }}
                    />
                    <div style={{ fontWeight: 600, fontSize: isMobile ? '13px' : '14px' }}>
                      {action.title}
                    </div>
                    {!isMobile && (
                      <div style={{ fontSize: '12px', color: '#666' }}>{action.description}</div>
                    )}
                  </div>
                </Col>
              )
            ))}
          </Row>
        </Card>

        {/* Admin Notification */}
        {user?.role === 'admin' && data.stats.pendingApprovals > 0 && (
          <Card 
            style={{ borderLeft: '4px solid #f5222d' }}
            bodyStyle={{ padding: isMobile ? '12px' : '16px' }}
          >
            <Row gutter={[isMobile ? 8 : 16, isMobile ? 8 : 16]} align="middle">
              <Col xs={24} sm={18}>
                <Space size={isMobile ? 'middle' : 'large'}>
                  <Avatar style={{ backgroundColor: '#f5222d' }}>
                    {data.stats.pendingApprovals}
                  </Avatar>
                  <div>
                    <Text strong className="text-responsive">Pending Account Approvals</Text>
                    <br />
                    <Text type="secondary" className="text-responsive-sm">
                      {data.stats.pendingApprovals} request{data.stats.pendingApprovals !== 1 ? 's' : ''} need review
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col xs={24} sm={6}>
                <Button 
                  type="primary" 
                  danger
                  onClick={() => navigate('/admin')}
                  block
                  className="touch-target"
                  size={isMobile ? 'middle' : 'large'}
                >
                  Review Now
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        {/* Recent Activities */}
        <Card 
          title={<Title level={4} style={{ margin: 0 }}>Recent Activities</Title>}
          bodyStyle={{ padding: isMobile ? '12px' : '16px' }}
        >
          <List
            itemLayout="horizontal"
            dataSource={recentActivities}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    type="link" 
                    onClick={() => navigate(item.link)}
                    size={isMobile ? 'small' : 'middle'}
                    className="touch-target"
                  >
                    {isMobile ? 'Go' : 'View'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={item.icon} 
                      style={{ backgroundColor: '#1890ff' }}
                      size={isMobile ? 40 : 48}
                    />
                  }
                  title={
                    <a onClick={() => navigate(item.link)} style={{ cursor: 'pointer' }}>
                      {item.title}
                    </a>
                  }
                  description={
                    <Space size="small">
                      <ClockCircleOutlined style={{ fontSize: '12px' }} />
                      <Text type="secondary" className="text-responsive-sm">{item.time}</Text>
                    </Space>
                  }
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
