import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Modal, Form, Input, Upload, 
  message, Space, Typography, Tag, Row, Col, Select 
} from 'antd';
import { UploadOutlined, DownloadOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { materialsAPI, coursesAPI } from '../utils/api';
import './Materials.css';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

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
      setLoading(true);
      
      let coursesData = [];
      
      // Try to get courses list, fallback to getAll if list fails
      try {
        const coursesRes = await coursesAPI.getList();
        coursesData = coursesRes.data || [];
      } catch (listError) {
        console.log('Courses list endpoint failed, trying getAll...', listError);
        try {
          const allCoursesRes = await coursesAPI.getAll();
          // Convert from object to array format
          if (allCoursesRes.data && typeof allCoursesRes.data === 'object') {
            coursesData = Object.keys(allCoursesRes.data).map(code => ({
              code: code,
              title: allCoursesRes.data[code] || code
            }));
          } else {
            coursesData = [];
          }
        } catch (getAllError) {
          console.error('Both courses endpoints failed:', getAllError);
          coursesData = [];
        }
      }
      
      setCourses(coursesData);
      
      // Try to load all materials directly (FASTEST)
      try {
        const allMaterialsRes = await materialsAPI.getAllMaterials();
        const materialsData = allMaterialsRes.data || [];
        
        if (materialsData.length > 0) {
          // Enrich materials with course names
          const enrichedMaterials = materialsData.map(material => {
            const course = coursesData.find(c => c.code === material.courseCode);
            return {
              ...material,
              courseName: course ? course.title : material.courseName || material.courseCode
            };
          });
          
          setMaterials(enrichedMaterials);
          setFilteredMaterials(enrichedMaterials);
          return;
        }
      } catch (directError) {
        console.log('Direct materials fetch failed, falling back...', directError);
      }
      
      // Fallback: Load materials from each course individually
      if (coursesData.length > 0) {
        const successfulMaterials = [];
        
        // Try a few courses first to see if it works
        for (let i = 0; i < Math.min(5, coursesData.length); i++) {
          const course = coursesData[i];
          try {
            const materialsRes = await materialsAPI.getCourseMaterials(course.code);
            if (materialsRes.data && materialsRes.data.length > 0) {
              successfulMaterials.push(...materialsRes.data.map(material => ({
                ...material,
                courseCode: course.code,
                courseName: course.title || material.courseName || course.code
              })));
            }
          } catch (error) {
            console.error(`Failed to load materials for ${course.code}:`, error);
          }
        }
        
        // If we got some materials, use them
        if (successfulMaterials.length > 0) {
          setMaterials(successfulMaterials);
          setFilteredMaterials(successfulMaterials);
          return;
        }
      }
      
      // If all else fails, set empty arrays
      setMaterials([]);
      setFilteredMaterials([]);
      
    } catch (error) {
      console.error('Failed to load materials:', error);
      message.error('Failed to load materials. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    if (!value) {
      setFilteredMaterials(materials);
      return;
    }
    
    const searchTerm = value.toLowerCase();
    const filtered = materials.filter(material => 
      (material.name && material.name.toLowerCase().includes(searchTerm)) ||
      (material.description && material.description.toLowerCase().includes(searchTerm)) ||
      (material.courseCode && material.courseCode.toLowerCase().includes(searchTerm)) ||
      (material.courseName && material.courseName.toLowerCase().includes(searchTerm))
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
        message.loading({ content: 'Uploading material...', key: 'upload', duration: 0 });
        
        await materialsAPI.uploadMaterial(selectedCourse, {
          ...values,
          fileData: reader.result,
          fileName: file.name,
          mimetype: file.type
        });
        
        message.success({ content: 'Material uploaded successfully', key: 'upload' });
        setUploadModalVisible(false);
        uploadForm.resetFields();
        setFileList([]);
        
        // Refresh data
        await loadData();
      } catch (error) {
        message.error({ content: error.error || 'Failed to upload material', key: 'upload' });
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
            {record.description || 'No description'}
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
          {code} - {record.courseName || 'Unknown Course'}
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
        if (!size) return 'N/A';
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
      title: 'Upload Date',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => handleDownload(record.id)}
          size="small"
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
              Access course materials uploaded by administrators ({materials.length} materials)
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

        {/* Search and Refresh */}
        <Card>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Search
                placeholder="Search materials by name, description, or course..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </Col>
            <Col>
              <Button 
                onClick={loadData}
                loading={loading}
              >
                Refresh
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Materials Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredMaterials}
            loading={loading}
            rowKey="id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} materials`
            }}
            locale={{ emptyText: 'No materials found. Upload some materials as admin.' }}
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
            uploadForm.resetFields();
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
                onChange={(value) => setSelectedCourse(value)}
                showSearch
                optionFilterProp="children"
                loading={loading}
              >
                {courses.map(course => (
                  <Option key={course.code} value={course.code}>
                    {course.code} - {course.title || 'Untitled'}
                  </Option>
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
                  // Limit file size to 50MB
                  const isLt50M = file.size / 1024 / 1024 < 50;
                  if (!isLt50M) {
                    message.error('File must be smaller than 50MB!');
                    return false;
                  }
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
