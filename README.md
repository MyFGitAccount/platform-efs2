# EFS Platform User Guide

**Educational Facilitation System**  
*Last updated: Januarary 15, 2026*

Welcome to **EFS Platform** — a comprehensive educational platform for students to manage their academic life, collaborate with peers, and access learning resources.

---

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Getting Started](#2-getting-started)
  - [2.1 Creating an Account](#21-creating-an-account)
  - [2.2 Logging In](#22-logging-in)
  - [2.3 Logging Out](#23-logging-out)
- [3. Dashboard](#3-dashboard)
- [4. Calendar (Timetable Planner)](#4-calendar-timetable-planner)
- [5. Study Group Formation](#5-study-group-formation)
- [6. Questionnaire Exchange](#6-questionnaire-exchange)
- [7. Learning Materials](#7-learning-materials)
- [8. Course Management](#8-course-management)
  - [8.1 Course Viewer](#81-course-viewer)
  - [8.2 Course Editor (Admin Only)](#82-course-editor-admin-only)
- [9. My Profile](#9-my-profile)
- [10. Admin Features](#10-admin-features)
  - [10.1 Admin Access](#101-admin-access)
  - [10.2 Admin Notifications](#102-admin-notifications)
- [11. Navigation & Layout](#11-navigation--layout)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 1. Introduction

### What is EFS Platform?

EFS Platform is a React-based educational system that provides students with:

- **Interactive timetable planning** with drag-and-drop calendar
- **Study group matching** based on academic profiles
- **Questionnaire exchange system** with credit rewards
- **Centralized learning materials** repository
- **Personal profile management** with academic tracking
- **Admin tools** for course and user management

**Key Concepts**

| Concept | Description |
|---------|-------------|
| **Credits** | Platform currency displayed in Dashboard. Used for questionnaire system. |
| **Student ID (SID)** | Your unique identifier used throughout the platform |
| **Roles** | **Student** (default access) / **Admin** (full system access) |
| **Approval Flow** | New accounts require admin approval via student card photo verification |

---

## 2. Getting Started

### 2.1 Creating an Account

**Two Methods:**

1. **From Login Page:**
   - Click "Need an account? Register"
   - Fill in: Email, Student ID, Password (6+ chars), Confirm Password
   - **Upload Student Card Photo** (required, max 5MB, image files only)
   - Click "Register"

2. **Direct Registration Page (`/register`):**
   - More detailed form with explicit student card upload
   - All fields required except optional contact info
   - Submit → Wait for admin approval email

### 2.2 Logging In

1. Navigate to `/login`
2. Enter:
   - **Email** (not student ID)
   - **Password**
3. Click "Login"
4. Successful login redirects to **Dashboard**

> **Note:** The login form toggles between Login/Register modes. Make sure you're in the correct mode.

### 2.3 Logging Out

1. Click your **avatar/profile picture** in top-right corner
2. Select **Logout** from dropdown menu

---

## 3. Dashboard

**Path:** `/dashboard` or Home page after login

### Features:

- **Welcome Section:** Personalized greeting with your SID, role, and major
- **Credit Display:** Current credit balance with book icon
- **Statistics Cards:**
  - Total Courses (📚)
  - My Group Requests (👥)
  - My Questionnaires (📝)
  - My Materials (📄)
  - Pending Approvals (Admin only - ⚠️)

- **Quick Actions:** Color-coded cards for:
  - Timetable Planner (Blue - 📅)
  - Group Formation (Green - 👥)
  - Questionnaire Exchange (Purple - 📝)
  - Learning Materials (Orange - 📄)
  - Admin Panel (Red - ⚙️ - Admin only)

- **Recent Activities:** Quick links to frequently used features
- **Admin Notifications:** Red alert card when pending approvals exist

---

## 4. Calendar (Timetable Planner)

**Path:** `/calendar`

### Core Features:

#### **Course Search & Selection:**
- Left sidebar with search bar (by course code or name)
- Real-time search results with course details
- Color-coded course identifiers
- Available sessions listed with time, day, and room
- **"Add" button** to include sessions in timetable

#### **Timetable Management:**
- **Interactive Weekly View:** Drag-and-drop interface using FullCalendar
- **Visual Representation:**
  - Color-coded course blocks
  - Course code + class number display
  - Room information
  - Time slots (8:00 AM - 10:00 PM)

#### **Timetable Controls:**
- **Save:** Stores timetable in browser's localStorage
- **Export:** Download timetable as JSON file
- **Import:** Upload previously saved JSON timetable
- **Clear All:** Remove all courses (with confirmation)
- **View Options:** Day/Week/Month views

#### **Session Details:**
- Click any calendar event to see:
  - Course code and title
  - Class number
  - Time and day
  - Room location
- **Remove individual sessions** from selected courses list

#### **Empty State Guidance:**
- Helpful message when no courses added
- Instructions to search and add courses

---

## 5. Study Group Formation

**Path:** `/group-formation`

### Student Workflow:

#### **Browse Requests:**
- Table view of all study group requests
- Columns: Student (with avatar), Major, Description, Contact, Requirements, Actions
- **Search functionality** within table
- **Pagination** for large result sets

#### **Create Your Request:**
1. Click "Create Request" button
2. Fill modal form:
   - **Major** (required)
   - **Description** (optional, max 500 chars)
   - **Desired Groupmates** (optional)
   - **GPA** (optional, 0-4 scale)
   - **DSE Score** (optional)
   - **Contact Email** (pre-filled, required)
   - **Phone** (optional)
3. Submit → Request appears in public list

#### **Send Invitations:**
1. Find suitable student in list
2. Click "Send Invite"
3. Compose invitation message (pre-filled template available)
4. Send → Option to delete request after inviting

#### **Manage Your Requests:**
- **Delete** your own requests with trash icon
- **View full descriptions** by clicking eye icon
- Contact information visible to other students

#### **Student Profiles Include:**
- Avatar with SID initial
- Major tag
- Contact info (email + optional phone)
- Academic requirements (GPA, DSE score)
- Desired groupmate preferences

---

## 6. Questionnaire Exchange

**Path:** `/questionnaire`

### Credit System:
- **Creating Questionnaire:** Costs **1 credit**
- **Filling Questionnaire:** Earns **1 credit**

### Features:

#### **Create Questionnaire:**
1. Click "Create Questionnaire (1 credit)"
2. Fill modal:
   - **Description** (required - e.g., "EAP II Course Survey")
   - **Questionnaire Link** (required - valid URL, Google Forms, etc.)
   - **Target Responses** (default: 30, minimum for EAP II)
3. Submit → 1 credit deducted, questionnaire appears in "My Questionnaires"

#### **My Questionnaires:**
- Separate table showing your created questionnaires
- Shows: Description, Progress, Status, Filled By count
- **Progress bar** showing responses vs. target
- **Status tags:** Active (blue) / Completed (green)

#### **Available Questionnaires:**
- Table of questionnaires you can fill
- Columns: Description, Creator, Progress, Status, Actions
- **Progress visualization** with percentage
- **"Fill" button** to participate (disabled for your own)
- **"Open Link" button** to access external form

#### **Filling Process:**
1. Click "Fill" button on available questionnaire
2. System opens external link in new tab
3. Complete the actual form on external site
4. Return to EFS → Click confirms completion
5. **+1 credit** added to your balance

---

## 7. Learning Materials

**Path:** `/materials`

### For All Students:

#### **Browse Materials:**
- **Search:** By material name, description, or course
- **Table View:**
  - Material name and description
  - Course tag (code + name)
  - Uploaded by user
  - File size (KB/MB)
  - Download count
  - Upload date
  - **Download button**

#### **Download Materials:**
1. Find material in table
2. Click "Download" button in Actions column
3. File downloads automatically
4. Download counter increments

### For Admin Users Only:

#### **Upload Materials:**
1. Click "Upload Material" button (top-right)
2. Fill modal form:
   - **Select Course** from dropdown (searchable)
   - **Material Name** (required)
   - **Description** (optional)
   - **File** (required, max 50MB, any type)
3. Submit → Material appears in list
4. All students can now download

#### **File Handling:**
- **Size Limit:** 5MB per file
- **Preview:** Shows selected file name and size
- **Format:** Any file type accepted
- **Storage:** Files converted to base64 for upload

---

## 8. Course Management

### 8.1 Course Viewer

**Path:** `/courses/:code` (accessible from various links)

#### **Course Details:**
- Course code and title header
- Course description
- **Two-column layout:**

#### **Left Column - Timetable:**
- Table showing all scheduled sessions
- Columns: Day, Time, Room, Class
- Shows all available timetable slots

#### **Right Column - Learning Materials:**
- Table of available materials for this course
- Columns: Name, Size, Uploaded, Actions
- **Download links** for each material
- Empty state if no materials

### 8.2 Course Editor (Admin Only)

**Path:** `/courses/edit/:code`

#### **Editing Features:**
- **Basic Info:** Course code (read-only), title, description
- **Timetable Management:**
  - Add new timetable slots via modal
  - Form: Day (dropdown), Time, Room, Class Number
  - Table view of all slots
  - Delete individual slots
- **Save Changes:** Updates course information

#### **Access Control:**
- **Admin role required**
- Non-admin users redirected to home
- Accessed via admin panel or direct URL

---

## 9. My Profile

**Path:** `/profile`

### Profile Sections:

#### **Profile Summary Card:**
- Large avatar (photo or initials)
- SID and email display
- **Role badge:** Blue (Student) / Red (Admin)
- **Edit/Save button** toggle
- **Credits display** in blue
- **Year of Study display** in green

#### **Editable Information (Form):**
- **Contact:**
  - Email (required, validated)
  - Phone (optional)
- **Academic:**
  - Major (text)
  - Year of Study (number 1-10)
  - GPA (0-4 scale, decimal)
  - DSE Score (text)
- **Skills:**
  - Tags input (comma-separated or Enter to add)
- **About Me:**
  - Text area for personal description

#### **Editing Mode:**
- Click "Edit Profile" to enable editing
- Fields become editable
- "Save Changes" to submit updates
- "Cancel" to discard changes
- Success/error messages on save

---

## 10. Admin Features

### 10.1 Admin Access

#### **Admin Panel Access:**
- Visible in sidebar only for `user.role === 'admin'`
- Quick Action card on Dashboard (red color)
- Direct navigation to `/admin`

#### **Admin Privileges:**
1. **Upload Materials** (Materials page)
2. **Course Editing** (Course Editor)
3. **View Admin Notifications** (Dashboard)
4. **Access Admin Panel** (full system management)

### 10.2 Admin Notifications

#### **Dashboard Alert:**
- Red-bordered card when `pendingApprovals > 0`
- Shows count of pending account requests
- **"Review Now" button** links to Admin Panel
- Only visible to admin users

---

## 11. Navigation & Layout

### Main Layout Components:

#### **Header:**
- Platform title "EFS Platform" with subtitle
- User dropdown in top-right:
  - Avatar (photo or User icon)
  - SID/Name display
  - Role indicator
  - **Profile link**
  - **Logout option**

#### **Sidebar Navigation:**
1. **Dashboard** 📊 (Home)
2. **Calendar** 📅 (Timetable Planner)
3. **Group Formation** 👥
4. **Questionnaire Exchange** 📝
5. **Learning Materials** 📄
6. **Profile** 👤
7. **Admin Panel** ⚙️ (Admin only)

#### **Content Area:**
- Consistent padding and spacing
- Responsive design (mobile-friendly)
- Breadcrumb-style navigation context
- Loading states with spinners
- Error states with retry options

### Responsive Behavior:
- **Mobile:** Stacked columns, hamburger menu (implied)
- **Tablet:** Adjusted column sizes
- **Desktop:** Full sidebar, multi-column layouts

---

## Troubleshooting & FAQ

### Common Issues & Solutions:

| Issue | Solution |
|-------|----------|
| **"Failed to load dashboard" error** | Check backend server is running, refresh page, contact admin |
| **Login fails after registration** | Account may still be pending admin approval (check email) |
| **File upload fails** | Check file size limits (5MB for photos, 5MB for materials) and file type |
| **No courses in calendar search** | Backend may not have course data loaded, contact admin |
| **Questionnaire credit not received** | Ensure you actually completed the external form, refresh page |
| **Timetable not saving** | Check browser localStorage is enabled, try export/import as backup |

### Browser Compatibility:
- **Recommended:** Chrome, Firefox, Edge (latest versions)
- **Required:** Modern browser with JavaScript enabled
- **Storage:** Requires localStorage for timetable saving

### Data Persistence:
- **Timetable:** Saved in browser's localStorage (device-specific)
- **Profile:** Saved in backend database
- **Materials:** Stored on server, accessible from any device
- **Credentials:** Session-based with JWT tokens

### Security Notes:
- **Passwords:** Minimum 6 characters, encrypted in transmission
- **Student Card Photos:** Required for verification, reviewed by admin
- **Role-based Access:** Students cannot access admin features
- **File Uploads:** Scanned for size and type, but not content

### Performance Tips:
- **Large timetables:** Export/import for backup
- **Many materials:** Use search to filter
- **Slow loading:** Check internet connection, backend status
- **Calendar lag:** Reduce number of concurrent courses

---

## Technical Architecture Overview

### Frontend Stack:
- **Framework:** React 18+
- **UI Library:** Ant Design 5.x
- **Routing:** React Router DOM 6.x
- **Calendar:** FullCalendar with React wrapper
- **Icons:** Ant Design Icons
- **State Management:** React Hooks (useState, useEffect)
- **API Communication:** Custom utility with fetch/axios

### Key Dependencies:
- `@ant-design/icons`: UI icons
- `@fullcalendar/react`: Interactive calendar
- `react-router-dom`: Navigation
- `antd`: Component library
- `lodash.debounce`: Search optimization

### Project Structure:
```
src/
├── components/          # Reusable components
│   └── layout/         # Layout components (MainLayout.jsx)
├── pages/              # Page components
│   ├── Dashboard.jsx
│   ├── Calendar.jsx
│   ├── GroupFormation.jsx
│   ├── Questionnaire.jsx
│   ├── Materials.jsx
│   ├── AdminPanel.jsx  # (Implied, not shown in files)
│   ├── Profile.jsx
│   ├── Login.jsx
│   ├── AccountCreate.jsx
│   ├── CourseViewer.jsx
│   └── CourseEditor.jsx
├── utils/              # Utilities
│   └── api.js          # API communication layer
├── App.jsx             # Main app component
└── index.jsx           # Entry point
```

### API Integration Pattern:
1. **Centralized API utility** (`utils/api.js`)
2. **Endpoint-specific functions** (dashboardAPI, materialsAPI, etc.)
3. **Error handling** with user-friendly messages
4. **Loading states** during requests
5. **Authentication** via JWT tokens in localStorage

### State Management Pattern:
- **Local State:** `useState` for component-specific data
- **Effect Hooks:** `useEffect` for data fetching
- **Form State:** Ant Design Form hooks
- **Routing State:** React Router for navigation state
- **User State:** Passed via props from App.jsx

---

## Development Notes

### Code Quality Features:
- **Error Boundaries:** Implied by error state handling
- **Loading States:** Spinners during data fetch
- **Form Validation:** Client-side validation with Ant Design
- **Responsive Design:** Grid system with breakpoints
- **Accessibility:** Semantic HTML, ARIA labels (implied)

### Known Limitations:
1. **Photo Upload:** Only base64 encoding, no chunked uploads
2. **File Size:** Client-side limits only, no server validation
3. **Offline Support:** Limited to localStorage for timetable only
4. **Real-time Updates:** Polling-based, no WebSocket
5. **Browser Support:** Modern browsers only

### Scalability Considerations:
- **Component Reusability:** High - modular page structure
- **State Management:** Could benefit from Context/Redux for larger scale
- **API Optimization:** Could implement caching strategies
- **Bundle Size:** Ant Design adds significant size, consider code splitting

---

**Happy studying with EFS Platform!** 🎓

---
