import React, { useState, useEffect } from 'react';
import api from '../../services/api'; // Assuming using services/api.js

const TeacherLogbookHistory = () => {
  const [historyEntries, setHistoryEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        console.log("[TeacherLogbookHistory] Fetching logbook history...");
        const response = await api.get('/teacher/logbooks/history');
        setHistoryEntries(response.data || []);
        console.log(`[TeacherLogbookHistory] Fetched ${response.data?.length || 0} history entries.`);
      } catch (err) {
        console.error("Error fetching logbook history:", err.response || err);
        setError(err.response?.data?.message || 'Failed to load logbook history.');
        setHistoryEntries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []); // Fetch only once on mount

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
      <h1 className="text-2xl font-bold mb-6 text-center">Logbook History</h1>

      {loading && <p className="text-center text-gray-500">Loading history...</p>}
      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded text-center">{error}</div>}
      
      {!loading && !error && historyEntries.length === 0 && (
        <p className="text-center text-gray-500">No logbook history found for your courses.</p>
      )}

      {!loading && !error && historyEntries.length > 0 && (
        <>
          {/* Table for Medium screens and up */} 
          <div className="hidden md:block overflow-x-auto bg-white shadow-md rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Headers: Submitted, Course, Delegate, Status, Teacher Comments, Reviewed By, Reviewed Date */}
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delegate</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Comments</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed By</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewed Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historyEntries.map((entry) => (
                  <tr key={entry._id}>
                    {/* Table Cells - same data as before */} 
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(entry.createdAt)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{entry.course?.title || 'N/A'} ({entry.course?.code || 'N/A'})</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{entry.delegate?.firstName || ''} {entry.delegate?.lastName || ''}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {/* Use reviewStatus for color/text */} 
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.reviewStatus)}`}>
                        {entry.reviewStatus || 'Pending'}
                      </span>
                       {/* Optionally show delegate status too? */}
                       {/* <p className="text-xs text-gray-400 mt-1">({entry.status})</p> */} 
                    </td>
                     {/* Use reviewRemarks */} 
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-pre-wrap">{entry.reviewRemarks || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatReviewer(entry)}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(entry.reviewTimestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for Small screens */} 
          <div className="md:hidden space-y-4 mt-4"> 
            {historyEntries.map((entry) => (
               <div key={entry._id} className="bg-white shadow-md rounded-lg p-4 space-y-3">
                  {/* Top Row: Course, Status Badge */}
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="font-semibold text-base text-gray-800">{entry.course?.title || 'N/A'} ({entry.course?.code || 'N/A'})</p>
                       <p className="text-sm text-gray-500">Delegate: {entry.delegate?.firstName || ''} {entry.delegate?.lastName || ''}</p>
                       <p className="text-xs text-gray-400">Submitted: {formatDate(entry.createdAt)}</p>
                     </div>
                      <span className={`flex-shrink-0 ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.reviewStatus)}`}>
                        {entry.reviewStatus || 'Pending'}
                      </span>
                   </div>
                   
                    {/* Teacher Remarks */}
                    {(entry.reviewRemarks) && (
                       <div className="border-t pt-2">
                          <p className="text-sm font-medium text-gray-700">Review Remarks:</p>
                          <p className="text-sm text-gray-600 italic">{entry.reviewRemarks}</p>
                       </div>
                    )}
                   
                    {/* Reviewer Info */}
                     {(entry.reviewedBy) && (
                         <div className="border-t pt-2 text-xs text-gray-500">
                             Reviewed by {formatReviewer(entry)} on {formatDate(entry.reviewTimestamp)}
                         </div>
                     )}
               </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherLogbookHistory; 