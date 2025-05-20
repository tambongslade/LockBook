import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const ReviewDetailPage = () => {
  const { entryId } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEntryDetails = async () => {
      try {
        console.log(`Fetching details for logbook entry ID: ${entryId}`);
        const response = await api.get(`/teacher/logbook/${entryId}`);
        console.log("Fetched entry details:", response.data);
        setEntry(response.data);
        // Pre-fill remarks if editing a previous review (optional)
        // setReviewRemarks(response.data.reviewRemarks || ''); 
        setLoading(false);
      } catch (err) {
        console.error("Error fetching entry details:", err.response || err);
        setError('Failed to fetch entry details');
        setLoading(false);
      }
    };

    fetchEntryDetails();
  }, [entryId]);

  const handleReview = async (status) => {
    setSubmitting(true);
    setError(null); // Clear previous errors
    try {
      console.log(`Submitting review for entry ID: ${entryId} with reviewStatus: ${status}`);
      // Send reviewStatus and reviewRemarks
      await api.put(`/teacher/logbook/${entryId}/review`, { 
        reviewStatus: status, // Send reviewStatus
        reviewRemarks: reviewRemarks // Send reviewRemarks
      });
      console.log("Review submitted successfully.");
      navigate('/teacher/reviews'); 
    } catch (err) {
      console.error("Error submitting review:", err.response || err);
      setError(err.response?.data?.message || 'Failed to submit review');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-4">Loading entry details...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!entry) return <div className="p-4">Entry not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Review Logbook Entry</h1>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{entry.course.title}</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600">Delegate</p>
              <p className="font-medium">
                {entry.delegate.firstName} {entry.delegate.lastName}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Date</p>
              <p className="font-medium">
                {new Date(entry.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Remarks</h3>
            <p className="whitespace-pre-wrap">{entry.remarks}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Attendance Details</h3>
            <p className="whitespace-pre-wrap">{entry.attendanceDetails}</p>
          </div>
          
          {/* --- Add Covered Subtopics Section --- */}
          {entry.coveredSubtopics && entry.coveredSubtopics.length > 0 && (
            <div className="mb-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Covered Subtopics</h3>
              <ul className="list-disc list-inside space-y-1">
                {entry.coveredSubtopics.map(subtopic => (
                  <li key={subtopic._id} className="text-sm text-gray-700">
                    {subtopic.title || 'Subtopic name missing'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* --- End Added Section --- */}

          <div className="mb-6">
            <label htmlFor="reviewRemarks" className="block text-sm font-medium text-gray-700 mb-2">
              Review Remarks (Optional)
            </label>
            <textarea
              id="reviewRemarks"
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              rows={4}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter comments for the delegate (required if requesting correction?)"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => handleReview('Needs Correction')}
              className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              disabled={submitting}
            >
              Request Correction
            </button>
            <button
              onClick={() => handleReview('Approved')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              disabled={submitting}
            >
              Approve Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailPage; 