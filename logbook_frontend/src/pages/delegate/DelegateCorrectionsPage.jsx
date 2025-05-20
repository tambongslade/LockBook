import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Import the new API function
import { getMyLogbookCorrections } from '../../services/api'; 
import { format } from 'date-fns';

const DelegateCorrectionsPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCorrections();
  }, []);

  const fetchCorrections = async () => {
    setLoading(true);
    setError('');
    try {
      // Call the new API function
      const response = await getMyLogbookCorrections(); 
      // Sort entries by when correction was requested (reviewTimestamp might be null initially? createdAt fallback)
      const sortedEntries = response.data.sort((a, b) => 
          new Date(b.reviewTimestamp || b.createdAt) - new Date(a.reviewTimestamp || a.createdAt)
      );
      setEntries(sortedEntries);
    } catch (err) {
      console.error("Error fetching corrections:", err);
      setError(err.response?.data?.message || 'Failed to fetch corrections.');
    } finally {
      setLoading(false);
    }
  };

  // formatDate and formatSimpleDate helpers remain the same
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP p'); 
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  const formatSimpleDate = (dateString) => {
     try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch (e) {
      return 'Invalid Date';
    }
  }

  if (loading) return <div>Loading corrections...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Logbooks Needing Correction</h1>

      {/* Table for Medium screens and up */} 
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Slot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Remarks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No logbooks require correction.</td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={formatDate(entry.createdAt)}>
                    {formatSimpleDate(entry.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.course?.code || 'N/A'}
                     <div className="text-xs text-gray-500">{entry.course?.title || 'No Title'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                     {entry.dayOfWeek} {entry.timeSlot}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md overflow-hidden text-ellipsis whitespace-nowrap" title={entry.reviewRemarks}>
                     {entry.reviewRemarks || 'No remarks provided.'}
                  </td>
                  {/* Actions Cell - Edit link is always present here */} 
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/delegate/logbook/edit/${entry._id}`} // Link to the edit route
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Cards for Small screens */} 
      <div className="md:hidden space-y-4">
        {entries.length === 0 ? (
            <div className="text-center py-4 text-gray-500 bg-white shadow-md rounded-lg">No logbooks require correction.</div>
        ) : (
            entries.map((entry) => (
                <div key={entry._id} className="bg-white shadow-md rounded-lg p-4 space-y-2">
                    {/* Course and Slot */}
                    <div>
                        <p className="font-semibold text-base text-gray-800">{entry.course?.code || 'N/A'} - {entry.course?.title || 'No Title'}</p>
                        <p className="text-sm text-gray-500">{entry.dayOfWeek} {entry.timeSlot}</p>
                         <p className="text-xs text-gray-400">Submitted: {formatSimpleDate(entry.createdAt)}</p>
                    </div>
                     {/* Teacher Remarks */}
                    <div className="border-t pt-2">
                        <p className="text-sm font-medium text-gray-700">Teacher Remarks:</p>
                        <p className="text-sm text-gray-600 italic">{entry.reviewRemarks || 'No remarks provided.'}</p>
                    </div>
                     {/* Action Button */}
                    <div className="border-t pt-2 text-right">
                        <Link 
                            to={`/delegate/logbook/edit/${entry._id}`} 
                            className="inline-block px-4 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                        >
                            Edit
                        </Link>
                    </div>
                </div>
            ))
        )}
        </div>
    </div>
  );
};

export default DelegateCorrectionsPage; 