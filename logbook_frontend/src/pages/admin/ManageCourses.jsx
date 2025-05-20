import { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';

// Reusable Modal Component (Can be moved to components folder)
const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {children}
        </div>
      </div>
    </div>
  );
};

// Define allowed department names for this context
const ALLOWED_DEPARTMENT_NAMES = ['Computer', 'Electrical', 'Chemical', 'Mechanical'];

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formError, setFormError] = useState('');

  const initialCourseState = {
    title: '',
    code: '',
    description: '',
    department: '',
    level: 200,
    status: 'Active'
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesRes, deptsRes] = await Promise.all([
        api.get('/admin/courses'),
        api.get('/admin/departments')
      ]);
      setCourses(coursesRes.data);
      setAllDepartments(deptsRes.data);
    } catch (err) {
      console.error("Fetch data error:", err);
      setError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter departments based on allowed names
  const filteredDepartments = useMemo(() => {
      return allDepartments.filter(dept => ALLOWED_DEPARTMENT_NAMES.includes(dept.name));
  }, [allDepartments]);

  // --- Modal Handlers ---
  const openAddModal = () => {
    const defaultDept = filteredDepartments.length > 0 ? filteredDepartments[0]._id : '';
    setCurrentCourse({ ...initialCourseState, department: defaultDept });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (course) => {
    const courseData = { 
        ...course, 
        department: course.department?._id || course.department,
        level: course.level || 200
    };
    setCurrentCourse(courseData);
    setFormError('');
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setCurrentCourse(null);
    setFormError('');
  };

  // --- Form Handling ---
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setCurrentCourse(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  // --- CRUD Operations ---
  const handleAddCourse = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!currentCourse.department || !currentCourse.level) {
      setFormError('Department and Level are required.');
      return;
    }
    const { _id, ...courseData } = currentCourse;
    try {
      console.log("Adding course:", courseData);
      const response = await api.post('/admin/courses', courseData);
      setCourses([response.data, ...courses]);
      closeModal();
    } catch (err) {
      console.error("Add course error:", err.response);
      setFormError(`Failed to add course: ${err.response?.data?.error || err.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!currentCourse || !currentCourse._id || !currentCourse.department || !currentCourse.level) {
        setFormError('Invalid data. Department and Level are required.');
        return;
    }
    try {
      console.log("Updating course:", currentCourse._id, currentCourse);
      const response = await api.put(`/admin/courses/${currentCourse._id}`, currentCourse);
      setCourses(courses.map(c => c._id === currentCourse._id ? response.data : c));
      closeModal();
    } catch (err) {
      console.error("Update course error:", err.response);
      setFormError(`Failed to update course: ${err.response?.data?.error || err.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    setError('');
    try {
      await api.delete(`/admin/courses/${courseId}`);
      setCourses(courses.filter(c => c._id !== courseId));
    } catch (err) {
      console.error("Delete course error:", err.response);
      setError(`Failed to delete course: ${err.response?.data?.message || err.message}`);
    }
  };

  // --- Render ---
  if (loading) return <div>Loading courses...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Courses</h1>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Add New Course
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.level}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.department?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {course.status}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => openEditModal(course)}
                    className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                    title="Edit Course"
                  >
                    <FaEdit className="mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id)}
                    className="inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Delete Course"
                  >
                    <FaTrashAlt className="mr-1" /> Delete
                  </button>
                </td>
              </tr>
            ))}
             {courses.length === 0 && (
                <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-500">No courses found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Course Modal */}
      <Modal isOpen={isAddModalOpen || isEditModalOpen} onClose={closeModal}>
        <form onSubmit={isEditModalOpen ? handleUpdateCourse : handleAddCourse} className="space-y-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {isEditModalOpen ? 'Edit Course' : 'Add New Course'}
          </h3>
          {formError && <div className="mb-4 p-2 bg-red-100 text-red-600 text-sm rounded">{formError}</div>}

          {/* Form Fields */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title:</label>
            <input type="text" name="title" id="title" value={currentCourse?.title || ''} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">Code:</label>
            <input type="text" name="code" id="code" value={currentCourse?.code || ''} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
            <textarea name="description" id="description" value={currentCourse?.description || ''} onChange={handleInputChange} required rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
          </div>
          <div>
             <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department:</label>
             <select name="department" id="department" value={currentCourse?.department || ''} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                 <option value="" disabled>Select Department</option>
                 {filteredDepartments.map(dept => (
                   <option key={dept._id} value={dept._id}>{dept.name}</option>
                 ))}
             </select>
             {filteredDepartments.length === 0 && !loading && (
                <p className="text-xs text-red-600 mt-1">No allowed departments (Computer, Electrical, Chemical, Mechanical) found. Please add them via backend administration.</p>
             )}
           </div>
           <div>
             <label htmlFor="level" className="block text-sm font-medium text-gray-700">Level:</label>
             <select name="level" id="level" value={currentCourse?.level || 200} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                 <option value={200}>200</option>
                 <option value={300}>300</option>
                 <option value={400}>400</option>
                 <option value={500}>500</option>
                 <option value={600}>600</option>
             </select>
           </div>
           <div>
             <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status:</label>
             <select name="status" id="status" value={currentCourse?.status || 'Active'} onChange={handleInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                 <option value="Active">Active</option>
                 <option value="Inactive">Inactive</option>
             </select>
           </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {isEditModalOpen ? 'Save Changes' : 'Add Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageCourses; 