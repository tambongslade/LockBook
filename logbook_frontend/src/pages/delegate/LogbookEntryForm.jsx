import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseOutlineForDelegate, createDelegateLogbookEntry, getDelegateLogbookEntry, updateDelegateLogbookEntry } from '../../services/api';

const LogbookEntryForm = ({ isEditing = false }) => {
  console.log(`[LogbookEntryForm] Component rendered. ${isEditing ? 'EDIT MODE' : 'CREATE MODE'}`);
  const params = useParams();
  console.log('[LogbookEntryForm] Received params:', params);

  const { courseId: initialCourseId, dayOfWeek: initialDayOfWeek, timeSlot: initialTimeSlot, entryId } = params;
  const navigate = useNavigate();
  const [outline, setOutline] = useState([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [formData, setFormData] = useState({
    status: '',
    remarks: '',
    courseId: initialCourseId || '',
    dayOfWeek: initialDayOfWeek || '',
    timeSlot: initialTimeSlot || ''
  });

  useEffect(() => {
    const initializeForm = async () => {
      setLoading(true);
      setError(null);
      setOutline([]);
      setSelectedSubtopics(new Set());

      let currentCourseId = formData.courseId;
      let currentDayOfWeek = formData.dayOfWeek;
      let currentTimeSlot = formData.timeSlot;
      
      if (isEditing) {
        if (!entryId) {
          setError('Entry ID missing for editing.');
          setLoading(false);
          return;
        }
        try {
          console.log(`[LogbookEntryForm EDIT] Fetching entry: ${entryId}`);
          const entryResponse = await getDelegateLogbookEntry(entryId);
          const entryData = entryResponse.data;
          console.log("[LogbookEntryForm EDIT] Fetched entry data:", entryData);

          if (!entryData || !entryData.course?._id) {
             setError('Failed to load entry data or course details missing.');
             setLoading(false);
             return;
          }
          
          setFormData({
            status: entryData.status || '',
            remarks: entryData.remarks || '',
            courseId: entryData.course._id,
            dayOfWeek: entryData.dayOfWeek,
            timeSlot: entryData.timeSlot
          });
          setSelectedSubtopics(new Set(entryData.coveredSubtopics?.map(st => st._id) || []));
          currentCourseId = entryData.course._id;
          currentDayOfWeek = entryData.dayOfWeek;
          currentTimeSlot = entryData.timeSlot;

        } catch (err) {
          console.error("[LogbookEntryForm EDIT] Error fetching entry:", err);
          setError(err.response?.data?.message || 'Failed to load logbook entry for editing.');
          setLoading(false);
          return;
        }
      } else {
        if (!initialCourseId || !initialDayOfWeek || !initialTimeSlot) {
          setError('Course ID, Day of Week, or Time Slot missing from URL for new entry.');
          setLoading(false);
          return;
        }
        setFormData(prev => ({ 
            ...prev, 
            courseId: initialCourseId, 
            dayOfWeek: initialDayOfWeek,
            timeSlot: initialTimeSlot
        }));
      }
      
      if (currentCourseId) {
        try {
          console.log(`[LogbookEntryForm] Fetching outline for course: ${currentCourseId}`);
          const outlineResponse = await getCourseOutlineForDelegate(currentCourseId);
          setOutline(outlineResponse.data);
          console.log("[LogbookEntryForm] Outline fetched successfully.");
        } catch (err) {
          console.error("[LogbookEntryForm] Error fetching outline:", err);
          setError(err.response?.data?.message || 'Failed to fetch course outline.');
        }
      }
      
      setLoading(false);
    };

    initializeForm();
  }, [isEditing, entryId, initialCourseId, initialDayOfWeek, initialTimeSlot]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    console.log(`Using Day: ${formData.dayOfWeek}, Time: ${formData.timeSlot}`);

    if (!formData.status) {
      setSubmitError('Session Outcome (status) is required.');
      return;
    }
    if (!formData.dayOfWeek || !formData.timeSlot || !formData.courseId) {
      setSubmitError('Course, Day or Time Slot information is missing.');
      return;
    }
    
    const submissionData = {
      courseId: formData.courseId,
      dayOfWeek: formData.dayOfWeek,
      timeSlot: formData.timeSlot,
      status: formData.status,
      remarks: formData.remarks,
      coveredSubtopics: Array.from(selectedSubtopics)
    };

    console.log(`${isEditing ? 'Updating' : 'Submitting'} logbook entry:`, submissionData);

    try {
      let response;
      if (isEditing) {
        response = await updateDelegateLogbookEntry(entryId, submissionData);
        console.log('Update successful:', response.data);
      } else {
        response = await createDelegateLogbookEntry(submissionData);
        console.log('Submission successful:', response.data);
      }
      navigate(isEditing ? '/delegate/history' : '/delegate/dashboard');
    } catch (err) {
      console.error(`[LogbookEntryForm] Error ${isEditing ? 'updating' : 'submitting'} logbook:`, err);
      setSubmitError(err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'submit'} logbook entry.`);
    }
  };

  if (loading && !error) return <div className="p-4 text-center">Loading form...</div>;
  if (error) return <div className="p-4 text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {isEditing ? 'Edit Logbook Entry' : 'Logbook Entry Submission'}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow-md rounded-lg">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Session Outcome*</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="" disabled>Select outcome...</option>
            <option value="Lecture Held">Lecture Held</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Postponed">Postponed</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {outline.length > 0 && (
          <div className="space-y-4 border-t pt-4">
            <h2 className="text-lg font-semibold">Topics Covered</h2>
            {outline.map(module => (
              <div key={module._id} className="pl-2">
                <h3 className="font-semibold text-md mt-2">{module.title}</h3>
                {module.chapters && module.chapters.length > 0 ? (
                  <ul className="space-y-2 ml-4 mt-1">
                    {module.chapters.map(chapter => (
                      <li key={chapter._id} className="pl-2 border-l-2 border-gray-200">
                        <h4 className="font-medium text-sm mb-1">{chapter.title}</h4>
                        {chapter.subtopics && chapter.subtopics.length > 0 ? (
                          <ul className="space-y-1 ml-4">
                            {chapter.subtopics.map(subtopic => (
                              <li key={subtopic._id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`subtopic-${subtopic._id}`}
                                  checked={selectedSubtopics.has(subtopic._id)}
                                  onChange={() => handleSubtopicToggle(subtopic._id)}
                                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                />
                                <label htmlFor={`subtopic-${subtopic._id}`} className="ml-2 text-sm text-gray-700 cursor-pointer">
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
        )}

        <div>
          <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">Content Covered / Summary</label>
          <textarea
            id="remarks"
            name="remarks"
            value={formData.remarks}
            onChange={handleInputChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter topics discussed, activities performed, progress made, any issues, etc."
          />
        </div>

        {submitError && (
          <div className="p-3 bg-red-100 text-red-700 rounded">
            <p>Error: {submitError}</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            Submit Logbook
          </button>
        </div>
      </form>
    </div>
  );
};

export default LogbookEntryForm; 