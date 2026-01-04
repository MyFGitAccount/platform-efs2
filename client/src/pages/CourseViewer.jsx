import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, Table, Tag, Space, Button, message, Row, Col } from 'antd';
import { BookOutlined, CalendarOutlined, FileOutlined } from '@ant-design/icons';
import { coursesAPI, materialsAPI } from '../utils/api';
import './CourseViewer.css';

const { Title, Text } = Typography;

const CourseViewer = () => {
  const { code } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    loadCourse();
  }, [code]);

  const loadCourse = async () => {
    try {
      const response = await coursesAPI.getCourse(code);
      setCourse(response.data);
      setMaterials(response.data.materials || []);
    } catch (error) {
      message.error('Failed to load course');
    } finally {
      setLoading(false);
    }
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
  ];

  const materialsColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size) => {
        const kb = size / 1024;
        const mb = kb / 1024;
        return mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
      },
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => materialsAPI.downloadMaterial(record.id)}
        >
          Download
        </Button>
      ),
    },
  ];

  if (loading || !course) {
    return <div>Loading...</div>;
  }

  return (
    <div className="course-viewer-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Course Header */}
        <Card>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={2}>
              {course.code} - {course.title}
            </Title>
            <Text type="secondary">
              {course.description || 'No description available'}
            </Text>
          </Space>
        </Card>

        <Row gutter={[24, 24]}>
          {/* Timetable */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>Timetable</span>
                </Space>
              }
            >
              {course.timetable && course.timetable.length > 0 ? (
                <Table
                  columns={timetableColumns}
                  dataSource={course.timetable}
                  rowKey={(record) => `${record.day}-${record.time}`}
                  pagination={false}
                  size="small"
                />
              ) : (
                <Text type="secondary">No timetable available</Text>
              )}
            </Card>
          </Col>

          {/* Materials */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FileOutlined />
                  <span>Learning Materials</span>
                </Space>
              }
            >
              {materials.length > 0 ? (
                <Table
                  columns={materialsColumns}
                  dataSource={materials}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              ) : (
                <Text type="secondary">No materials available</Text>
              )}
            </Card>
          </Col>
        </Row>
      </Space>
    </div>
  );
};

export default CourseViewer;
