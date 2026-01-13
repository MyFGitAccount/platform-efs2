import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Card, Avatar, message, Space, Typography, Row, Col, Tag, Select } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, BookOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { profileAPI } from '../utils/api';
import './Profile.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Profile = ({ user }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await profileAPI.getMe();
      setProfile(response.data);
      form.setFieldsValue(response.data);
    } catch (error) {
      message.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      await profileAPI.updateProfile(values);
      message.success('Profile updated successfully');
      setEditing(false);
      loadProfile();
    } catch (error) {
      message.error(error.error || 'Failed to update profile');
    }
  };

  if (loading || !profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="profile-container">
      <Row gutter={[24, 24]}>
        {/* Profile Summary */}
        <Col span={24}>
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Row align="middle" justify="space-between">
                <Col>
                  <Space size="large">
                    <Avatar
                      size={80}
                      src={profile.photoFileId && `/api/upload/profile-photo/user/${profile.sid}`}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <Title level={2} style={{ margin: 0 }}>
                        {profile.sid}
                      </Title>
                      <Text type="secondary">{profile.email}</Text>
                      <br />
                      <Tag color={profile.role === 'admin' ? 'red' : 'blue'}>
                        {profile.role.toUpperCase()}
                      </Tag>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Button
                    type={editing ? 'default' : 'primary'}
                    icon={editing ? <SaveOutlined /> : <EditOutlined />}
                    onClick={() => {
                      if (editing) {
                        form.submit();
                      } else {
                        setEditing(true);
                      }
                    }}
                  >
                    {editing ? 'Save Changes' : 'Edit Profile'}
                  </Button>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card size="small">
                    <Space direction="vertical">
                      <Text strong>Credits Available</Text>
                      <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                        {profile.credits || 0}
                      </Title>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small">
                    <Space direction="vertical">
                      <Text strong>Year of Study</Text>
                      <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                        Year {profile.year_of_study || 1}
                      </Title>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        {/* Profile Form */}
        <Col span={24}>
          <Card title="Profile Information">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleUpdateProfile}
              disabled={!editing}
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
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
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="Phone"
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="Phone number"
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="major"
                    label="Major"
                  >
                    <Input
                      prefix={<BookOutlined />}
                      placeholder="e.g., Computer Science"
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="year_of_study"
                    label="Year of Study"
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      style={{ width: '100%' }}
                      placeholder="e.g., 2"
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="gpa"
                    label="GPA"
                  >
                    <InputNumber
                      min={0}
                      max={4}
                      step={0.01}
                      style={{ width: '100%' }}
                      placeholder="e.g., 3.5"
                    />
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="dse_score"
                    label="DSE Score"
                  >
                    <Input placeholder="e.g., 25" />
                  </Form.Item>
                </Col>
                
                <Col span={24}>
                  <Form.Item
                    name="skills"
                    label="Skills"
                  >
                    <Select
                      mode="tags"
                      placeholder="Add your skills (press Enter to add)"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                
                <Col span={24}>
                  <Form.Item
                    name="about_me"
                    label="About Me"
                  >
                    <TextArea
                      rows={4}
                      placeholder="Tell others about yourself..."
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              {editing && (
                <Form.Item>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      Save Changes
                    </Button>
                    <Button onClick={() => {
                      setEditing(false);
                      form.setFieldsValue(profile);
                    }}>
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              )}
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
