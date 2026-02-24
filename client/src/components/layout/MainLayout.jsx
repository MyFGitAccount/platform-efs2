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
  BellOutlined,
} from '@ant-design/icons';
import './MainLayout.css';
import '../../responsive.css';

const { Header, Sider, Content } = AntLayout;
const { Title, Text } = Typography;

const MainLayout = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

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

  // Load notifications (mock data)
  useEffect(() => {
    if (user?.role === 'admin') {
      setNotifications([{ count: 3, type: 'pending' }]);
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
      },
      className: 'admin-menu-item'
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

  // Mobile header with menu button
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
          <div>
            <Title level={4} style={{ color: 'white', margin: 0, fontSize: '18px', lineHeight: '56px' }}>
              EFS
            </Title>
          </div>
        </Space>
        
        <Space size="small">
          {user?.role === 'admin' && notifications.length > 0 && (
            <Badge count={notifications[0].count} size="small">
              <BellOutlined style={{ color: 'white', fontSize: '20px' }} />
            </Badge>
          )}
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <div className="user-info touch-target" style={{ padding: '4px 8px' }}>
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

  // Tablet/Desktop header
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
        
        <Space align="center" size="middle">
          {user?.role === 'admin' && notifications.length > 0 && (
            <Badge count={notifications[0].count}>
              <BellOutlined style={{ color: 'white', fontSize: '18px', cursor: 'pointer' }} />
            </Badge>
          )}
          <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
            <Space className="user-info touch-target">
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
      closable={false}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ border: 'none' }}
        className="mobile-menu"
      />
    </Drawer>
  );

  return (
    <AntLayout className="main-layout" style={{ minHeight: '100vh' }}>
      {isMobile ? mobileHeader : desktopHeader}
      
      <AntLayout>
        {/* Sidebar - hidden on mobile, collapsible on tablet/desktop */}
        {!isMobile && (
          <Sider 
            width={isTablet ? 200 : 250}
            className="layout-sider"
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
            breakpoint="lg"
            collapsedWidth={isTablet ? 60 : 80}
            trigger={null}
            style={{
              position: 'sticky',
              top: isMobile ? 56 : 64,
              height: isMobile ? 'auto' : `calc(100vh - ${isMobile ? 56 : 64}px)`,
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
            minHeight: isMobile ? `calc(100vh - 80px)` : `calc(100vh - ${isMobile ? 80 : 112}px)`
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
    </AntLayout>
  );
};

export default MainLayout;
