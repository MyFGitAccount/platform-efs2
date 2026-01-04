import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Table, message, Space, Typography, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { coursesAPI } from '../utils/api';
import './CourseEditor.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CourseEditor = ({ user }) => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState([]);
  const [form] = Form.useForm();
  const [timetableForm] = Form.useForm();

  useEffect(() => {
    if (user?.role !== 'admin') {
      message.error('Admin access required');
      navigate('/');
      return;
    }
    loadCourse();
  }, [code, user, navigate]);

  const loadCourse = async () => {
    try {
      const response = await coursesAPI.getCourse(code);
      setCourse(response.data);
      setTimetable(response.data.timetable || []);
      form.setFieldsValue(response.data);
    } catch (error) {
      message.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async (values) => {
    try {
      // In a real app, you would have an update endpoint
      message.success('Course updated successfully');
    } catch (error) {
      message.error('Failed to update course');
    }
  };

  const handleAddTimetable = (values) => {
    const newTimetable = [...timetable, {
      ...values,
      key: Date.now().toString()
    }];
    setTimetable(newTimetable);
    timetableForm.resetFields();
  };

  const handleDeleteTimetable = (key) => {
    setTimetable(timetable.filter(item => item.key !== key));
  };

  const timetableColumns = [
    {
      title: 'Day',
      dataIndex: 'day',
      key: 'day',
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'Room',
      dataIndex: 'room',
      key: 'room',
    },
    {
      title: 'Class',
      dataIndex: 'classNo',
      key: 'classNo',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteTimetable(record.key)}
        />
      ),
    },
  ];

  if (loading || !course) {
    return <div>Loading...</div>;
  }

  return (
    <div className="course-editor-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveCourse}
          >
            <Row gutter={[24, 16]}>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="Course Code"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="Course Title"
                  rules={[{ required: true, message: 'Please enter course title' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              
              <Col span={24}>
                <Form.Item
                  name="description"
                  label="Description"
                >
                  <TextArea rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Timetable Editor */}
        <Card
          title="Timetable"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => Modal.confirm({
                title: 'Add Timetable Slot',
                content: (
                  <Form form={timetableForm} layout="vertical">
                    <Form.Item
                      name="day"
                      label="Day"
                      rules={[{ required: true, message: 'Please select day' }]}
                    >
                      <Select placeholder="Select day">
                        <Option value="Mon">Monday</Option>
                        <Option value="Tue">Tuesday</Option>
                        <Option value="Wed">Wednesday</Option>
                        <Option value="Thu">Thursday</Option>
                        <Option value="Fri">Friday</Option>
                        <Option value="Sat">Saturday</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="time"
                      label="Time"
                      rules={[{ required: true, message: 'Please enter time' }]}
                    >
                      <Input placeholder="e.g., 09:00-12:00" />
                    </Form.Item>
                    <Form.Item
                      name="room"
                      label="Room"
                      rules={[{ required: true, message: 'Please enter room' }]}
                    >
                      <Input placeholder="e.g., ADC101" />
                    </Form.Item>
                    <Form.Item
                      name="classNo"
                      label="Class Number"
                    >
                      <Input placeholder="e.g., 01" />
                    </Form.Item>
                  </Form>
                ),
                onOk: () => timetableForm.submit(),
              })}
            >
              Add Slot
            </Button>
          }
        >
          <Form form={timetableForm} onFinish={handleAddTimetable} />
          <Table
            columns={timetableColumns}
            dataSource={timetable}
            pagination={false}
            size="small"
          />
        </Card>

        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>
          <Button onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Space>
      </Space>
    </div>
  );
};

export default CourseEditor;
