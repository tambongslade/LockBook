import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyLogbookEntries } from '../../services/api';
import { format } from 'date-fns'; // Using date-fns for formatting

const DelegateLogHistory = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMyLogbookEntries();
      // Sort entries by creation date, newest first
      const sortedEntries = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setEntries(sortedEntries);
    } catch (err) {
      console.error("Error fetching logbook history:", err);
      setError(err.response?.data?.message || 'Failed to fetch logbook history.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPP p'); // e.g., Jun 21, 2023 3:30 PM
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  const formatSimpleDate = (dateString) => {
     try {
      return format(new Date(dateString), 'yyyy-MM-dd'); // e.g., 2023-06-21
    } catch (e) {
      return 'Invalid Date';
    }
  }

  if (loading) return <div>Loading history...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Logbook History</h1>
      
      {/* Table for Medium screens and up */} 
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Headers: Date, Course, Slot, Remarks, Topics, Review Status, Actions */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session Slot</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Covered Topics</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Review Status</th> 
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No logbook entries found.</td> 
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry._id}>
                  {/* Table Cells - same data as before */} 
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={formatDate(entry.createdAt)}>{formatSimpleDate(entry.createdAt)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.course?.code || 'N/A'}
                    <div className="text-xs text-gray-500">{entry.course?.title || 'No Title'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entry.dayOfWeek} {entry.timeSlot}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap" title={entry.remarks}>{entry.remarks || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                      {entry.coveredSubtopics?.length > 0 ? entry.coveredSubtopics.map(st => st.title).join(', ') : 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={entry.reviewRemarks}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                        entry.reviewStatus === 'Approved' ? 'bg-green-100 text-green-800' : 
                        entry.reviewStatus === 'Needs Correction' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {entry.reviewStatus || 'Pending'}
                    </span>
                    {entry.reviewRemarks && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{entry.reviewRemarks}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {entry.reviewStatus === 'Needs Correction' && (
                      <Link to={`/delegate/logbook/edit/${entry._id}`} className="text-indigo-600 hover:text-indigo-900">Edit</Link>
                    )}
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
            <div className="text-center py-4 text-gray-500 bg-white shadow-md rounded-lg">No logbook entries found.</div>
        ) : (
            entries.map((entry) => (
                <div key={entry._id} className="bg-white shadow-md rounded-lg p-4 space-y-3">
                    {/* Top Row: Course, Slot, Review Status Badge */} 
                    <div className="flex justify-between items-start">
                       <div>
                            <p className="font-semibold text-base text-gray-800">{entry.course?.code || 'N/A'} - {entry.course?.title || 'No Title'}</p>
                            <p className="text-sm text-gray-500">{entry.dayOfWeek} {entry.timeSlot}</p>
                             <p className="text-xs text-gray-400">Submitted: {formatSimpleDate(entry.createdAt)}</p>
                       </div>
                       <span 
                          className={`flex-shrink-0 ml-2 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                            entry.reviewStatus === 'Approved' ? 'bg-green-100 text-green-800' : 
                            entry.reviewStatus === 'Needs Correction' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-blue-100 text-blue-800' // Pending
                          }`}
                        >
                          {entry.reviewStatus || 'Pending'}
                        </span>
                    </div>
                    
                    {/* Remarks */}
                    {entry.remarks && (
                        <div className="border-t pt-2">
                            <p className="text-sm font-medium text-gray-700">My Remarks:</p>
                            <p className="text-sm text-gray-600">{entry.remarks}</p>
                        </div>
                    )}
                    
                     {/* Covered Topics */}
                    {(entry.coveredSubtopics?.length > 0) && (
                        <div className="border-t pt-2">
                            <p className="text-sm font-medium text-gray-700">Covered Topics:</p>
                            <p className="text-sm text-gray-600">{entry.coveredSubtopics.map(st => st.title).join(', ')}</p>
                        </div>
                    )}
                    
                    {/* Teacher Remarks & Edit Link */}
                    {(entry.reviewRemarks || entry.reviewStatus === 'Needs Correction') && (
                        <div className="border-t pt-2">
                           {entry.reviewRemarks && (
                               <> 
                                 <p className="text-sm font-medium text-gray-700">Teacher Remarks:</p>
                                 <p className="text-sm text-gray-600 italic mb-2">{entry.reviewRemarks}</p>
                               </>
                           )}
                            {entry.reviewStatus === 'Needs Correction' && (
                                <div className="text-right">
                                    <Link 
                                        to={`/delegate/logbook/edit/${entry._id}`} 
                                        className="inline-block px-4 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                                    >
                                        Edit
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))
        )}
      </div>

    </div>
  );
};

export default DelegateLogHistory; 