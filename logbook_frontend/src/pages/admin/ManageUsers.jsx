import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
// Import icons
import { FaEdit, FaTrashAlt, FaKey, FaPlus } from 'react-icons/fa';

// Simple Modal Component (can be extracted to its own file later)
const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="relative mx-auto p-5 border w-auto max-w-xl shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          {children}
        </div>
      </div>
    </div>
  );
};

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]); // State for departments

  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce search term by 300ms

  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [updateError, setUpdateError] = useState('');

  // State for Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '', 
    lastName: '',  
    email: '',
    password: '',
    role: 'DELEGATE', 
    department: '',
    level: '' // Add level field
  });
  const [addError, setAddError] = useState('');

  // State for Change Password Modal
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [changingPasswordUser, setChangingPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // Fetch users function - now accepts search term
  const fetchUsers = useCallback(async (search = '') => {
    setLoading(true);
    // Keep main error clear unless fetch fails, modal errors handle specifics
    // setError(''); 
    try {
      const params = {};
      if (search) {
        params.search = search;
      }
      console.log(`Fetching users with params:`, params); // Log fetch params
      const usersResponse = await api.get('/admin/users', { params });
      setUsers(usersResponse.data);
    } catch (err) {
      // Set main error only on fetch failure
      setError(`Failed to fetch users: ${err.response?.data?.message || err.message}`);
      console.error("Fetch users error:", err);
       setUsers([]); // Clear users on error
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies, it's called by effects

  // Fetch initial data (users and departments)
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch departments first or in parallel if users don't depend on them initially
        const departmentsResponse = await api.get('/admin/departments'); 
        setDepartments(departmentsResponse.data);
        if (departmentsResponse.data.length > 0) {
            setNewUser(prev => ({ ...prev, department: departmentsResponse.data[0]._id }));
        }
        // Fetch initial users (without search term)
        await fetchUsers(); 
      } catch (err) {
        // Handle error fetching departments separately if needed
         setError(`Failed to fetch initial data: ${err.response?.data?.message || err.message}`);
         console.error("Initial data fetch error:",err);
      } finally {
        // setLoading(false); // fetchUsers handles its own loading state
      }
    };
    fetchInitialData();
  }, [fetchUsers]); // Depend on fetchUsers

  // Effect to fetch users when debounced search term changes
  useEffect(() => {
    // Don't trigger fetch on initial mount if debouncedSearchTerm is empty 
    // unless you want to fetch all users initially (which is handled above)
    // This effect is specifically for *changes* in the search term
    fetchUsers(debouncedSearchTerm); 
  }, [debouncedSearchTerm, fetchUsers]);

  // --- Edit User Handlers --- 
  const handleEditClick = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role.toUpperCase());
    setUpdateError('');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setSelectedRole('');
    setUpdateError('');
  };

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value); 
  };

  const handleUpdateRole = async () => {
    if (!editingUser || !selectedRole) return;
    setUpdateError('');
    try {
      const response = await api.put(`/admin/users/${editingUser._id}/role`, { role: selectedRole.toUpperCase() });
      setUsers(users.map(user => 
        user._id === editingUser._id ? { ...user, role: response.data.role } : user // Update role in local state
      ));
      handleCloseEditModal();
    } catch (err) {
      setUpdateError(`Failed to update role: ${err.response?.data?.message || err.message}`);
      console.error(err);
    }
  };

  // --- Delete User Handler --- 
  const handleDeleteClick = async (userId) => {
     if (!window.confirm('Are you sure you want to delete this user?')) return;
     setError('');
     try {
       await api.delete(`/admin/users/${userId}`);
       setUsers(users.filter(user => user._id !== userId));
     } catch (err) {
       setError(`Failed to delete user: ${err.response?.data?.message || err.message}`);
       console.error(err);
     }
   };

  // --- Add User Handlers --- 
  const handleAddUserClick = () => {
    setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'DELEGATE', department: departments[0]?._id || '', level: '' });
    setAddError('');
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddError('');
  };

  const handleNewUserInputChange = (event) => {
    const { name, value } = event.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setAddError('');
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password || !newUser.role || !newUser.department) {
      setAddError('All fields are required.');
      return;
    }

    // Add validation for delegate level
    if (newUser.role === 'DELEGATE' && !newUser.level) {
      setAddError('Level is required for delegates.');
      return;
    }

    const dataToSend = { ...newUser, role: newUser.role.toUpperCase() };

    try {
      const response = await api.post('/admin/users', dataToSend);
      // Instead of replacing, refetch to ensure sorting/filtering is correct
      fetchUsers(debouncedSearchTerm); // Refresh user list based on current search
      handleCloseAddModal();
    } catch (err) {
      console.error('Add user error response:', err.response); 
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setAddError(`Failed to add user: ${errorMessage}`);
    }
  };

  // --- Change Password Handlers --- 
  const handleChangePasswordClick = (user) => {
    setChangingPasswordUser(user);
    setNewPassword(''); 
    setChangePasswordError('');
    setChangePasswordSuccess(''); 
    setIsChangePasswordModalOpen(true);
  };

  const handleCloseChangePasswordModal = () => {
    setIsChangePasswordModalOpen(false);
    setChangingPasswordUser(null);
    setNewPassword('');
    setChangePasswordError('');
    setChangePasswordSuccess('');
  };

  const handleNewPasswordChange = (event) => {
    setNewPassword(event.target.value);
  };

  const handleSaveChangesPassword = async () => {
    if (!changingPasswordUser || !newPassword) {
      setChangePasswordError('New password cannot be empty.');
      return;
    }
    if (newPassword.length < 6) { // Add length validation
        setChangePasswordError('Password must be at least 6 characters long.');
        return;
    }
    setChangePasswordError('');
    setChangePasswordSuccess('');

    try {
      await api.put(`/admin/users/${changingPasswordUser._id}/password`, { newPassword: newPassword });
      setChangePasswordSuccess('Password updated successfully!');
      setNewPassword(''); 
      setTimeout(() => {
         handleCloseChangePasswordModal();
      }, 1500); 
    } catch (err) {
      console.error('Change password error response:', err.response);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setChangePasswordError(`Failed to change password: ${errorMessage}`);
    }
  };

  // --- Render Logic --- 
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        {/* Search Input */}
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
          />
        </div>
        <button
          onClick={handleAddUserClick}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center w-full sm:w-auto justify-center"
        >
         <FaPlus className="mr-2" /> Add New User
        </button>
      </div>

      {/* Display general fetch error */} 
       {error && !isEditModalOpen && !isAddModalOpen && !isChangePasswordModalOpen && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="bg-white shadow-md rounded-lg overflow-x-auto"> {/* Added overflow-x-auto */}
         {/* Table or Loading/No Results Message */}
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading users...</div>
        ) : !users || users.length === 0 ? (
           <div className="p-6 text-center text-gray-500">
             {searchTerm ? `No users found matching "${searchTerm}".` : 'No users found.'}
           </div>
         ) : (
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Head */}
            <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th> {/* Added Department */}
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                 </tr>
            </thead>
            {/* Table Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department?.name || 'N/A'}</td> {/* Display Department Name */} 
                     {/* Action Buttons */}
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                       <button onClick={() => handleEditClick(user)} className="text-indigo-600 hover:text-indigo-900" title="Edit Role"><FaEdit /></button>
                       <button onClick={() => handleChangePasswordClick(user)} className="text-gray-600 hover:text-gray-900" title="Change Password"><FaKey /></button>
                       <button onClick={() => handleDeleteClick(user._id)} className="text-red-600 hover:text-red-900" title="Delete User"><FaTrashAlt /></button>
                     </td>
                </tr>
              ))}
            </tbody>
          </table>
         )}
      </div>

      {/* Modals */}
      {/* Edit Modal */} 
      {isEditModalOpen && (
         <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
             <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Edit User Role for {editingUser?.email}</h3>
             {updateError && <div className="mb-3 p-2 bg-red-100 text-red-600 text-sm rounded">{updateError}</div>}
             <div className="mb-4">
                 <label htmlFor="role-select" className="block text-sm font-medium text-gray-700">Role:</label>
                 <select
                     id="role-select"
                     value={selectedRole}
                     onChange={handleRoleChange}
                     className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                 >
                     <option value="ADMIN">ADMIN</option>
                     <option value="TEACHER">TEACHER</option>
                     <option value="DELEGATE">DELEGATE</option>
                 </select>
             </div>
             <div className="items-center px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                 <button type="button" onClick={handleUpdateRole} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                     Update Role
                 </button>
                 <button type="button" onClick={handleCloseEditModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                     Cancel
                 </button>
             </div>
         </Modal>
      )}
      {/* Add Modal */} 
      {isAddModalOpen && (
        <Modal isOpen={isAddModalOpen} onClose={handleCloseAddModal}>
             <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New User</h3>
             {addError && <div className="mb-3 p-2 bg-red-100 text-red-600 text-sm rounded">{addError}</div>}
             <form onSubmit={handleCreateUser} className="space-y-4">
                 {/* Input fields for firstName, lastName, email, password, role, department */}
                 <div>
                     <label htmlFor="add-firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                     <input type="text" name="firstName" id="add-firstName" value={newUser.firstName} onChange={handleNewUserInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                 </div>
                 <div>
                     <label htmlFor="add-lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                     <input type="text" name="lastName" id="add-lastName" value={newUser.lastName} onChange={handleNewUserInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                 </div>
                 <div>
                     <label htmlFor="add-email" className="block text-sm font-medium text-gray-700">Email</label>
                     <input type="email" name="email" id="add-email" value={newUser.email} onChange={handleNewUserInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                 </div>
                 <div>
                     <label htmlFor="add-password" className="block text-sm font-medium text-gray-700">Password</label>
                     <input type="password" name="password" id="add-password" value={newUser.password} onChange={handleNewUserInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                 </div>
                 <div>
                     <label htmlFor="add-role" className="block text-sm font-medium text-gray-700">Role</label>
                     <select name="role" id="add-role" value={newUser.role} onChange={handleNewUserInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                         <option value="DELEGATE">DELEGATE</option>
                         <option value="TEACHER">TEACHER</option>
                         <option value="ADMIN">ADMIN</option>
                     </select>
                 </div>

                 {/* Level field for delegates */}
                 {newUser.role === 'DELEGATE' && (
                   <div>
                     <label htmlFor="add-level" className="block text-sm font-medium text-gray-700">Level</label>
                     <select name="level" id="add-level" value={newUser.level} onChange={handleNewUserInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                         <option value="" disabled>Select Level</option>
                         <option value="200">200 Level</option>
                         <option value="300">300 Level</option>
                         <option value="400">400 Level</option>
                         <option value="500">500 Level</option>
                     </select>
                   </div>
                 )}

                 <div>
                     <label htmlFor="add-department" className="block text-sm font-medium text-gray-700">Department</label>
                     <select name="department" id="add-department" value={newUser.department} onChange={handleNewUserInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                         <option value="">-- Select Department --</option>
                         {departments.map(dept => (
                             <option key={dept._id} value={dept._id}>{dept.name}</option>
                         ))}
                     </select>
                 </div>

                 <div className="items-center px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                     <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm">
                         Create User
                     </button>
                     <button type="button" onClick={handleCloseAddModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                         Cancel
                     </button>
                 </div>
             </form>
        </Modal>
      )}
      {/* Change Password Modal */} 
      {isChangePasswordModalOpen && (
         <Modal isOpen={isChangePasswordModalOpen} onClose={handleCloseChangePasswordModal}>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Change Password for {changingPasswordUser?.email}</h3>
              {changePasswordSuccess && <div className="mb-3 p-2 bg-green-100 text-green-700 text-sm rounded">{changePasswordSuccess}</div>}
              {changePasswordError && <div className="mb-3 p-2 bg-red-100 text-red-600 text-sm rounded">{changePasswordError}</div>}
              {!changePasswordSuccess && ( // Hide input/button after success
                <>
                  <div className="mb-4">
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
                      <input
                          type="password"
                          id="new-password"
                          value={newPassword}
                          onChange={handleNewPasswordChange}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                  </div>
                  <div className="items-center px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <button type="button" onClick={handleSaveChangesPassword} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                          Save Password
                      </button>
                      <button type="button" onClick={handleCloseChangePasswordModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm">
                          Cancel
                      </button>
                  </div>
                </>
              )}
         </Modal>
      )}
    </div>
  );
};

export default ManageUsers;
