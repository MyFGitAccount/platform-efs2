import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import './Login.css';

const { Title, Text } = Typography;

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isRegistering) {
        // Add photo data to registration values
        const registrationData = {
          ...values,
          photoData,
          fileName: fileName || 'student_card.jpg'
        };
        
        if (!photoData) {
          message.error('Please upload your student card photo');
          setLoading(false);
          return;
        }
        
        await authAPI.register(registrationData);
        message.success('Registration submitted! Please wait for admin approval.');
        setIsRegistering(false);
        form.resetFields();
        setPhotoData(null);
        setFileName('');
      } else {
        const response = await authAPI.login(values.email, values.password);
        if (response.ok && response.data) {
          onLogin(response.data);
          message.success('Login successful!');
        } else {
          message.error(response.error || 'Login failed');
        }
      }
    } catch (error) {
      const errorMessage = error?.error || error?.message || (isRegistering ? 'Registration failed' : 'Login failed');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      message.error('File size must be less than 5MB');
      e.target.value = ''; // Clear the file input
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      message.error('Only image files are allowed');
      e.target.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoData(reader.result);
      setFileName(file.name);
    };
    reader.onerror = () => {
      message.error('Failed to read file');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>EFS Platform</Title>
          <Text type="secondary">Educational Facilitation System</Text>
        </div>
        
        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
            />
          </Form.Item>

          {isRegistering && (
            <>
              <Form.Item
                name="sid"
                rules={[
                  { required: true, message: 'Please input your student ID!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Student ID"
                />
              </Form.Item>
              
              <Form.Item
                label="Student Card Photo"
                required
                help="Upload a clear photo of your student card"
              >
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {fileName && (
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                      Selected: {fileName}
                    </Text>
                  )}
                </div>
              </Form.Item>
            </>
          )}

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          {isRegistering && (
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm Password"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              {isRegistering ? 'Register' : 'Login'}
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">OR</Text>
        </Divider>

        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <Button
            type="link"
            onClick={() => {
              setIsRegistering(!isRegistering);
              form.resetFields();
              setPhotoData(null);
              setFileName('');
            }}
          >
            {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
          </Button>
          
          {!isRegistering && (
            <Link to="/register">
              <Button type="link">Create Account with Student Card</Button>
            </Link>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default Login;
