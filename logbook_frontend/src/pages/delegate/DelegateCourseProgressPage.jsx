import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getCourseOutlineForDelegate, updateDelegateLogbookEntry, getDelegateLogbookEntry } from '../../services/api';
// TODO: Import function to get the specific logbook entry ID to update

const DelegateCourseProgressPage = () => {
  const { courseId, logbookEntryId } = useParams();
  // TODO: We need the specific logbook entry ID for this course/delegate/timeslot
  // const [logbookEntryId, setLogbookEntryId] = useState(null); 
  
  const [outline, setOutline] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState(new Set()); // Use a Set for efficient add/delete
  const [remarks, setRemarks] = useState('');
  const [courseTitle, setCourseTitle] = useState(''); // State for course title
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch Course Outline and Logbook Entry data
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId || !logbookEntryId) {
        setError('Course ID or Logbook Entry ID missing from URL.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      setSuccess(''); // Clear success message on load
      try {
        // Fetch Outline and Logbook Entry in parallel
        const [outlineResponse, entryResponse] = await Promise.all([
          getCourseOutlineForDelegate(courseId),
          getDelegateLogbookEntry(logbookEntryId) 
        ]);
        
        setOutline(outlineResponse.data);
        
        // Pre-populate from fetched logbook entry
        const entryData = entryResponse.data;
        setRemarks(entryData.remarks || '');
        setSelectedSubtopics(new Set(entryData.coveredSubtopics?.map(st => st._id) || [])); // Map to get IDs
        setCourseTitle(entryData.course?.title || 'Course'); // Set course title from entry

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to fetch initial data. Check console.');
        setOutline([]);
        setRemarks('');
        setSelectedSubtopics(new Set());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, logbookEntryId]);

  // Handle checkbox toggle
  const handleSubtopicToggle = (subtopicId) => {
    setSelectedSubtopics(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(subtopicId)) {
        newSelected.delete(subtopicId);
      } else {
        newSelected.add(subtopicId);
      }
      return newSelected;
    });
  };

  // Handle saving progress (updating the logbook entry)
  const handleSaveChanges = async () => {
    if (!logbookEntryId) { 
        // This check might be redundant now but kept for safety
        setError('Cannot save progress: Logbook entry ID is missing.');
        return; 
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updateData = {
        remarks: remarks,
        coveredSubtopics: Array.from(selectedSubtopics) // Convert Set to Array for API
        // Optionally update status here too if needed
      };
      await updateDelegateLogbookEntry(logbookEntryId, updateData);
      setSuccess('Progress saved successfully!');
    } catch (err) {
      console.error('Error saving progress:', err);
      setError(err.response?.data?.message || 'Failed to save progress.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && outline.length === 0) return <div className="p-6 text-center">Loading data...</div>;
  if (error && outline.length === 0) return <div className="p-6 text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{courseTitle} Progress</h1>
      {/* TODO: Display Course Title/Code if available */} 
      
      {success && <div className="mb-4 p-3 bg-green-100 text-green-800 rounded">{success}</div>}

      {outline.length === 0 && !loading && (
        <p>No course outline found for this course.</p>
      )}

      {/* Outline Rendering */} 
      <div className="space-y-4 mb-6">
        {outline.map(module => (
          <div key={module._id} className="p-4 border rounded-md bg-gray-50">
            <h2 className="font-semibold text-lg mb-2">Module: {module.title}</h2>
            {module.chapters && module.chapters.length > 0 ? (
              <ul className="space-y-3 ml-4 border-l-2 border-indigo-100 pl-4">
                {module.chapters.map(chapter => (
                  <li key={chapter._id} className="p-3 border rounded-md bg-white">
                    <h3 className="font-semibold mb-2">Chapter: {chapter.title}</h3>
                    {chapter.subtopics && chapter.subtopics.length > 0 ? (
                      <ul className="space-y-2 ml-4">
                        {chapter.subtopics.map(subtopic => (
                          <li key={subtopic._id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`subtopic-${subtopic._id}`}
                              checked={selectedSubtopics.has(subtopic._id)}
                              onChange={() => handleSubtopicToggle(subtopic._id)}
                              className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out cursor-pointer"
                            />
                            <label htmlFor={`subtopic-${subtopic._id}`} className="text-sm text-gray-700 cursor-pointer">
                              {subtopic.title}
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-xs text-gray-400 italic ml-4">No subtopics.</p>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-400 italic ml-4">No chapters.</p>}
          </div>
        ))}
      </div>

      {/* Remarks/Comments Section */}
      <div className="mb-6">
        <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">Remarks / Comments</label>
        <textarea
          id="remarks"
          rows="4"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
          placeholder="Add any comments about the topics covered or the session..."
        />
      </div>

      {/* Save Button */} 
      <button
        onClick={handleSaveChanges}
        disabled={loading}
        className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Saving...' : 'Save Progress'}
      </button>

    </div>
  );
};

export default DelegateCourseProgressPage; 