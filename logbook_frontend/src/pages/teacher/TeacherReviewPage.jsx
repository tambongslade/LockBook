import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const TeacherReviewPage = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingEntries = async () => {
      try {
        const response = await api.get('/teacher/review/pending');
        setEntries(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch pending entries');
        setLoading(false);
      }
    };

    fetchPendingEntries();
  }, []);

  const handleEntryClick = (entryId) => {
    navigate(`/teacher/review/${entryId}`);
  };

  if (loading) return <div className="p-4">Loading pending entries...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Pending Logbook Reviews</h1>
      
      {entries.length === 0 ? (
        <p className="text-gray-500">No pending entries to review</p>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div
              key={entry._id}
              onClick={() => handleEntryClick(entry._id)}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">{entry.course.title}</h2>
                  <p className="text-gray-600">
                    Delegate: {entry.delegate.firstName} {entry.delegate.lastName}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherReviewPage; 