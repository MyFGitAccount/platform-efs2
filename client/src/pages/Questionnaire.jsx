import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, InputNumber, message, Space, Tag, Typography, Progress, Badge } from 'antd';
import { PlusOutlined, CheckCircleOutlined, UserOutlined, LinkOutlined } from '@ant-design/icons';
import { questionnaireAPI } from '../utils/api';
import './Questionnaire.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Questionnaire = () => {
  const [questionnaires, setQuestionnaires] = useState([]);
  const [myQuestionnaires, setMyQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        questionnaireAPI.getAll(),
        questionnaireAPI.getMy()
      ]);
      setQuestionnaires(allRes.data);
      setMyQuestionnaires(myRes.data);
    } catch (error) {
      message.error('Failed to load questionnaires');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestionnaire = async (values) => {
    try {
      await questionnaireAPI.create(values);
      message.success('Questionnaire posted! 1 credits deducted.');
      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error(error.error || 'Failed to create questionnaire');
    }
  };

  const handleFillQuestionnaire = async (id) => {
    try {
      await questionnaireAPI.fill(id);
      message.success('Questionnaire filled! You earned 1 credit!');
      loadData();
    } catch (error) {
      message.error(error.error || 'Failed to fill questionnaire');
    }
  };

  const columns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Creator',
      dataIndex: 'creatorSid',
      key: 'creator',
      render: (sid) => (
        <Space>
          <UserOutlined />
          <Text>{sid}</Text>
        </Space>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress
            percent={Math.round((record.currentResponses / record.targetResponses) * 100)}
            size="small"
            status={record.status === 'completed' ? 'success' : 'active'}
          />
          <Text type="secondary">
            {record.currentResponses} / {record.targetResponses} responses
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'blue' : 'success'}>
          {status === 'active' ? 'To be filled' : 'Completed'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<LinkOutlined />}
            onClick={() => window.open(record.link, '_blank')}
          >
            Open Link
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleFillQuestionnaire(record._id)}
            disabled={record.creatorSid === localStorage.getItem('userSid')}
          >
            Fill
          </Button>
        </Space>
      ),
    },
  ];

  const myColumns = [
    ...columns.slice(0, 3),
    {
      title: 'Filled By',
      key: 'filledBy',
      render: (_, record) => (
        <Text>{record.filledBy?.length || 0} students</Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Badge
          status={record.status === 'completed' ? 'success' : 'processing'}
          text={record.status === 'completed' ? 'Completed' : 'Active'}
        />
      ),
    },
  ];

  return (
    <div className="questionnaire-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Create Questionnaire Section */}
        <Card
          title="Create New Questionnaire"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              Create Questionnaire (1 credits)
            </Button>
          }
        >
          <Text>
            Need questionnaire responses? Post your link here and other students will help fill it.
            Creating a questionnaire costs 1 credits, but you can earn credits by filling others' questionnaires.
          </Text>
        </Card>

        {/* My Questionnaires */}
        <Card title="My Questionnaires">
          <Table
            columns={myColumns}
            dataSource={myQuestionnaires}
            loading={loading}
            rowKey="_id"
            pagination={{ pageSize: 5 }}
          />
        </Card>

        {/* Available Questionnaires to Fill */}
        <Card title="Available Questionnaires to Fill">
          <Table
            columns={columns}
            dataSource={questionnaires}
            loading={loading}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>

      {/* Create Questionnaire Modal */}
      <Modal
        title="Create New Questionnaire"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateQuestionnaire}>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please describe your questionnaire' }]}
          >
            <Input placeholder="e.g., EAP II Course Survey, Research on Study Habits" />
          </Form.Item>
          
          <Form.Item
            name="link"
            label="Questionnaire Link"
            rules={[
              { required: true, message: 'Please enter the questionnaire link' },
              { type: 'url', message: 'Please enter a valid URL' }
            ]}
          >
            <Input
              placeholder="https://forms.google.com/..."
              prefix={<LinkOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="targetResponses"
            label="Target Responses"
            initialValue={30}
          >
            <InputNumber
              min={1}
              max={100}
              style={{ width: '100%' }}
              placeholder="Minimum 30 for EAP II"
            />
          </Form.Item>
          
          <Form.Item>
            <Text type="secondary">
              Creating a questionnaire costs <strong>1 credits</strong>.
              You will earn credits when others fill your questionnaire.
            </Text>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Post Questionnaire (Cost: 1 credits)
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Questionnaire;
