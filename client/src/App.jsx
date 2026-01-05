import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import Layout from './components/layout/MainLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Calendar from './pages/Calendar.jsx';
import GroupFormation from './pages/GroupFormation.jsx';
import Questionnaire from './pages/Questionnaire.jsx';
import Materials from './pages/Materials.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import Profile from './pages/Profile.jsx';
import AccountCreate from './pages/AccountCreate.jsx';
import CourseViewer from './pages/CourseViewer.jsx';
import CourseEditor from './pages/CourseEditor.jsx';
import { authAPI } from './utils/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth(token);
    }
  }, []);

  const checkAuth = async (token) => {
    try {
      const response = await authAPI.check();
      if (response.ok && response.data) {
        setIsAuthenticated(true);
        setUser(response.data);
      } else {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', userData.token);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <Router>
        <Routes>
          <Route path="/login" element={
            !isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />
          } />
          <Route path="/register" element={<AccountCreate />} />
          
          <Route path="/" element={
            isAuthenticated ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }>
            <Route index element={<Dashboard user={user} />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="group-formation" element={<GroupFormation />} />
            <Route path="questionnaire" element={<Questionnaire />} />
            <Route path="materials" element={<Materials user={user} />} />
            <Route path="admin" element={<AdminPanel user={user} />} />
            <Route path="profile" element={<Profile user={user} />} />
            <Route path="courses/:code" element={<CourseViewer />} />
            <Route path="courses/edit/:code" element={<CourseEditor user={user} />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
