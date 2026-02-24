// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import GroupFormation from './pages/GroupFormation';
import Questionnaire from './pages/Questionnaire';
import Materials from './pages/Materials';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import { authAPI } from './utils/api';
import './responsive.css';

// Configure Ant Design for responsive design
const responsiveTheme = {
  token: {
    // Base font sizes
    fontSize: 14,
    fontSizeSM: 12,
    fontSizeLG: 16,
    fontSizeXL: 18,
    
    // Touch targets
    controlHeight: 40,
    controlHeightSM: 36,
    controlHeightLG: 44,
    
    // Padding
    padding: 16,
    paddingSM: 12,
    paddingLG: 20,
    paddingXL: 24,
    
    // Margin
    margin: 16,
    marginSM: 12,
    marginLG: 20,
    marginXL: 24,
    
    // Border radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    
    // Screen breakpoints
    screenXS: 480,
    screenSM: 576,
    screenMD: 768,
    screenLG: 992,
    screenXL: 1200,
    screenXXL: 1600,
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightSM: 36,
      controlHeightLG: 44,
      paddingContentHorizontal: 16,
      paddingContentHorizontalSM: 12,
      paddingContentHorizontalLG: 20,
    },
    Input: {
      controlHeight: 40,
      controlHeightSM: 36,
      controlHeightLG: 44,
    },
    Card: {
      padding: 16,
      paddingSM: 12,
      paddingLG: 20,
    },
    Table: {
      cellPaddingBlock: 12,
      cellPaddingBlockSM: 8,
      cellPaddingInline: 16,
      cellPaddingInlineSM: 12,
    },
    Modal: {
      padding: 16,
      paddingSM: 12,
      paddingLG: 20,
    },
  },
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Add viewport meta tag
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes, viewport-fit=cover';
      document.head.appendChild(meta);
    }
    
    // Add touch-action meta for better touch handling
    if (!document.querySelector('meta[name="touch-action"]')) {
      const meta = document.createElement('meta');
      meta.name = 'touch-action';
      meta.content = 'manipulation';
      document.head.appendChild(meta);
    }
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.getMe();
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.token) {
      localStorage.setItem('token', userData.token);
    }
    message.success('Login successful!');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    message.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>EFS Platform</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider theme={responsiveTheme}>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          
          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          
          <Route
            path="/"
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <Navigate to="/dashboard" replace />
                </MainLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/dashboard"
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <Dashboard user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/calendar"
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <Calendar user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/group-formation"
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <GroupFormation user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/questionnaire"
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <Questionnaire user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/materials"
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <Materials user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/profile"
            element={
              user ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <Profile user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          
          <Route
            path="/admin"
            element={
              user && user.role === 'admin' ? (
                <MainLayout user={user} onLogout={handleLogout}>
                  <AdminPanel user={user} />
                </MainLayout>
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
