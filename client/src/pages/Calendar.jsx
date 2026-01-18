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

  // Get day string - FIXED for database weekday (1=Monday, 2=Tuesday, ..., 7=Sunday)
  const getDayString = (weekday) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Database: 1=Monday, 2=Tuesday, ..., 7=Sunday
    // Convert to 0-based index for array
    const dayIndex = weekday - 1;
    return days[dayIndex] || '';
  };

  const getFullDayString = (weekday) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday','Sunday'];
    const dayIndex = weekday - 1;
    return days[dayIndex] || '';
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

  // Generate calendar events from sessions - FIXED for database weekday (1=Monday, ..., 7=Sunday)
  const generateEventsFromSessions = (sessions) => {
    const events = [];
    const now = new Date();
    
    // Get current date and find Monday of the current week
    const currentDate = new Date(now);
    
    // Get the day of the week: 0=Sunday, 1=Monday, 2=Tuesday, ..., 6=Saturday
    const currentDayOfWeek = currentDate.getDay();
    
    // Calculate the date of Monday this week
    const mondayDate = new Date(currentDate);
    
    // Adjust to Monday: if today is Sunday (0), go back 6 days
    // if today is Monday (1), no change
    // if today is Tuesday (2), go back 1 day, etc.
    const daysToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    mondayDate.setDate(currentDate.getDate() + daysToMonday);
    mondayDate.setHours(0, 0, 0, 0);

    sessions.forEach(session => {
      const [startHour, startMin] = (session.startTime || '').split(':').map(Number);
      const [endHour, endMin] = (session.endTime || '').split(':').map(Number);
      
      if (isNaN(startHour)) return;
      
      // Database weekday: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
      const dbWeekday = session.weekday || 1;
      
      // Convert database weekday (1-7) to day offset from Monday (0-6)
      // Monday (1) -> 0, Tuesday (2) -> 1, ..., Sunday (7) -> 6
      const dayOffset = dbWeekday - 1;
      
      // Create events for next 2 weeks
      for (let week = 0; week < 2; week++) {
        // Start from Monday, then add the day offset
        const eventDate = new Date(mondayDate);
        eventDate.setDate(mondayDate.getDate() + (week * 7) + dayOffset);
        
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
          id: `${session.code}-${session.classNo}-${week}-${dbWeekday}-${session.startTime}`,
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
    const sessionId = `${course.code}-${session.classNo}-${session.startTime}`;
    return selectedSessions.some(s => s.id === sessionId);
  };

  // Check if any session from the same class is added
  const isAnySessionFromClassAdded = (course, session) => {
    const classId = `${course.code}-${session.classNo}`;
    return selectedSessions.some(s => s.id.startsWith(classId));
  };

  // Check if any session from a combined class is added
  const isAnyCombinedSessionAdded = (course, session) => {
    if (session.isCombined && session.originalClassNo.includes('+')) {
      const classNumbers = session.originalClassNo.split('+').map(num => num.trim());
      return classNumbers.some(classNo => {
        const classId = `${course.code}-${classNo}`;
        return selectedSessions.some(s => s.id.startsWith(classId));
      });
    }
    return false;
  };

  // Add all sessions for a specific class
  const handleAddClass = (course, classNo) => {
    // Find all sessions for this class
    const classSessions = course.sessions.filter(session => session.classNo === classNo);
    
    if (classSessions.length === 0) return;
    
    // Check if any session from this class is already added
    const isAlreadyAdded = isAnySessionFromClassAdded(course, classSessions[0]);
    if (isAlreadyAdded) {
      message.info(`${course.code} ${classNo} is already in your timetable`);
      return;
    }
    
    // For combined classes, check if any part is already added
    if (classSessions[0].isCombined && isAnyCombinedSessionAdded(course, classSessions[0])) {
      message.warning(`Some classes from ${course.code} ${classSessions[0].originalClassNo} are already added`);
    }
    
    // Create session objects for all sessions of this class
    const newSessions = classSessions.map(session => ({
      id: `${course.code}-${session.classNo}-${session.startTime}`,
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
    }));
    
    // Add all sessions to selected sessions
    const updatedSessions = [...selectedSessions, ...newSessions];
    setSelectedSessions(updatedSessions);
    
    // Generate and update events
    const newEvents = generateEventsFromSessions(updatedSessions);
    setEvents(newEvents);
    
    message.success(`${course.code} ${classNo} (${classSessions.length} session${classSessions.length > 1 ? 's' : ''}) added to timetable`);
  };

  // Add specific session to timetable (kept for backward compatibility)
  const handleAddSession = (course, session) => {
    // Use the new handleAddClass function which adds all sessions for that class
    handleAddClass(course, session.classNo);
  };

  // Remove all sessions for a specific class
  const handleRemoveClass = (classCode) => {
    // classCode format: "COURSE-CODE-CLASS-NO"
    const [courseCode, classNo] = classCode.split('-').slice(0, 2);
    const classId = `${courseCode}-${classNo}`;
    
    const sessionsToRemove = selectedSessions.filter(s => s.id.startsWith(classId));
    const updatedSessions = selectedSessions.filter(s => !s.id.startsWith(classId));
    
    setSelectedSessions(updatedSessions);
    
    // Update events
    const newEvents = generateEventsFromSessions(updatedSessions);
    setEvents(newEvents);
    
    message.info(`${courseCode} ${classNo} (${sessionsToRemove.length} session${sessionsToRemove.length > 1 ? 's' : ''}) removed from timetable`);
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
    const extendedProps = event.extendedProps || {};
    
    // Get the event date
    const eventDate = new Date(event.start);
    
    // JavaScript getDay(): 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    const jsWeekday = eventDate.getDay();
    
    // Convert JavaScript weekday (0=Sunday) to database weekday (1=Monday, 7=Sunday)
    let displayWeekday;
    if (jsWeekday === 0) {
      displayWeekday = 7; // Sunday
    } else {
      displayWeekday = jsWeekday; // Monday=1, Tuesday=2, etc.
    }
    
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

  // Group sessions by class number
  const groupSessionsByClass = (sessions) => {
    const grouped = {};
    sessions.forEach(session => {
      const key = `${session.code}-${session.classNo}`;
      if (!grouped[key]) {
        grouped[key] = {
          code: session.code,
          classNo: session.classNo,
          title: session.title,
          isCombined: session.isCombined,
          originalClassNo: session.originalClassNo,
          sessions: []
        };
      }
      grouped[key].sessions.push(session);
    });
    return Object.values(grouped);
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
                  {searchResults.map(course => {
                    // Group sessions by class number
                    const groupedClasses = groupSessionsByClass(course.sessions);
                    
                    return (
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
                        
                        {/* Available Classes for this course */}
                        {groupedClasses.length > 0 ? (
                          <div className="course-classes">
                            <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                              Available classes:
                            </Text>
                            {groupedClasses.map((classGroup, index) => {
                              const classId = `${classGroup.code}-${classGroup.classNo}`;
                              const isClassSelected = selectedSessions.some(s => s.id.startsWith(classId));
                              
                              return (
                                <div 
                                  key={index}
                                  className={`class-group ${isClassSelected ? 'selected' : ''}`}
                                  style={{
                                    padding: '12px',
                                    marginBottom: '8px',
                                    borderRadius: '6px',
                                    border: '1px solid #f0f0f0',
                                    backgroundColor: isClassSelected ? '#f6ffed' : '#fafafa',
                                    cursor: isClassSelected ? 'default' : 'pointer',
                                    transition: 'all 0.3s',
                                    opacity: isClassSelected ? 0.8 : 1
                                  }}
                                  onClick={() => !isClassSelected && handleAddClass(course, classGroup.classNo)}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div>
                                      <div style={{ display: 'inline-block', marginRight: 8, marginBottom: 8 }}>
                                        {formatClassNoDisplay(classGroup.classNo, classGroup.originalClassNo, classGroup.isCombined)}
                                      </div>
                                      {classGroup.isCombined && (
                                        <div style={{ 
                                          fontSize: '11px', 
                                          color: '#722ed1',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          marginLeft: 8
                                        }}>
                                          <TeamOutlined style={{ marginRight: 4, fontSize: '10px' }} />
                                          Combined with: {classGroup.originalClassNo.split('+').filter(cn => cn !== classGroup.classNo).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      {isClassSelected ? (
                                        <Tag color="success" style={{ fontSize: '11px' }}>Added</Tag>
                                      ) : (
                                        <Button 
                                          type="primary" 
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddClass(course, classGroup.classNo);
                                          }}
                                        >
                                          Add Class
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* List all sessions for this class */}
                                  <div className="class-sessions">
                                    {classGroup.sessions.map((session, sessionIndex) => (
                                      <div 
                                        key={sessionIndex}
                                        style={{
                                          padding: '6px 8px',
                                          marginBottom: '4px',
                                          borderRadius: '4px',
                                          backgroundColor: 'white',
                                          border: '1px solid #e8e8e8'
                                        }}
                                      >
                                        <Space size="small">
                                          <ClockCircleOutlined style={{ fontSize: '12px' }} />
                                          <Text style={{ fontSize: '12px' }}>
                                            {getDayString(session.weekday)} {session.startTime}-{session.endTime}
                                          </Text>
                                          <EnvironmentOutlined style={{ fontSize: '12px', color: '#666', marginLeft: 8 }} />
                                          <Text style={{ fontSize: '12px' }}>{session.room}</Text>
                                        </Space>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Empty 
                            description="No classes available"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            style={{ padding: 20 }}
                          />
                        )}
                      </Card>
                    );
                  })}
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
                    {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''}
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
                {(() => {
                  // Group selected sessions by class
                  const groupedClasses = groupSessionsByClass(selectedSessions);
                  
                  return (
                    <List
                      size="small"
                      dataSource={groupedClasses}
                      renderItem={classGroup => (
                        <List.Item
                          actions={[
                            <Button 
                              type="text" 
                              danger 
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => handleRemoveClass(`${classGroup.code}-${classGroup.classNo}`)}
                            >
                              Remove Class
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
                                  backgroundColor: getColorForCourse(classGroup.code),
                                  marginTop: 6,
                                  ...(classGroup.isCombined && {
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
                                  {classGroup.code} {classGroup.classNo} - {classGroup.title}
                                </Text>
                                {classGroup.isCombined && (
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
                              <div>
                                <Space wrap style={{ marginBottom: 4 }}>
                                  {classGroup.sessions.map((session, index) => (
                                    <Tag 
                                      key={index}
                                      icon={<ClockCircleOutlined />} 
                                      size="small"
                                      color={classGroup.isCombined ? 'purple' : 'blue'}
                                    >
                                      {session.day} {session.time} @ {session.room}
                                    </Tag>
                                  ))}
                                </Space>
                                {classGroup.isCombined && (
                                  <Tag 
                                    size="small" 
                                    color="purple"
                                    style={{ fontSize: '10px' }}
                                  >
                                    Combined: {classGroup.originalClassNo}
                                  </Tag>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  );
                })()}
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
