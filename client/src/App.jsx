// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import AccountCreate from './pages/AccountCreate'; // Import the AccountCreate component
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
    colorPrimary: '#1890ff',
    borderRadius: 6,
    
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
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightSM: 36,
      controlHeightLG: 44,
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
  },
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add viewport meta tag
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=yes';
      document.head.appendChild(meta);
    }
    
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
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>EFS Platform</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider theme={responsiveTheme}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              user ? <Navigate to="/dashboard" replace /> : 
              <Login onLogin={handleLogin} />
            }
          />
          
          {/* Separate route for AccountCreate */}
          <Route
            path="/register"
            element={
              user ? <Navigate to="/dashboard" replace /> : 
              <AccountCreate />
            }
          />
          
          {/* Also keep the old route for backward compatibility */}
          <Route
            path="/create-account"
            element={
              user ? <Navigate to="/dashboard" replace /> : 
              <AccountCreate />
            }
          />
          
          {/* Protected routes with MainLayout */}
          <Route
            path="/"
            element={
              user ? <MainLayout user={user} onLogout={handleLogout} /> : 
              <Navigate to="/login" replace />
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="calendar" element={<Calendar user={user} />} />
            <Route path="group-formation" element={<GroupFormation user={user} />} />
            <Route path="questionnaire" element={<Questionnaire user={user} />} />
            <Route path="materials" element={<Materials user={user} />} />
            <Route path="profile" element={<Profile user={user} />} />
            <Route 
              path="admin" 
              element={
                user?.role === 'admin' ? 
                <AdminPanel user={user} /> : 
                <Navigate to="/dashboard" replace />
              } 
            />
          </Route>
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
