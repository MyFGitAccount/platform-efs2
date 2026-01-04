import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, Upload, message, Space, Typography, Tag, Row, Col } from 'antd';
import { UploadOutlined, DownloadOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { materialsAPI, coursesAPI } from '../utils/api';
import './Materials.css';

const { Title, Text } = Typography;
const { Search } = Input;

const Materials = ({ user }) => {
  const [materials, setMaterials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [uploadForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes] = await Promise.all([
        coursesAPI.getList(),
      ]);
      setCourses(coursesRes.data);
      
      // Load all materials by aggregating from each course
      const allMaterials = [];
      for (const course of coursesRes.data) {
        try {
          const materialsRes = await materialsAPI.getCourseMaterials(course.code);
          if (materialsRes.data) {
            allMaterials.push(...materialsRes.data.map(material => ({
              ...material,
              courseCode: course.code,
              courseName: course.title
            })));
          }
        } catch (error) {
          console.error(`Failed to load materials for ${course.code}:`, error);
        }
      }
      
      setMaterials(allMaterials);
      setFilteredMaterials(allMaterials);
    } catch (error) {
      message.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    if (!value) {
      setFilteredMaterials(materials);
      return;
    }
    
    const filtered = materials.filter(material => 
      material.name.toLowerCase().includes(value.toLowerCase()) ||
      material.description.toLowerCase().includes(value.toLowerCase()) ||
      material.courseCode.toLowerCase().includes(value.toLowerCase()) ||
      material.courseName.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredMaterials(filtered);
  };

  const handleUploadMaterial = async (values) => {
    if (fileList.length === 0) {
      message.error('Please select a file to upload');
      return;
    }

    const file = fileList[0];
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      try {
        await materialsAPI.uploadMaterial(selectedCourse, {
          ...values,
          fileData: reader.result,
          fileName: file.name,
          mimetype: file.type
        });
        
        message.success('Material uploaded successfully');
        setUploadModalVisible(false);
        uploadForm.resetFields();
        setFileList([]);
        loadData();
      } catch (error) {
        message.error(error.error || 'Failed to upload material');
      }
    };
    
    reader.readAsDataURL(file);
  };

  const handleDownload = (id) => {
    materialsAPI.downloadMaterial(id);
  };

  const columns = [
    {
      title: 'Material',
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
      title: 'Course',
      dataIndex: 'courseCode',
      key: 'course',
      render: (code, record) => (
        <Tag color="blue">
          {code} - {record.courseName}
        </Tag>
      ),
    },
    {
      title: 'Uploaded By',
      dataIndex: 'uploadedBy',
      key: 'uploadedBy',
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
      title: 'Downloads',
      dataIndex: 'downloads',
      key: 'downloads',
      render: (downloads) => <Text strong>{downloads || 0}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(record.id)}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div className="materials-container">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3}>Learning Materials</Title>
            <Text type="secondary">
              Access course materials uploaded by administrators
            </Text>
          </Col>
          <Col>
            {user?.role === 'admin' && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                Upload Material
              </Button>
            )}
          </Col>
        </Row>

        {/* Search */}
        <Card>
          <Search
            placeholder="Search materials by name, description, or course..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </Card>

        {/* Materials Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredMaterials}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Space>

      {/* Upload Modal (Admin only) */}
      {user?.role === 'admin' && (
        <Modal
          title="Upload Learning Material"
          open={uploadModalVisible}
          onCancel={() => {
            setUploadModalVisible(false);
            setFileList([]);
          }}
          footer={null}
          width={600}
        >
          <Form form={uploadForm} layout="vertical" onFinish={handleUploadMaterial}>
            <Form.Item
              name="courseCode"
              label="Course"
              rules={[{ required: true, message: 'Please select a course' }]}
            >
              <Select
                placeholder="Select course"
                onChange={setSelectedCourse}
                showSearch
                optionFilterProp="children"
              >
                {courses.map(course => (
                  <Select.Option key={course.code} value={course.code}>
                    {course.code} - {course.title}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="name"
              label="Material Name"
              rules={[{ required: true, message: 'Please enter material name' }]}
            >
              <Input placeholder="e.g., Lecture 1 Slides, Assignment 1 Solution" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea
                placeholder="Brief description of the material..."
                rows={3}
              />
            </Form.Item>
            
            <Form.Item
              label="File"
              required
            >
              <Upload
                fileList={fileList}
                beforeUpload={(file) => {
                  setFileList([file]);
                  return false;
                }}
                onRemove={() => setFileList([])}
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Select File</Button>
              </Upload>
              {fileList.length > 0 && (
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  Selected: {fileList[0].name} ({(fileList[0].size / 1024 / 1024).toFixed(2)} MB)
                </Text>
              )}
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Upload Material
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default Materials;
