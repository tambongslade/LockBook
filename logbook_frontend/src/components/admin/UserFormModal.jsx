import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Adjust path as needed

const Modal = ({ children, isOpen, onClose }) => { // Basic Modal Wrapper
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold">
          &times;
        </button>
        <div className="mt-3">
          {children}
        </div>
      </div>
    </div>
  );
};

const UserFormModal = ({ user, onClose, onSave, defaultRole = 'DELEGATE' }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: defaultRole,
    department: '',
    password: '' // Only for adding new users
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!user?._id;

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/admin/departments'); // Assuming endpoint exists
        setDepartments(response.data);
        if (response.data.length > 0 && !isEditing) {
          // Set default department for new users if not editing
          setFormData(prev => ({ ...prev, department: response.data[0]._id }));
        }
      } catch (err) {
        console.error("Failed to fetch departments for modal", err);
        // Handle error appropriately, maybe show a message
      }
    };
    fetchDepartments();
  }, [isEditing]); // Only refetch departments on mount essentially

  // Populate form if editing
  useEffect(() => {
    if (isEditing) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || defaultRole,
        department: user.department?._id || user.department || (departments.length > 0 ? departments[0]._id : ''),
        password: '' // Don't prefill password for editing
      });
    } else {
      // Reset for adding, ensuring defaultRole and potential default department are set
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: defaultRole,
        department: departments.length > 0 ? departments[0]._id : '',
        password: ''
      });
    }
  }, [user, isEditing, defaultRole, departments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const userData = { ...formData };
    // Don't send empty password field when editing
    if (isEditing) {
      delete userData.password; 
    } else if (!userData.password) {
      // Password is required for new users
       setError('Password is required for new users.');
       setLoading(false);
       return;
    }

    if (!userData.department) {
      setError('Please select a department.');
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/admin/users/${user._id}`, userData);
      } else {
        await api.post('/admin/users', userData);
      }
      onSave(); // Callback to refresh the user list
      onClose(); // Close the modal
    } catch (err) {
      console.error("User form submission error:", err.response || err);
      setError(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          {isEditing ? 'Edit User' : 'Add New User'}
        </h3>
        {error && <div className="mb-4 p-2 bg-red-100 text-red-600 text-sm rounded">{error}</div>}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name:</label>
            <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} required className="mt-1 form-input" />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name:</label>
            <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} required className="mt-1 form-input" />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 form-input" />
        </div>

        {!isEditing && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password:</label>
            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditing} className="mt-1 form-input" placeholder="Required for new user" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role:</label>
            <select name="role" id="role" value={formData.role} onChange={handleChange} required className="mt-1 form-select">
              <option value="DELEGATE">Delegate</option>
              <option value="TEACHER">Teacher</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department:</label>
            <select name="department" id="department" value={formData.department} onChange={handleChange} required className="mt-1 form-select">
              <option value="" disabled>Select Department</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add User')}
          </button>
        </div>
      </form>
      <style>{`
        .form-input, .form-select {
          display: block;
          width: 100%;
          border-radius: 0.375rem; /* rounded-md */
          border: 1px solid #D1D5DB; /* border-gray-300 */
          padding: 0.5rem 0.75rem; /* py-2 px-3 */
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
        }
        .form-input:focus, .form-select:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-color: #4F46E5; /* focus:border-indigo-500 */
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.5); /* focus:ring-indigo-500 with opacity */
        }
      `}</style>
    </Modal>
  );
};

export default UserFormModal; 