import React, { useState } from 'react';
import api from '../../api/axios'; // Adjust path as needed

const Modal = ({ children, isOpen, onClose }) => { // Basic Modal Wrapper (same as above)
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-md shadow-lg rounded-md bg-white">
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

const ChangePasswordModal = ({ userId, onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm the new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    setLoading(true);
    try {
      await api.put(`/admin/users/${userId}/password`, { newPassword });
      setSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      // Optionally close modal after a delay
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error("Change password error:", err.response || err);
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Change Password for User ID: {userId}
        </h3>
        {error && <div className="p-2 bg-red-100 text-red-600 text-sm rounded">{error}</div>}
        {success && <div className="p-2 bg-green-100 text-green-700 text-sm rounded">{success}</div>}

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password:</label>
          <input 
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength="6"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password:</label>
          <input 
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength="6"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal; 