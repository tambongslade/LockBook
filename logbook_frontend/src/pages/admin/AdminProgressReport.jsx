import React, { useState, useEffect } from 'react';
import { adminGetCoursesWithProgress } from '../../services/api'; // Import the API function
import axios from '../../api/axios'; // <-- Corrected import path

const AdminProgressReport = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false); // <-- Add state for export button
  const [exportError, setExportError] = useState(''); // <-- Add state for export error

  useEffect(() => {
    fetchCourseProgress();
  }, []);

  const fetchCourseProgress = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminGetCoursesWithProgress();
      // Ensure progress data exists, default if not
      const coursesWithDefaults = response.data.map(course => ({
          ...course,
          progress: course.progress || { completed: 0, total: 0, percentage: 0 }
      }));
      setCourses(coursesWithDefaults);
    } catch (err) {
      console.error("Error fetching course progress:", err);
      setError(err.response?.data?.message || 'Failed to load course progress.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get color based on percentage (optional)
  const getProgressBarColor = (percentage) => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // --- Updated handler for export button ---
  const handleExportClick = async () => {
    setExporting(true);
    setExportError('');
    console.log("Attempting to export course progress...");

    try {
      const response = await axios.get('/admin/courses/progress/export', {
        responseType: 'blob', // Important: Expect file data
      });

      // Create a blob URL
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a link element
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from content-disposition header if available, otherwise use default
      let filename = `Course_Progress_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^;"]+)"?/);
          if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1];
          }
      }
      link.setAttribute('download', filename);
      
      // Append link to body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Revoke the blob URL to free up memory
      window.URL.revokeObjectURL(url);
      console.log("Export successful, download triggered.");

    } catch (err) {
      console.error("Error exporting course progress:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to export data.';
      // If the error response is a blob, try to read it as text for a potential JSON error message
      if (err.response?.data instanceof Blob && err.response?.data.type === 'application/json') {
          try {
              const errorJson = JSON.parse(await err.response.data.text());
              setExportError(errorJson.message || errorMsg);
          } catch (parseError) {
              setExportError(errorMsg);
          }
      } else {
          setExportError(errorMsg);
      }
    } finally {
      setExporting(false);
    }
  };
  // --- End updated export handler ---

  if (loading) return <div>Loading course progress...</div>;
  if (error) return <div className="text-red-500 p-4">Error loading report: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Course Progress Report</h1>
        {/* --- Updated Export Button --- */}
        <button
          onClick={handleExportClick}
          className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition duration-150 ease-in-out ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={courses.length === 0 || exporting} // Disable if no courses or already exporting
        >
           {exporting ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z"/></svg>
          )}
          <span>{exporting ? 'Exporting...' : 'Export to Excel'}</span>
        </button>
        {/* --- End Updated Export Button --- */}
      </div>
      {/* Display Export Error */} 
      {exportError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Export Failed: </strong>
          <span className="block sm:inline">{exportError}</span>
        </div>
      )}
      
      {/* Responsive Wrapper */} 
      <div className="bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No courses found.</td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.department?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.level}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {/* Progress Bar */} 
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                       <div 
                         className={`h-2.5 rounded-full ${getProgressBarColor(course.progress.percentage)}`}
                         style={{ width: `${course.progress.percentage}%` }}
                         title={`${course.progress.percentage}%`}
                       ></div>
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {course.progress.percentage}%
                     <span className="text-xs ml-1">({course.progress.completed}/{course.progress.total} topics)</span>
                     {/* Add Link to detailed view later if needed */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProgressReport; 