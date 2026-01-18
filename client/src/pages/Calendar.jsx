import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Card, Row, Col, Button, message, Modal, 
  Space, Tag, Spin, Empty, Input as AntInput,
  List, Typography, Badge, Tooltip
} from 'antd';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  DeleteOutlined, SearchOutlined, 
  CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined,
  SaveOutlined, TeamOutlined
} from '@ant-design/icons';
import { coursesAPI } from '../utils/api';
import debounce from 'lodash/debounce';
import './Calendar.css';

const { Title, Text } = Typography;

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [initialLoad, setInitialLoad] = useState(false);

  // Campus mapping
  const campusMap = {
    'ADC': 'Admiralty Learning Centre',
    'CIT': 'CITA Learning Centre',
    'HPC': 'HPSHCC Campus',
    'HKU': 'Hong Kong University',
    'IEC': 'Island East Campus',
    'ISP': 'Island South (Pokfulam) Campus',
    'KEC': 'Kowloon East Campus',
    'KEE': 'Kowloon East (Kingston) Learning Centre ',
    'KWC': 'Kowloon West Campus',
    'UNC': 'United Centre',
    'SSC': 'Sheung Shui Learning Centre'
  };

  // Get color for course
  const getColorForCourse = (courseCode) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
    ];
    
    let hash = 0;
    for (let i = 0; i < courseCode.length; i++) {
      hash = courseCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    
    return colors[index];
  };

  // Get day string
  const getDayString = (weekday) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[weekday] || '';
  };

  const getFullDayString = (weekday) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[weekday] || '';
  };

  // Helper to format combined class numbers display
  const formatClassNoDisplay = (classNo, originalClassNo, isCombined) => {
    if (isCombined && originalClassNo.includes('+')) {
      const classes = originalClassNo.split('+');
      return (
        <Tooltip title={`Combined classes: ${originalClassNo}`}>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ 
              backgroundColor: '#722ed1',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '11px',
              fontWeight: 'bold',
              marginRight: '4px'
            }}>
              {classNo}
            </span>
            <TeamOutlined style={{ fontSize: '12px', color: '#722ed1' }} />
          </div>
        </Tooltip>
      );
    }
    
    return (
      <span style={{ 
        backgroundColor: '#d9d9d9',
        color: '#000',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 'bold'
      }}>
        {classNo}
      </span>
    );
  };

  // Load saved timetable from localStorage on mount
  useEffect(() => {
    const loadSavedTimetable = () => {
      try {
        const saved = localStorage.getItem('timetable');
        if (saved) {
          const savedSessions = JSON.parse(saved);
          setSelectedSessions(savedSessions);
          
          // Generate events from saved sessions
          const savedEvents = generateEventsFromSessions(savedSessions);
          setEvents(savedEvents);
        }
      } catch (error) {
        console.error('Failed to load saved timetable:', error);
      }
    };

    loadSavedTimetable();
  }, []);

  // Generate calendar events from sessions - FIXED WEEKDAY OFFSET
  const generateEventsFromSessions = (sessions) => {
    const events = [];
    const now = new Date();
    const currentWeekStart = new Date(now);
    
    // Start from Monday of current week
    const currentDay = now.getDay(); // JS: 0=Sunday, 1=Monday, etc.
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1; // Adjust for Monday start
    currentWeekStart.setDate(now.getDate() - daysSinceMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    sessions.forEach(session => {
      const [startHour, startMin] = (session.startTime || '').split(':').map(Number);
      const [endHour, endMin] = (session.endTime || '').split(':').map(Number);
      
      if (isNaN(startHour)) return;
      
      // Convert database weekday (0=Monday) to JavaScript weekday for FullCalendar
      const dbWeekday = session.weekday || 0;
      // FullCalendar uses ISO weekday: 1=Monday, 2=Tuesday, ..., 7=Sunday
      const isoWeekday = dbWeekday + 1; // 0=Monday -> 1, 1=Tuesday -> 2, etc.
      
      // Create events for next 2 weeks
      for (let week = 0; week < 2; week++) {
        const eventDate = new Date(currentWeekStart);
        // Add days to get to the correct day of week
        // Since currentWeekStart is Monday, add the database weekday (0=Monday)
        eventDate.setDate(currentWeekStart.getDate() + (week * 7) + dbWeekday);
        
        const startDate = new Date(eventDate);
        startDate.setHours(startHour, startMin, 0, 0);
        
        const endDate = new Date(eventDate);
        endDate.setHours(endHour, endMin, 0, 0);
        
        // Format title for combined classes
        let title = `${session.code} ${session.classNo}`;
        if (session.isCombined && session.combinedCount > 1) {
          title = `${session.code} ${session.classNo} (+${session.combinedCount - 1})`;
        }
        
        events.push({
          id: `${session.code}-${session.classNo}-${week}-${dbWeekday}`,
          title: title,
          extendedProps: {
            fullTitle: session.title || session.code,
            room: session.room || '',
            classNo: session.classNo || '',
            originalClassNo: session.originalClassNo || session.classNo,
            isCombined: session.isCombined || false,
            combinedCount: session.combinedCount || 1,
            code: session.code,
          },
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: session.color || getColorForCourse(session.code),
          textColor: '#ffffff',
          borderColor: session.color || getColorForCourse(session.code)
        });
      }
    });
    
    return events;
  };

  // Debounced search function
  const handleSearch = useCallback(
    debounce(async (searchValue) => {
      if (!searchValue.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        
        // Search for courses
        const coursesRes = await coursesAPI.getAll();
        const allCourses = coursesRes.data || [];
        
        // Filter by search term
        const filtered = allCourses.filter(course => 
          course.code.toLowerCase().includes(searchValue.toLowerCase()) ||
          (course.title && course.title.toLowerCase().includes(searchValue.toLowerCase()))
        ).slice(0, 20); // Limit to 20 results
        
        // For each course, get its sessions
        const coursesWithSessions = await Promise.all(
          filtered.map(async (course) => {
            try {
              const courseDetailRes = await coursesAPI.getCourse(course.code);
              return {
                ...course,
                sessions: courseDetailRes.data?.timetable || []
              };
            } catch (error) {
              return {
                ...course,
                sessions: []
              };
            }
          })
        );
        
        setSearchResults(coursesWithSessions);
      } catch (error) {
        console.error('Search error:', error);
        message.error('Failed to search courses');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  // Check if a specific session is already added
  const isSessionAlreadyAdded = (course, session) => {
    const sessionId = `${course.code}-${session.classNo}`;
    return selectedSessions.some(s => s.id === sessionId);
  };

  // Check if any session from a combined class is added
  const isAnyCombinedSessionAdded = (course, session) => {
    if (session.isCombined && session.originalClassNo.includes('+')) {
      const classNumbers = session.originalClassNo.split('+').map(num => num.trim());
      return classNumbers.some(classNo => {
        const sessionId = `${course.code}-${classNo}`;
        return selectedSessions.some(s => s.id === sessionId);
      });
    }
    return false;
  };

  // Add specific session to timetable
  const handleAddSession = (course, session) => {
    // Check if this specific session (course + classNo) is already added
    if (isSessionAlreadyAdded(course, session)) {
      message.info(`${course.code} ${session.classNo} is already in your timetable`);
      return;
    }
    
    // For combined classes, check if any part is already added
    if (session.isCombined && isAnyCombinedSessionAdded(course, session)) {
      message.warning(`Some classes from ${course.code} ${session.originalClassNo} are already added`);
    }
    
    // Create session object
    const newSession = {
      id: `${course.code}-${session.classNo}`,
      code: course.code,
      title: course.title,
      classNo: session.classNo,
      originalClassNo: session.originalClassNo || session.classNo,
      isCombined: session.isCombined || false,
      combinedCount: session.combinedCount || 1,
      startTime: session.startTime,
      endTime: session.endTime,
      weekday: session.weekday,
      room: session.room,
      campus: campusMap[session.room?.substring(0, 3)?.toUpperCase()] || session.room,
      color: getColorForCourse(course.code),
      day: getDayString(session.weekday),
      time: `${session.startTime}-${session.endTime}`
    };
    
    // Add to selected sessions
    const updatedSessions = [...selectedSessions, newSession];
    setSelectedSessions(updatedSessions);
    
    // Generate and update events
    const newEvents = generateEventsFromSessions(updatedSessions);
    setEvents(newEvents);
    
    message.success(`${course.code} ${session.classNo} added to timetable`);
  };

  // Remove session from timetable
  const handleRemoveSession = (sessionId) => {
    const session = selectedSessions.find(s => s.id === sessionId);
    const updatedSessions = selectedSessions.filter(s => s.id !== sessionId);
    
    setSelectedSessions(updatedSessions);
    
    // Update events
    const newEvents = generateEventsFromSessions(updatedSessions);
    setEvents(newEvents);
    
    message.info(`${session?.code} ${session?.classNo} removed from timetable`);
  };

  // Save timetable to localStorage
  const handleSaveTimetable = () => {
    if (selectedSessions.length === 0) {
      message.warning('No courses selected to save');
      return;
    }

    try {
      setLoading(true);
      
      // Save to localStorage
      localStorage.setItem('timetable', JSON.stringify(selectedSessions));
      
      message.success('Timetable saved locally!');
    } catch (error) {
      console.error('Save timetable error:', error);
      message.error('Failed to save timetable');
    } finally {
      setLoading(false);
    }
  };

  // Clear entire timetable
  const handleClearTimetable = () => {
    Modal.confirm({
      title: 'Clear Timetable',
      content: 'Are you sure you want to clear all courses from your timetable?',
      okText: 'Yes, clear all',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        setSelectedSessions([]);
        setEvents([]);
        localStorage.removeItem('timetable');
        message.success('Timetable cleared');
      }
    });
  };

  // Export timetable as JSON
  const handleExportTimetable = () => {
    if (selectedSessions.length === 0) {
      message.warning('No courses to export');
      return;
    }

    try {
      const dataStr = JSON.stringify(selectedSessions, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `timetable-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      message.success('Timetable exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export timetable');
    }
  };

  // Import timetable from JSON file
  const handleImportTimetable = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSessions = JSON.parse(e.target.result);
        
        if (!Array.isArray(importedSessions)) {
          throw new Error('Invalid timetable format');
        }
        
        setSelectedSessions(importedSessions);
        
        // Generate events from imported sessions
        const newEvents = generateEventsFromSessions(importedSessions);
        setEvents(newEvents);
        
        // Save to localStorage
        localStorage.setItem('timetable', JSON.stringify(importedSessions));
        
        message.success('Timetable imported successfully');
      } catch (error) {
        console.error('Import error:', error);
        message.error('Failed to import timetable. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };

  // Event click handler for calendar
  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    // Convert from FullCalendar date to get the actual day
    const eventDate = new Date(event.start);
    const jsWeekday = eventDate.getDay(); // JS: 0=Sunday, 1=Monday, etc.
    
    // Convert JS weekday to database weekday for display
    const displayWeekday = jsWeekday === 0 ? 6 : jsWeekday - 1;
    
    const extendedProps = event.extendedProps || {};
    
    Modal.info({
      title: 'Course Details',
      content: (
        <div>
          <p><strong>Course:</strong> {extendedProps.code}</p>
          <p><strong>Title:</strong> {extendedProps.fullTitle}</p>
          <p><strong>Class:</strong> {extendedProps.classNo}</p>
          {extendedProps.isCombined && (
            <p><strong>Combined Classes:</strong> {extendedProps.originalClassNo}</p>
          )}
          <p><strong>Time:</strong> {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          <p><strong>Day:</strong> {getFullDayString(displayWeekday)}</p>
          <p><strong>Room:</strong> {extendedProps.room}</p>
        </div>
      ),
      okText: 'Close',
    });
  };

  return (
    <div className="calendar-container">
      <Row gutter={[16, 16]}>
        {/* Left Sidebar - Course Search */}
        <Col xs={24} md={8} lg={6}>
          <Card 
            title={
              <Space>
                <SearchOutlined />
                <span>Course Search</span>
              </Space>
            }
            className="search-sidebar"
            bordered={false}
          >
            {/* Search Input */}
            <div style={{ marginBottom: 16 }}>
              <AntInput
                placeholder="Search by course code or name..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={handleSearchChange}
                allowClear
                size="large"
              />
            </div>

            {/* Search Results */}
            <div className="search-results-section">
              {searchLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Spin />
                  <div style={{ marginTop: 8, color: '#666' }}>Searching courses...</div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.map(course => (
                    <Card 
                      key={course.code}
                      size="small"
                      style={{ 
                        marginBottom: 16,
                        borderLeft: `4px solid ${getColorForCourse(course.code)}`
                      }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <div>
                          <Text strong style={{ fontSize: '16px' }}>
                            {course.code}
                          </Text>
                        </div>
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          {course.title}
                        </div>
                      </div>
                      
                      {/* Available Sessions for this course */}
                      {course.sessions.length > 0 ? (
                        <div className="course-sessions">
                          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                            Available classes:
                          </Text>
                          {course.sessions.map((session, index) => {
                            const sessionId = `${course.code}-${session.classNo}`;
                            const isSelected = selectedSessions.some(s => s.id === sessionId);
                            
                            return (
                              <div 
                                key={index}
                                className={`session-item ${isSelected ? 'selected' : ''}`}
                                style={{
                                  padding: '8px',
                                  marginBottom: '6px',
                                  borderRadius: '4px',
                                  border: '1px solid #f0f0f0',
                                  backgroundColor: isSelected ? '#f6ffed' : '#fafafa',
                                  cursor: isSelected ? 'default' : 'pointer',
                                  transition: 'all 0.3s',
                                  opacity: isSelected ? 0.8 : 1
                                }}
                                onClick={() => !isSelected && handleAddSession(course, session)}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ display: 'inline-block', marginRight: 8 }}>
                                      {formatClassNoDisplay(session.classNo, session.originalClassNo, session.isCombined)}
                                    </div>
                                    <Space size="small">
                                      <ClockCircleOutlined style={{ fontSize: '12px' }} />
                                      <Text style={{ fontSize: '12px' }}>
                                        {getDayString(session.weekday)} {session.startTime}-{session.endTime}
                                      </Text>
                                    </Space>
                                  </div>
                                  <div>
                                    <Space>
                                      <EnvironmentOutlined style={{ fontSize: '12px', color: '#666' }} />
                                      <Text style={{ fontSize: '12px' }}>{session.room}</Text>
                                      {isSelected ? (
                                        <Tag color="success" style={{ fontSize: '11px' }}>Added</Tag>
                                      ) : (
                                        <Button 
                                          type="primary" 
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddSession(course, session);
                                          }}
                                        >
                                          Add
                                        </Button>
                                      )}
                                    </Space>
                                  </div>
                                </div>
                                {session.isCombined && (
                                  <div style={{ 
                                    marginTop: 4, 
                                    fontSize: '11px', 
                                    color: '#722ed1',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}>
                                    <TeamOutlined style={{ marginRight: 4, fontSize: '10px' }} />
                                    Combined with: {session.originalClassNo.split('+').filter(cn => cn !== session.classNo).join(', ')}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <Empty 
                          description="No sessions available"
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          style={{ padding: 20 }}
                        />
                      )}
                    </Card>
                  ))}
                </div>
              ) : searchTerm ? (
                <Empty 
                  description="No courses found"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: 40 }}
                />
              ) : (
                <Empty 
                  description="Search for courses to add to your timetable"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ padding: 40 }}
                />
              )}
            </div>
          </Card>
        </Col>

        {/* Main Calendar Area */}
        <Col xs={24} md={16} lg={18}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <span>My Timetable</span>
                {selectedSessions.length > 0 && (
                  <Tag color="blue">
                    {selectedSessions.length} course{selectedSessions.length !== 1 ? 's' : ''}
                  </Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportTimetable}
                  style={{ display: 'none' }}
                  id="import-file"
                />
                <label htmlFor="import-file">
                  <Button as="span">
                    Import
                  </Button>
                </label>
                <Button 
                  onClick={handleExportTimetable}
                  disabled={selectedSessions.length === 0}
                >
                  Export
                </Button>
                <Button 
                  onClick={handleClearTimetable}
                  disabled={selectedSessions.length === 0}
                  danger
                >
                  Clear All
                </Button>
                <Button 
                  type="primary"
                  onClick={handleSaveTimetable}
                  loading={loading}
                  disabled={selectedSessions.length === 0}
                  icon={<SaveOutlined />}
                >
                  Save
                </Button>
              </Space>
            }
          >
            {/* Selected Courses Summary */}
            {selectedSessions.length > 0 && (
              <div style={{ marginBottom: 16, padding: '0 8px' }}>
                <List
                  size="small"
                  dataSource={selectedSessions}
                  renderItem={session => (
                    <List.Item
                      actions={[
                        <Button 
                          type="text" 
                          danger 
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveSession(session.id)}
                        >
                          Remove
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div 
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: session.color,
                              marginTop: 6,
                              ...(session.isCombined && {
                                border: '2px solid #722ed1',
                                width: 14,
                                height: 14
                              })
                            }}
                          />
                        }
                        title={
                          <div>
                            <Text strong>
                              {session.code} {session.classNo} - {session.title}
                            </Text>
                            {session.isCombined && (
                              <TeamOutlined 
                                style={{ 
                                  marginLeft: 8, 
                                  color: '#722ed1',
                                  fontSize: '12px'
                                }} 
                              />
                            )}
                          </div>
                        }
                        description={
                          <Space size="small">
                            <Tag 
                              icon={<ClockCircleOutlined />} 
                              size="small"
                              color={session.isCombined ? 'purple' : 'default'}
                            >
                              {session.day} {session.time}
                            </Tag>
                            <Tag 
                              icon={<EnvironmentOutlined />} 
                              size="small"
                              color={session.isCombined ? 'purple' : 'default'}
                            >
                              {session.room}
                            </Tag>
                            {session.isCombined && (
                              <Tag 
                                size="small" 
                                color="purple"
                                style={{ fontSize: '10px' }}
                              >
                                Combined: {session.originalClassNo}
                              </Tag>
                            )}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            )}

            {/* Calendar */}
            <div style={{ 
              minHeight: selectedSessions.length === 0 ? '600px' : '500px',
              display: 'flex',
              alignItems: selectedSessions.length === 0 ? 'center' : 'stretch',
              justifyContent: selectedSessions.length === 0 ? 'center' : 'flex-start',
              backgroundColor: selectedSessions.length === 0 ? '#fafafa' : 'transparent',
              borderRadius: '8px',
              border: selectedSessions.length === 0 ? '2px dashed #d9d9d9' : 'none',
              padding: selectedSessions.length === 0 ? '40px' : '0'
            }}>
              {selectedSessions.length === 0 ? (
                <Empty
                  description={
                    <div>
                      <Title level={4} style={{ color: '#666' }}>Your timetable is empty</Title>
                      <Text type="secondary">
                        Search for courses on the left and add them to your timetable
                      </Text>
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Your timetable will be saved locally in your browser
                        </Text>
                      </div>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
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
                  editable={false}
                  selectable={false}
                  slotMinTime="08:00:00"
                  slotMaxTime="22:00:00"
                  height="auto"
                  weekends={true}
                  initialDate={new Date()}
                  firstDay={1} // Monday as first day of week
                  eventContent={(eventInfo) => {
                    const event = eventInfo.event;
                    const extendedProps = event.extendedProps || {};
                    
                    return (
                      <div style={{ 
                        padding: '4px',
                        fontSize: '12px',
                        overflow: 'hidden',
                        lineHeight: 1.2
                      }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          marginBottom: 2,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <span>{event.title}</span>
                          {extendedProps.isCombined && (
                            <TeamOutlined style={{ 
                              marginLeft: 4, 
                              fontSize: '10px',
                              opacity: 0.8
                            }} />
                          )}
                        </div>
                        <div>{extendedProps.room}</div>
                      </div>
                    );
                  }}
                  eventDisplay="block"
                  allDaySlot={false}
                  slotDuration="00:30:00"
                  slotLabelFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Calendar;
