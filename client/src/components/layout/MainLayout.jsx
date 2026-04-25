// components/layout/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Space, Typography, Drawer, Badge } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  TeamOutlined,
  FormOutlined,
  FileOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  BellOutlined,
} from '@ant-design/icons';
import './MainLayout.css';
import '../../responsive.css';
import ChatPanel from '../Chat/ChatPanel';

const { Header, Sider, Content } = AntLayout;
const { Title, Text } = Typography;

const MainLayout = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check screen size on mount and resize
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);

      if (width <= 768) {
        setCollapsed(true);
      } else if (width <= 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch unread count periodically
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { chatAPI } = await import('../../utils/api');
        const response = await chatAPI.getUnreadCount();
        setUnreadCount(response.data?.unread || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => {
        navigate('/dashboard');
        setMobileMenuOpen(false);
      }
    },
    {
      key: '/calendar',
      icon: <CalendarOutlined />,
      label: isMobile ? 'Timetable' : 'Timetable Planner',
      onClick: () => {
        navigate('/calendar');
        setMobileMenuOpen(false);
      }
    },
    {
      key: '/group-formation',
      icon: <TeamOutlined />,
      label: isMobile ? 'Groups' : 'Group Formation',
      onClick: () => {
        navigate('/group-formation');
        setMobileMenuOpen(false);
      }
    },
    {
      key: '/questionnaire',
      icon: <FormOutlined />,
      label: isMobile ? 'Surveys' : 'Questionnaires',
      onClick: () => {
        navigate('/questionnaire');
        setMobileMenuOpen(false);
      }
    },
    {
      key: '/materials',
      icon: <FileOutlined />,
      label: 'Materials',
      onClick: () => {
        navigate('/materials');
        setMobileMenuOpen(false);
      }
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => {
        navigate('/profile');
        setMobileMenuOpen(false);
      }
    }
  ];

  if (user?.role === 'admin') {
    menuItems.push({
      key: '/admin',
      icon: <SettingOutlined />,
      label: isMobile ? 'Admin' : 'Admin Panel',
      onClick: () => {
        navigate('/admin');
        setMobileMenuOpen(false);
      }
    });
  }

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => {
          navigate('/profile');
          setMobileMenuOpen(false);
        }
      },
      {
        type: 'divider'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: () => {
          onLogout();
          setMobileMenuOpen(false);
        }
      }
    ]
  };

  // Mobile header
  const mobileHeader = (
    <Header className="layout-header" style={{ padding: '0 12px', height: '56px', lineHeight: '56px' }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%'
    }}>
    <Space size="small">
    <Button
    type="text"
    icon={<MenuOutlined style={{ color: 'white', fontSize: '20px' }} />}
    onClick={() => setMobileMenuOpen(true)}
    className="touch-target"
    style={{
      background: 'transparent',
      padding: '8px',
      height: '44px',
      width: '44px'
    }}
    />
    <Title level={4} style={{ color: 'white', margin: 0, fontSize: '18px' }}>
    EFS
    </Title>
    </Space>

    <Space>
    <Badge count={unreadCount} dot={unreadCount > 0}>
    <Button
    type="text"
    icon={<MessageOutlined style={{ color: 'white', fontSize: '18px' }} />}
    onClick={() => setChatVisible(true)}
    className="touch-target"
    style={{ padding: '8px', height: '44px', width: '44px' }}
    />
    </Badge>
    <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
    <div className="user-info touch-target" style={{ padding: '4px 8px', cursor: 'pointer' }}>
    <Avatar
    size={36}
    src={user?.photoUrl}
    icon={<UserOutlined />}
    style={{ backgroundColor: '#7266ef' }}
    />
    </div>
    </Dropdown>
    </Space>
    </div>
    </Header>
  );

  // Desktop header
  const desktopHeader = (
    <Header className="layout-header">
    <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
    <Space align="center" size={isTablet ? 'small' : 'middle'}>
    <Title level={isTablet ? 4 : 3} style={{ color: 'white', margin: 0 }}>
    {isTablet ? 'EFS' : 'EFS Platform'}
    </Title>
    {!isTablet && (
      <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }} className="hide-mobile">
      Educational Facilitation System
      </span>
    )}
    </Space>

    <Space>
    <Badge count={unreadCount} dot={unreadCount > 0}>
    <Button
    type="text"
    icon={<MessageOutlined style={{ color: 'white', fontSize: '18px' }} />}
    onClick={() => setChatVisible(true)}
    style={{ color: 'white' }}
    >
    {!isTablet && 'Messages'}
    </Button>
    </Badge>
    <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
    <Space className="user-info touch-target" style={{ cursor: 'pointer' }}>
    <Avatar
    src={user?.photoUrl}
    icon={<UserOutlined />}
    style={{ backgroundColor: '#7266ef' }}
    />
    {!isTablet && (
      <div className="user-details">
      <div className="user-name">{user?.name || user?.email?.split('@')[0] || 'User'}</div>
      <div className="user-role">{user?.role || 'Student'}</div>
      </div>
    )}
    </Space>
    </Dropdown>
    </Space>
    </Space>
    </Header>
  );

  // Mobile drawer menu
  const mobileDrawer = (
    <Drawer
    title={
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <Avatar
      size={40}
      src={user?.photoUrl}
      icon={<UserOutlined />}
      style={{ backgroundColor: '#7266ef' }}
      />
      <div>
      <div style={{ fontWeight: 600 }}>{user?.name || user?.email?.split('@')[0] || 'User'}</div>
      <div style={{ fontSize: '12px', color: '#666' }}>{user?.role || 'Student'}</div>
      </div>
      </div>
    }
    placement="left"
    onClose={() => setMobileMenuOpen(false)}
    open={mobileMenuOpen}
    bodyStyle={{ padding: 0 }}
    width={280}
    >
    <Menu
    mode="inline"
    selectedKeys={[location.pathname]}
    items={menuItems}
    style={{ border: 'none' }}
    />
    </Drawer>
  );

  return (
    <AntLayout className="main-layout" style={{ minHeight: '100vh' }}>
    {isMobile ? mobileHeader : desktopHeader}

    <AntLayout>
    {!isMobile && (
      <Sider
      width={isTablet ? 200 : 250}
      className="layout-sider"
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="lg"
      collapsedWidth={isTablet ? 60 : 80}
      style={{
        position: 'sticky',
        top: isMobile ? 56 : 64,
        height: `calc(100vh - ${isMobile ? 56 : 64}px)`,
                   overflow: 'auto'
      }}
      >
      <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      style={{ borderRight: 0, height: '100%' }}
      inlineCollapsed={collapsed}
      />
      </Sider>
    )}

    <Content
    className="layout-content"
    style={{
      margin: isMobile ? '12px' : isTablet ? '16px' : '24px',
      padding: 0,
      minHeight: `calc(100vh - ${isMobile ? 80 : 112}px)`
    }}
    >
    <div
    className="content-container"
    style={{
      padding: isMobile ? '12px' : isTablet ? '16px' : '24px',
      minHeight: '100%'
    }}
    >
    <Outlet />
    </div>
    </Content>
    </AntLayout>

    {isMobile && mobileDrawer}

    {/* Chat Panel */}
    <ChatPanel
    visible={chatVisible}
    onClose={() => setChatVisible(false)}
    user={user}
    />
    </AntLayout>
  );
};

export default MainLayout;
