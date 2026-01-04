import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, message, Modal, Form, Input, TimePicker, Space } from 'antd';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { calendarAPI, coursesAPI } from '../utils/api';
import './Calendar.css';

const { Option } = Select;

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState({});
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsRes, coursesRes, timetableRes] = await Promise.all([
        calendarAPI.getEvents(),
        coursesAPI.getAll(),
        calendarAPI.getMyTimetable()
      ]);
      
      setEvents(eventsRes.data);
      setCourses(coursesRes.data);
      setSelectedCourses(timetableRes.data || []);
    } catch (error) {
      message.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    Modal.info({
      title: 'Course Details',
      content: (
        <div>
          <p><strong>Course:</strong> {clickInfo.event.title}</p>
          <p><strong>Title:</strong> {clickInfo.event.extendedProps.fullTitle}</p>
          <p><strong>Room:</strong> {clickInfo.event.extendedProps.room}</p>
          <p><strong>Class:</strong> {clickInfo.event.extendedProps.classNo}</p>
          <p><strong>Time:</strong> {new Date(clickInfo.event.start).toLocaleTimeString()} - {new Date(clickInfo.event.end).toLocaleTimeString()}</p>
        </div>
      ),
    });
  };

  const handleAddCourse = async (values) => {
    try {
      const newEvent = {
        title: values.code,
        start: values.time[0].toISOString(),
        end: values.time[1].toISOString(),
        daysOfWeek: [values.day],
        extendedProps: {
          fullTitle: courses[values.code] || 'Unknown Course',
          room: values.room,
          classNo: values.classNo,
        }
      };
      
      setEvents([...events, newEvent]);
      setModalVisible(false);
      form.resetFields();
      message.success('Course added to calendar');
    } catch (error) {
      message.error('Failed to add course');
    }
  };

  const handleSaveTimetable = async () => {
    try {
      await calendarAPI.saveTimetable({
        courses: selectedCourses
      });
      message.success('Timetable saved successfully');
    } catch (error) {
      message.error('Failed to save timetable');
    }
  };

  const handleExportPNG = () => {
    const calendarEl = document.querySelector('.fc');
    if (calendarEl) {
      html2canvas(calendarEl).then(canvas => {
        const link = document.createElement('a');
        link.download = 'timetable.png';
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  };

  return (
    <div className="calendar-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="Timetable Planner"
            extra={
              <Space>
                <Button icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                  Add Course
                </Button>
                <Button type="primary" onClick={handleSaveTimetable}>
                  Save Timetable
                </Button>
                <Button onClick={handleExportPNG}>
                  Export as PNG
                </Button>
              </Space>
            }
          >
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={handleEventClick}
              editable={true}
              selectable={true}
              slotMinTime="08:00:00"
              slotMaxTime="22:00:00"
              height="auto"
              weekends={true}
            />
          </Card>
        </Col>
      </Row>

      {/* Course Selection Sidebar */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Available Courses">
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Search and add courses"
              value={selectedCourses}
              onChange={setSelectedCourses}
              loading={loading}
            >
              {Object.entries(courses).map(([code, title]) => (
                <Option key={code} value={code}>
                  {code} - {title}
                </Option>
              ))}
            </Select>
          </Card>
        </Col>
      </Row>

      {/* Add Course Modal */}
      <Modal
        title="Add Course to Calendar"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddCourse}>
          <Form.Item
            name="code"
            label="Course Code"
            rules={[{ required: true, message: 'Please select course code' }]}
          >
            <Select showSearch placeholder="Search course code">
              {Object.keys(courses).map(code => (
                <Option key={code} value={code}>
                  {code} - {courses[code]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="classNo"
            label="Class Number"
            rules={[{ required: true, message: 'Please enter class number' }]}
          >
            <Input placeholder="e.g., 01, 02" />
          </Form.Item>
          
          <Form.Item
            name="day"
            label="Day of Week"
            rules={[{ required: true, message: 'Please select day' }]}
          >
            <Select placeholder="Select day">
              <Option value={0}>Sunday</Option>
              <Option value={1}>Monday</Option>
              <Option value={2}>Tuesday</Option>
              <Option value={3}>Wednesday</Option>
              <Option value={4}>Thursday</Option>
              <Option value={5}>Friday</Option>
              <Option value={6}>Saturday</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="time"
            label="Time"
            rules={[{ required: true, message: 'Please select time' }]}
          >
            <TimePicker.RangePicker format="HH:mm" minuteStep={15} />
          </Form.Item>
          
          <Form.Item
            name="room"
            label="Room"
            rules={[{ required: true, message: 'Please enter room' }]}
          >
            <Input placeholder="e.g., ADC101" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Add to Calendar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Calendar;
