import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios'; // Verify this path is correct
import { FaEdit, FaTrashAlt, FaPlus, FaKey } from 'react-icons/fa';
import UserFormModal from '../../components/admin/UserFormModal'; // Assuming modal is reusable
import ChangePasswordModal from '../../components/admin/ChangePasswordModal'; // Assuming modal is reusable

const ManageDelegates = () => {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [targetUserIdForPassword, setTargetUserIdForPassword] = useState(null);

  // Fetch Delegates
  const fetchDelegates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch users specifically with the DELEGATE role
      const response = await api.get('/admin/users?role=DELEGATE'); 
      setDelegates(response.data);
    } catch (err) {
      console.error("Error fetching delegates:", err.response || err);
      setError('Failed to fetch delegates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDelegates();
  }, [fetchDelegates]);

  // Modal Handlers
  const openUserModal = (user = null) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const openPasswordModal = (userId) => {
    setTargetUserIdForPassword(userId);
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setTargetUserIdForPassword(null);
  };

  // Delete Handler
  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this delegate?')) return;
    setError('');
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchDelegates(); // Refresh delegate list
    } catch (err) {
      console.error("Delete delegate error:", err.response || err);
      setError(err.response?.data?.message || 'Failed to delete delegate.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Delegates</h1>
        {/* Optional: Add button specifically creates a DELEGATE user */}
        <button
          onClick={() => openUserModal({ role: 'DELEGATE' })} // Pre-set role for add modal
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <FaPlus className="mr-2" /> Add Delegate
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading delegates...</div>
        ) : delegates.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No delegates found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                {/* Role column might be redundant here if all are delegates */}
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th> */}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {delegates.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.level || 'N/A'}</td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td> */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                     {/* Edit button opens general user edit modal */}
                    <button
                      onClick={() => openUserModal(user)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit Delegate Info"
                    >
                      <FaEdit />
                    </button>
                     {/* Password change button */}
                    <button
                      onClick={() => openPasswordModal(user._id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Change Password"
                    >
                      <FaKey />
                    </button>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Delegate"
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

      {/* User Add/Edit Modal */}
      {isUserModalOpen && (
        <UserFormModal 
          user={editingUser} 
          onClose={closeUserModal} 
          onSave={fetchDelegates} // Refresh list on save
          defaultRole="DELEGATE" // Pass default role
        />
      )}

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <ChangePasswordModal 
          userId={targetUserIdForPassword} 
          onClose={closePasswordModal} 
        />
      )}

    </div>
  );
};

export default ManageDelegates; 