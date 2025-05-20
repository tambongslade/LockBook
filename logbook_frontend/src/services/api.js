import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      console.log("[services/api Interceptor] Found authToken, adding header.");
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("[services/api Interceptor] No authToken found in localStorage.");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      console.error("[services/api Interceptor] Received 401, removed authToken.");
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = (credentials) => api.post('/auth/login', credentials);
export const register = (userData) => api.post('/auth/register', userData);

// User endpoints
export const getUsers = () => api.get('/admin/users');
export const updateUser = (id, userData) => api.put(`/admin/users/${id}`, userData);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

// Course endpoints
export const getCourses = () => api.get('/courses');
export const getCourseModules = (courseId) => api.get(`/courses/${courseId}/modules`);
export const createCourse = (courseData) => api.post('/courses', courseData);
export const updateCourse = (id, courseData) => api.put(`/courses/${id}`, courseData);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);

// Logbook endpoints (Mixed - Need separation?)
export const getLogbookEntries = () => api.get('/logbook'); // General or Admin?
export const getLogbookEntry = (id) => api.get(`/logbook/${id}`); // General or Admin?

// --- Specific Delegate Logbook Creation ---
// Renamed to be specific and using correct delegate endpoint
export const createDelegateLogbookEntry = (entryData) => api.post('/delegate/logbook/new', entryData);
// --- End Specific Delegate Logbook Creation ---

// --- Generic/Admin Logbook Updates (If needed) ---
export const updateLogbookEntry = (id, entryData) => api.put(`/logbook/${id}`, entryData);
export const deleteLogbookEntry = (id) => api.delete(`/logbook/${id}`);
// --- End Generic/Admin ---

// Review endpoints
export const getPendingReviews = () => api.get('/reviews/pending');
export const submitReview = (id, reviewData) => api.post(`/reviews/${id}`, reviewData);

// --- Course Outline Endpoints ---

// Get full outline for a course
export const getCourseOutline = (courseId) => api.get(`/teacher/outline/course/${courseId}`);

// Create Module
export const createModule = (moduleData) => api.post('/teacher/outline/modules', moduleData); // { courseId, title, description, order }

// Create Chapter
export const createChapter = (chapterData) => api.post('/teacher/outline/chapters', chapterData); // { moduleId, title, description, order }

// Create Subtopic
export const createSubtopic = (subtopicData) => api.post('/teacher/outline/subtopics', subtopicData); // { chapterId, title, description, order }

// Update Module
export const updateModule = (moduleId, moduleData) => api.patch(`/teacher/outline/modules/${moduleId}`, moduleData); // { title, description, order }

// Update Chapter
export const updateChapter = (chapterId, chapterData) => api.patch(`/teacher/outline/chapters/${chapterId}`, chapterData); // { title, description, order }

// Update Subtopic
export const updateSubtopic = (subtopicId, subtopicData) => api.patch(`/teacher/outline/subtopics/${subtopicId}`, subtopicData); // { title, description, order }

// Toggle Subtopic Completion
export const toggleSubtopicCompletion = (subtopicId) => api.patch(`/teacher/outline/subtopics/${subtopicId}/toggle`);

// Delete Module
export const deleteModule = (moduleId) => api.delete(`/teacher/outline/modules/${moduleId}`);

// Delete Chapter
export const deleteChapter = (chapterId) => api.delete(`/teacher/outline/chapters/${chapterId}`);

// Delete Subtopic
export const deleteSubtopic = (subtopicId) => api.delete(`/teacher/outline/subtopics/${subtopicId}`);

// --- Delegate Endpoints ---
// Note: Some might overlap with general or teacher endpoints but use delegate routes/controllers

// Get courses for delegate based on time (already likely exists if used elsewhere)
// export const getDelegateCoursesByTime = (day, time) => api.get(`/delegate/courses/by-time?day=${day}&time=${time}`);

// Get Delegate's Logbook Entries (Uncommented and renamed)
export const getMyLogbookEntries = () => api.get('/delegate/logbooks/my-entries');

// Get Delegate's Logbook Entries Needing Correction
export const getMyLogbookCorrections = () => api.get('/delegate/logbooks/corrections');

// Get Course Outline (for Delegate)
export const getCourseOutlineForDelegate = (courseId) => api.get(`/delegate/outline/course/${courseId}`);

// Get a specific Logbook Entry by ID (for Delegate)
export const getDelegateLogbookEntry = (entryId) => api.get(`/delegate/logbooks/${entryId}`);

// Update Delegate's Logbook Entry (e.g., add covered subtopics/remarks)
export const updateDelegateLogbookEntry = (entryId, updateData) => api.put(`/delegate/logbooks/${entryId}`, updateData);

// --- Admin Endpoints ---
// (Assuming some admin-specific functions might live here too)
export const adminGetAllUsers = () => api.get('/admin/users'); 
export const adminUpdateUser = (userId, data) => api.put(`/admin/users/${userId}`, data);
export const adminDeleteUser = (userId) => api.delete(`/admin/users/${userId}`);

export const adminGetCourses = () => api.get('/admin/courses'); // Example
export const adminGetDepartments = () => api.get('/admin/departments'); // Example
export const adminGetDelegates = () => api.get('/admin/delegates'); // Example
export const adminGetTimetable = () => api.get('/admin/timetable'); // Example
export const adminGetAllLogbookHistory = () => api.get('/admin/logbook-history'); // Example

// --- ADD Admin Progress Report Endpoint ---
export const adminGetCoursesWithProgress = () => api.get('/admin/courses/progress');
// --- END ---

export default api; 