import React, { useState } from 'react';
import { Form, Input, Button, Card, Upload, message, Typography, Space } from 'antd';
import { UploadOutlined, UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { authAPI } from '../utils/api';
import './AccountCreate.css';

const { Title, Text } = Typography;

const AccountCreate = () => {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    if (fileList.length === 0) {
      message.error('Please upload your student card photo');
      return;
    }

    setLoading(true);
    try {
      const file = fileList[0];
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          await authAPI.register({
            ...values,
            photoData: reader.result,
            fileName: file.name
          });
          
          message.success('Registration submitted! Please wait for admin approval.');
          form.resetFields();
          setFileList([]);
        } catch (error) {
          message.error(error.error || 'Registration failed');
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      message.error('Registration failed');
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return Upload.LIST_IGNORE;
      }
      
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
    },
    fileList,
    maxCount: 1,
  };

  return (
    <div className="account-create-container">
      <Card className="account-create-card">
        <div className="account-create-header">
          <Title level={2}>Create Account</Title>
          <Text type="secondary">
            Please provide your student information for verification
          </Text>
        </div>
        
        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="sid"
            label="Student ID"
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
            name="email"
            label="Email"
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
          
          <Form.Item
            name="password"
            label="Password"
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
          
          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
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
          
          <Form.Item
            label="Student Card Photo"
            required
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                Upload Student Card
              </Button>
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Please upload a clear photo of your student card for verification
            </Text>
          </Form.Item>
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Submit for Approval
            </Button>
          </Form.Item>
        </Form>
        
        <Space direction="vertical" align="center" style={{ width: '100%', marginTop: 24 }}>
          <Text type="secondary">
            After submission, please wait for admin approval. You will receive an email notification.
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default AccountCreate;
