import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[TeacherDashboard] useEffect triggered.');
    const fetchCourses = async () => {
      console.log('[TeacherDashboard] fetchCourses function entered.');
      setLoading(true);
      setError(null);
      try {
        console.log('[TeacherDashboard] Attempting to fetch /teacher/my-courses...');
        const response = await api.get('/teacher/my-courses');
        console.log('[TeacherDashboard] API call successful, response data:', response.data);
        setCourses(response.data);
      } catch (err) {
        console.error('[TeacherDashboard] Error fetching courses:', err.response || err);
        setError('Failed to fetch courses');
      } finally {
        console.log('[TeacherDashboard] fetchCourses finished, setting loading to false.');
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <div className="p-4">Loading courses...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <Link
          to="/teacher/review"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Review Logbooks
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div
            key={course._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
            <p className="text-gray-600 mb-4">{course.code}</p>
            
            {/* Temporarily removed progress display */}
            {/* <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{course.progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div> */}

            <div className="flex justify-between items-center mt-4">
              <span className={`px-2 py-1 rounded-full text-sm ${
                course.status === 'Active' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {course.status}
              </span>
              <Link
                to={`/teacher/course/${course._id}`}
                className="text-blue-600 hover:text-blue-800"
              >
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherDashboard; 