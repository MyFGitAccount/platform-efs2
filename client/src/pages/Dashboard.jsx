import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Avatar, Button, Typography, Space, Progress } from 'antd';
import {
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  FileOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';
import './Dashboard.css';

const { Title, Text } = Typography;

const Dashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getSummary();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Welcome Section */}
        <Card>
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={3}>Welcome back, {user?.sid}!</Title>
              <Text type="secondary">
                {user?.role === 'admin' ? 'Administrator' : 'Student'} • {user?.major || 'No major specified'}
              </Text>
            </Col>
            <Col>
              <Statistic
                title="Credits"
                value={dashboardData?.user.credits || 0}
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
                value={dashboardData?.stats.courses || 0}
                prefix={<BookOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="My Group Requests"
                value={dashboardData?.stats.myGroupRequests || 0}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="My Questionnaires"
                value={dashboardData?.stats.myQuestionnaires || 0}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="My Materials"
                value={dashboardData?.stats.myMaterials || 0}
                prefix={<FileOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <Row gutter={[16, 16]}>
            {dashboardData?.quickActions.map((action) => (
              action.available && (
                <Col xs={24} sm={12} md={8} lg={6} key={action.id}>
                  <Link to={action.link}>
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
                          icon={React.createElement(action.icon)}
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
                  </Link>
                </Col>
              )
            ))}
          </Row>
        </Card>

        {/* Admin Section */}
        {user?.role === 'admin' && dashboardData?.stats.pendingApprovals > 0 && (
          <Card 
            title="Admin Notifications" 
            type="inner"
            style={{ borderColor: '#f5222d' }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <Avatar style={{ backgroundColor: '#f5222d' }}>
                    {dashboardData.stats.pendingApprovals}
                  </Avatar>
                  <div>
                    <Text strong>Pending Account Approvals</Text>
                    <br />
                    <Text type="secondary">
                      {dashboardData.stats.pendingApprovals} account requests need review
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Link to="/admin">
                  <Button type="primary" danger>
                    Review Now
                  </Button>
                </Link>
              </Col>
            </Row>
          </Card>
        )}

        {/* Recent Activities */}
        <Card title="Recent Activities">
          <List
            itemLayout="horizontal"
            dataSource={[
              { title: 'Timetable Planner', description: 'Last accessed 2 hours ago', icon: <ClockCircleOutlined /> },
              { title: 'Group Formation', description: '3 new requests available', icon: <TeamOutlined /> },
              { title: 'Questionnaire Exchange', description: '5 new questionnaires to fill', icon: <FileTextOutlined /> },
            ]}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={item.icon} />}
                  title={<Link to={`/${item.title.toLowerCase().replace(' ', '-')}`}>{item.title}</Link>}
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
