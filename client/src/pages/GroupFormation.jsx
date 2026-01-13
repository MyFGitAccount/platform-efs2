import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, InputNumber, message, Space, Tag, Typography, Avatar, Tooltip } from 'antd';
import { PlusOutlined, MailOutlined, PhoneOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { groupAPI, profileAPI } from '../utils/api';
import './GroupFormation.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const GroupFormation = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [form] = Form.useForm();
  const [inviteForm] = Form.useForm();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await groupAPI.getRequests();
      setRequests(response.data);
    } catch (error) {
      message.error('Failed to load group requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (values) => {
    try {
      await groupAPI.createRequest(values);
      message.success('Group request created successfully');
      setModalVisible(false);
      form.resetFields();
      loadRequests();
    } catch (error) {
      message.error(error.error || 'Failed to create request');
    }
  };

  const handleSendInvitation = async (values) => {
    try {
      const response = await groupAPI.sendInvitation(selectedRequest._id, values.message);
      message.success('Invitation sent successfully!');
      setInviteModalVisible(false);
      inviteForm.resetFields();
      
      // Auto-delete the request after sending invitation (if option selected)
      const shouldDelete = window.confirm('Do you want to delete this request after sending invitation?');
      if (shouldDelete) {
        await handleDeleteRequest(selectedRequest._id);
      }
      
    } catch (error) {
      message.error(error.error || 'Failed to send invitation');
    }
  };

  const handleDeleteRequest = async (id) => {
    try {
      await groupAPI.deleteRequest(id);
      message.success('Request deleted successfully');
      loadRequests();
    } catch (error) {
      message.error(error.error || 'Failed to delete request');
    }
  };

  const columns = [
    {
      title: 'Student',
      dataIndex: 'sid',
      key: 'sid',
      width: 120,
      render: (sid) => (
        <Space>
          <Avatar>{sid.charAt(0)}</Avatar>
          <Text strong>{sid}</Text>
        </Space>
      ),
    },
    {
      title: 'Major',
      dataIndex: 'major',
      key: 'major',
      width: 150,
      render: (major) => <Tag color="blue">{major}</Tag>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (description, record) => {
        const hasDescription = description && description.trim().length > 0;
        const shortDescription = hasDescription 
          ? (description.length > 50 ? `${description.substring(0, 50)}...` : description)
          : 'No description';
        
        return (
          <Space>
            <Text>{shortDescription}</Text>
            {hasDescription && description.length > 50 && (
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedDescription(description);
                  setSelectedRequest(record);
                  setDescriptionModalVisible(true);
                }}
              />
            )}
          </Space>
        );
      },
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space>
            <MailOutlined />
            <Text>{record.email}</Text>
          </Space>
          {record.phone && (
            <Space>
              <PhoneOutlined />
              <Text>{record.phone}</Text>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: 'Requirements',
      key: 'requirements',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {record.gpa && <Text>GPA: {record.gpa}</Text>}
          {record.dse_score && <Text>DSE: {record.dse_score}</Text>}
          {record.desired_groupmates && (
            <Text>Looking for: {record.desired_groupmates}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedRequest(record);
              setInviteModalVisible(true);
            }}
          >
            Send Invite
          </Button>
          {record.isOwner && (
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteRequest(record._id)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="group-formation-container">
      <Card
        title="Study Group Formation"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            Create Request
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={requests}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Create Request Modal */}
      <Modal
        title="Create Group Request"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRequest}>
          <Form.Item
            name="major"
            label="Major"
            rules={[{ required: true, message: 'Please enter your major' }]}
          >
            <Input placeholder="e.g., Computer Science, Business Administration" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <TextArea
              placeholder="Describe what kind of study group you're looking for..."
              rows={4}
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <Form.Item
            name="desired_groupmates"
            label="Desired Groupmates (Optional)"
          >
            <Input placeholder="e.g., 3-4 people, good at programming" />
          </Form.Item>
          
          <Form.Item
            name="gpa"
            label="GPA (Optional)"
          >
            <InputNumber
              min={0}
              max={4}
              step={0.01}
              placeholder="e.g., 3.5"
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="dse_score"
            label="DSE Score (Optional)"
          >
            <Input placeholder="e.g., 25" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Contact Email"
          >
            <Input placeholder="Email for group coordination" />
          </Form.Item>
          
          <Form.Item
            name="phone"
            label="Phone (Optional)"
          >
            <Input placeholder="Phone number" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Send Invitation Modal */}
      <Modal
        title={`Invite ${selectedRequest?.sid} to Study Group`}
        open={inviteModalVisible}
        onCancel={() => {
          setInviteModalVisible(false);
          setSelectedRequest(null);
        }}
        footer={null}
      >
        <Form form={inviteForm} layout="vertical" onFinish={handleSendInvitation}>
          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please write a message' }]}
            initialValue={`Hi! I would like to form a study group with you. Let's coordinate our schedules!`}
          >
            <TextArea
              rows={4}
              placeholder="Introduce yourself and suggest how to coordinate..."
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              <small>
                After sending invitation, you'll be asked if you want to delete this request from the public list.
              </small>
            </Text>
          </div>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Send Invitation via Email
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Description Detail Modal */}
      <Modal
        title="Full Description"
        open={descriptionModalVisible}
        onCancel={() => setDescriptionModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDescriptionModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#f9f9f9', 
          borderRadius: '8px',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <Text>{selectedDescription || 'No description provided'}</Text>
        </div>
        {selectedRequest && (
          <div style={{ marginTop: '16px' }}>
            <Text strong>Student: </Text>
            <Text>{selectedRequest.sid}</Text>
            <br />
            <Text strong>Major: </Text>
            <Text>{selectedRequest.major}</Text>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GroupFormation;
