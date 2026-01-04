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

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isRegistering) {
        await authAPI.register(values);
        message.success('Registration submitted! Please wait for admin approval.');
        setIsRegistering(false);
      } else {
        const response = await authAPI.login(values.email, values.password);
        onLogin(response.data);
        message.success('Login successful!');
      }
    } catch (error) {
      message.error(error.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <Title level={2}>EFS Platform</Title>
          <Text type="secondary">Educational Facilitation System</Text>
        </div>
        
        <Form
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
                name="photoData"
                rules={[
                  { required: true, message: 'Please upload your student card photo!' }
                ]}
              >
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        // Store base64 data in form
                        e.target.form.setFieldsValue({
                          photoData: reader.result,
                          fileName: file.name
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
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
            onClick={() => setIsRegistering(!isRegistering)}
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
