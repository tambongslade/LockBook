import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Assuming using services/api.js

const AdminLogbookHistory = () => {
  const [historyEntries, setHistoryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        console.log("[AdminLogbookHistory] Fetching global logbook history...");
        // Use the admin endpoint
        const response = await api.get('/admin/logbooks/history'); 
        setHistoryEntries(response.data || []);
        console.log(`[AdminLogbookHistory] Fetched ${response.data?.length || 0} total history entries.`);
      } catch (err) {
        console.error("Error fetching global logbook history:", err.response || err);
        setError(err.response?.data?.message || 'Failed to load global logbook history.');
        setHistoryEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []); // Fetch only once on mount

  // Helper functions (formatReviewer, formatDate, getStatusColor) can be reused 
  // from TeacherLogbookHistory or moved to a utils file
  const formatReviewer = (entry) => {
    if (!entry.reviewedBy) return 'N/A';
    return `${entry.reviewedBy.firstName || ''} ${entry.reviewedBy.lastName || ''}`.trim();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Needs Correction':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pending Review':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
      case 'Postponed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Global Logbook History</h1>

      {loading && <p className="text-center text-gray-500">Loading history...</p>}
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded text-center">{error}</div>}
      
      {!loading && !error && historyEntries.length === 0 && (
        <p className="text-center text-gray-500">No logbook entries found in the system.</p>
      )}

      {!loading && !error && historyEntries.length > 0 && (
        <div className="overflow-x-auto bg-white shadow-md rounded">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delegate</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delegate Remarks</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Comments</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed By</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {historyEntries.map((entry) => (
                <tr key={entry._id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(entry.createdAt)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{entry.course?.title || 'N/A'} ({entry.course?.code || 'N/A'})</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{entry.delegate?.firstName || ''} {entry.delegate?.lastName || ''}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-pre-wrap">{entry.remarks || '-'}</td> {/* Delegate remarks */}
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-pre-wrap">{entry.teacherComments || '-'}</td> {/* Teacher comments */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatReviewer(entry)}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(entry.reviewTimestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLogbookHistory; 