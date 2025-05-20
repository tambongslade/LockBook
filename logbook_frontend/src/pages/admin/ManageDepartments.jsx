import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';

// Simple Modal Component (assumes you have one, or use a library)
const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900">
          &times;
        </button>
        <div className="mt-3">
          {children}
        </div>
      </div>
    </div>
  );
};

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null); // null for Add, object for Edit
  const [departmentName, setDepartmentName] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch departments
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error("Error fetching departments:", err.response || err);
      setError('Failed to fetch departments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Modal Handlers
  const openModal = (department = null) => {
    setFormError('');
    if (department) {
      setEditingDepartment(department);
      setDepartmentName(department.name);
    } else {
      setEditingDepartment(null);
      setDepartmentName('');
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
    setDepartmentName('');
    setFormError('');
  };

  // Form Submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!departmentName.trim()) {
      setFormError('Department name cannot be empty.');
      return;
    }

    const departmentData = { name: departmentName.trim() };

    try {
      if (editingDepartment) {
        // Update
        await api.put(`/admin/departments/${editingDepartment._id}`, departmentData);
      } else {
        // Create
        await api.post('/admin/departments', departmentData);
      }
      fetchDepartments(); // Refresh list
      closeModal();
    } catch (err) {
      console.error("Department submit error:", err.response || err);
      setFormError(err.response?.data?.message || 'Operation failed. Please try again.');
    }
  };

  // Delete Handler
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This might affect associated courses or users.')) return;
    setError('');
    try {
      await api.delete(`/admin/departments/${id}`);
      fetchDepartments(); // Refresh list
    } catch (err) {
      console.error("Delete department error:", err.response || err);
      setError(err.response?.data?.message || 'Failed to delete department.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Departments</h1>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <FaPlus className="mr-2" /> Add Department
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading departments...</div>
        ) : departments.length === 0 ? (
           <div className="p-6 text-center text-gray-500">No departments found. Add one!</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Name</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((dept) => (
                <tr key={dept._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => openModal(dept)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit Department"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(dept._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Department"
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {editingDepartment ? 'Edit Department' : 'Add New Department'}
          </h3>
          {formError && <div className="mb-4 p-2 bg-red-100 text-red-600 text-sm rounded">{formError}</div>}
          
          <div>
            <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700">Department Name:</label>
            <input 
              type="text"
              id="departmentName"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {editingDepartment ? 'Save Changes' : 'Add Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageDepartments; 