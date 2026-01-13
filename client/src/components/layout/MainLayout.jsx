// components/layout/MainLayout.jsx
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  FormOutlined,
  FileOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import './MainLayout.css';

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

const MainLayout = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard')
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: 'Calendar',
      onClick: () => navigate('/calendar')
    },
    {
      key: '/group-formation',
      icon: <TeamOutlined />,
      label: 'Group Formation',
      onClick: () => navigate('/group-formation')
    },
    {
      key: '/questionnaire',
      icon: <FormOutlined />,
      label: 'Questionnaire',
      onClick: () => navigate('/questionnaire')
    },
    {
      key: '/materials',
      icon: <FileOutlined />,
      label: 'Materials',
      onClick: () => navigate('/materials')
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile')
    }
  ];

  // Add admin menu if user is admin
  if (user?.role === 'admin') {
    menuItems.push({
      key: '/admin',
      icon: <SettingOutlined />,
      label: 'Admin Panel',
      onClick: () => navigate('/admin')
    });
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => navigate('/profile')
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: onLogout
      }
    ]
  };

  return (
    <AntLayout className="main-layout" style={{ minHeight: '100vh' }}>
      <Header className="layout-header">
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space align="center">
            <Title level={3} style={{ color: 'white', margin: 0 }}>
              EFS Platform
            </Title>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              Educational Facilitation System
            </span>
          </Space>
          
          <Space align="center">
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space className="user-info">
                <Avatar 
                  src={user?.photoUrl || `https://ui-avatars.com/api/?name=${user?.name || user?.email}&background=7266ef&color=fff`}
                  icon={<UserOutlined />}
                />
                <div className="user-details">
                  <div className="user-name">{user?.name || user?.email}</div>
                  <div className="user-role">{user?.role || 'Student'}</div>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Space>
      </Header>
      
      <AntLayout>
        <Sider width={250} className="layout-sider" collapsible={false}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Sider>
        
        <Content className="layout-content">
          <div className="content-container">
            <Outlet /> {/* This renders the nested route components */}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default MainLayout;
