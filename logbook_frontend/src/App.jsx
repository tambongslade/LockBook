import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCourses from './pages/admin/ManageCourses';
import ManageTimetable from './pages/admin/ManageTimetable';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageDelegates from './pages/admin/ManageDelegates';
import DelegateDashboard from './pages/delegate/DelegateDashboard';
import TeacherReviewPage from './pages/teacher/TeacherReviewPage';
import ReviewDetailPage from './pages/teacher/ReviewDetailPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AdminProgressReport from './pages/admin/AdminProgressReport';
import TeacherCourseDetailPage from './pages/teacher/TeacherCourseDetailPage';
import TeacherLogbookHistory from './pages/teacher/TeacherLogbookHistory';
import AdminLogbookHistory from './pages/admin/AdminLogbookHistory';
import LogbookEntryForm from './pages/delegate/LogbookEntryForm';
import DelegateLogHistory from './pages/delegate/DelegateLogHistory';
import DelegateCorrectionsPage from './pages/delegate/DelegateCorrectionsPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute adminOnly>
                <DashboardLayout>
                  <Routes>
                    <Route path="users" element={<ManageUsers />} />
                    <Route path="courses" element={<ManageCourses />} />
                    <Route path="progress" element={<AdminProgressReport />} />
                    <Route path="timetable" element={<ManageTimetable />} />
                    <Route path="departments" element={<ManageDepartments />} />
                    <Route path="delegates" element={<ManageDelegates />} />
                    <Route path="logbook-history" element={<AdminLogbookHistory />} />
                    <Route index element={<Navigate to="users" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute teacherOnly>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<TeacherDashboard />} />
                    <Route path="reviews" element={<TeacherReviewPage />} />
                    <Route path="review/:entryId" element={<ReviewDetailPage />} />
                    <Route path="course/:courseId" element={<TeacherCourseDetailPage />} />
                    <Route path="history" element={<TeacherLogbookHistory />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Delegate Routes - Changed from /student to /delegate */}
          <Route
            path="/delegate/*"
            element={
              <ProtectedRoute delegateOnly>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<DelegateDashboard />} />
                    <Route 
                      path="logbook/entry/:courseId/:dayOfWeek/:timeSlot" 
                      element={<LogbookEntryForm />} 
                    />
                    <Route 
                      path="logbook/edit/:entryId" 
                      element={<LogbookEntryForm isEditing={true} />}
                    />
                    <Route path="corrections" element={<DelegateCorrectionsPage />} />
                    <Route path="history" element={<DelegateLogHistory />} />
                    <Route index element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
