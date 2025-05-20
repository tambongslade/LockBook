import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios'; // Adjust the path as needed

// Status options a DELEGATE can reasonably report for a session
const delegateStatusOptions = ['Lecture Held', 'Cancelled', 'Postponed', 'Other'];

// Update this array to match the database/model format
const timeSlots = [
    '07:00-09:00',
    '09:00-11:00',
    '11:00-13:00',
    '13:00-15:00',
    '15:00-17:00',
    '17:00-19:00'
];

// Helper to get current day name
const getCurrentDayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
};

// Placeholder course data (can be refined based on actual API response)
const allCourses = [
  { id: 'CS101', name: 'Introduction to Computer Science', department: 'Computer Science', time: '08:00 - 10:00' },
  { id: 'CS202', name: 'Data Structures', department: 'Computer Science', time: '10:00 - 12:00' },
  { id: 'MATH101', name: 'Calculus I', department: 'Mathematics', time: '08:00 - 10:00' },
  { id: 'PHY201', name: 'Modern Physics', department: 'Physics', time: '13:00 - 15:00' },
  { id: 'CS305', name: 'Algorithms', department: 'Computer Science', time: '13:00 - 15:00' },
];

const DelegateDashboard = () => {
  // State for fetching available courses for submission
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [selectedDay, setSelectedDay] = useState(getCurrentDayName());
  const [selectedTime, setSelectedTime] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  // State for submission form - Renamed state for clarity
  const [selectedOutcome, setSelectedOutcome] = useState('Lecture Held'); // Delegate's reported outcome
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // State for displaying submitted entries
  const [submittedEntries, setSubmittedEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true); 
  const [fetchEntriesError, setFetchEntriesError] = useState('');

  // Fetch submitted entries function
  const fetchSubmittedEntries = useCallback(async () => {
    setLoadingEntries(true);
    setFetchEntriesError('');
    try {
      console.log("Fetching submitted entries...");
      const response = await api.get('/delegate/logbooks/my-entries');
      setSubmittedEntries(response.data || []);
      console.log(`Fetched ${response.data?.length || 0} submitted entries.`);
    } catch (err) {
      console.error("Error fetching submitted entries:", err.response || err);
      setFetchEntriesError(err.response?.data?.message || 'Failed to load submitted entries.');
      setSubmittedEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  // Fetch submitted entries on mount
  useEffect(() => {
    fetchSubmittedEntries();
  }, [fetchSubmittedEntries]);

  // Function to fetch available courses (Updated to reset new status state)
  const fetchAvailableCourses = useCallback(async (day, time) => {
    if (!day || !time) {
        setAvailableCourses([]);
        return;
    }
    setLoadingCourses(true);
    setFetchError('');
    setAvailableCourses([]);
    setSelectedCourse('');
    setSelectedOutcome('Lecture Held'); // Reset delegate's selection 
    setRemarks('');
    setSubmitSuccess('');
    setSubmitError('');
    try {
        const response = await api.get('/delegate/courses/by-time', {
            params: { day, time }
        });
        setAvailableCourses(response.data || []);
    } catch (err) {
        console.error("Error fetching available courses:", err.response || err);
        setFetchError(err.response?.data?.message || 'Failed to load courses for the selected time.');
        setAvailableCourses([]);
    } finally {
        setLoadingCourses(false);
    }
  }, []);

  // Handle time selection change
  const handleTimeChange = (event) => {
    const time = event.target.value;
    setSelectedTime(time);
    fetchAvailableCourses(selectedDay, time);
  };

  // Handle course selection change (Updated to reset new status state)
  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setSubmitSuccess(''); 
    setSubmitError('');
    setSelectedOutcome('Lecture Held'); // Reset delegate's selection
    setRemarks('');
  };

  // Handle session outcome dropdown change
  const handleOutcomeChange = (event) => {
    setSelectedOutcome(event.target.value);
  };

  // Handle logbook submission (Updated)
  const handleLogbookSubmit = async (event) => {
    event.preventDefault();
    // Validation uses selectedOutcome
    if (!selectedDay || !selectedTime || !selectedCourse || !selectedOutcome || !remarks) { 
        setSubmitError("Please ensure day, time, course, session outcome, and content summary are selected/filled.");
        return;
    }
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    const submissionData = {
        courseId: selectedCourse,
        dayOfWeek: selectedDay,
        timeSlot: selectedTime,
        status: 'Pending Review', // Always submit as Pending Review
        // Prepend the selected outcome to the remarks
        remarks: `Delegate reported: ${selectedOutcome}\n\n${remarks}` 
    };

    try {
        const response = await api.post('/delegate/logbooks', submissionData);
        setSubmitSuccess(response.data.message || 'Logbook entry submitted successfully!');
        // Reset form
        setSelectedCourse('');
        setSelectedOutcome('Lecture Held'); // Reset dropdown
        setRemarks('');
        setSelectedTime(''); 
        setAvailableCourses([]); 
        setTimeout(() => setSubmitSuccess(''), 3000);
        fetchSubmittedEntries(); // Refresh the list
    } catch (err) {
        console.error("Error submitting logbook entry:", err.response || err);
        const errorMsg = err.response?.data?.message || 'Failed to submit logbook entry.';
        setSubmitError(errorMsg);
    } finally {
        setSubmitting(false);
    }
  };

  // TODO: Add Day Selector UI if needed
  // const handleDayChange = (event) => { ... setSelectedDay ... fetchAvailableCourses ... }

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-6 md:space-y-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">Delegate Logbook Submission</h1>

      {/* Submission Section */}
      <div className="bg-white shadow-md rounded p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Submit Logbook for {selectedDay}</h2>

        {/* Display general errors for fetching courses */}
        {fetchError && !loadingCourses && <div className="p-2 mb-4 bg-red-100 text-red-600 text-sm rounded">{fetchError}</div>}

        <form onSubmit={handleLogbookSubmit} className="space-y-4">
           {/* Time Selection */}
           <div>
             <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-1">Select Time Slot:</label>
             <select
               id="timeSlot"
               value={selectedTime}
               onChange={handleTimeChange}
               disabled={loadingCourses || submitting}
               className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
             >
               <option value="">-- Select a Time --</option>
               {timeSlots.map(slot => (
                 <option key={slot} value={slot}>{slot}</option>
               ))}
             </select>
           </div>

           {/* Available Courses for Selected Time */}
           {selectedTime && (
             <div>
               <label htmlFor="courseSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Course:</label>
               {loadingCourses && <p className="text-sm text-gray-500 mt-1">Loading courses...</p>}
               {!loadingCourses && !fetchError && availableCourses.length > 0 && (
                  <select
                    id="courseSelect"
                    value={selectedCourse}
                    onChange={handleCourseChange}
                    required
                    disabled={submitting}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                  >
                    <option value="">-- Select a Course --</option>
                    {availableCourses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.title} ({course.code}) - {course.department?.name || 'N/A'}
                      </option>
                    ))}
                  </select>
               )}
                {!loadingCourses && !fetchError && availableCourses.length === 0 && selectedTime && (
                   <p className="text-sm text-gray-500 mt-1">No courses found for {selectedDay} at {selectedTime}.</p>
                )}
                {!loadingCourses && fetchError && (
                   <p className="text-sm text-red-500 mt-1">{fetchError}</p>
                )}
             </div>
           )}

           {/* Status and Content Covered - Show only when a course is selected */}
           {selectedCourse && (
               <>
                   {/* Status Selection (Delegate's reported outcome) */}
                   <div>
                       <label htmlFor="outcomeSelect" className="block text-sm font-medium text-gray-700 mb-1">Session Outcome:</label> 
                       <select
                           id="outcomeSelect"
                           value={selectedOutcome} // Use new state
                           onChange={handleOutcomeChange} // Use new handler
                           required
                           disabled={submitting}
                           className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                       >
                           {/* Use delegate specific options */}
                           {delegateStatusOptions.map(opt => (
                               <option key={opt} value={opt}>{opt}</option>
                           ))}
                       </select>
                   </div>

                   {/* Content Covered Input */}
                   <div>
                       <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-1">Content Covered / Summary:</label> 
                       <textarea
                           id="remarks"
                           value={remarks}
                           onChange={(e) => setRemarks(e.target.value)}
                           rows="4" // Slightly larger text area might be helpful
                           required 
                           disabled={submitting}
                           className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                           placeholder="Enter topics discussed, activities performed, progress made, etc."
                       />
                   </div>

                   {/* Submission Feedback */} 
                   {submitSuccess && <div className="p-2 my-2 bg-green-100 text-green-700 text-sm rounded">{submitSuccess}</div>}
                   {submitError && <div className="p-2 my-2 bg-red-100 text-red-600 text-sm rounded">{submitError}</div>}

                   {/* Submission Button */}
                   <div className="pt-4 border-t mt-4 flex justify-end">
                       <button
                           type="submit"
                           // Updated disabled check
                           disabled={submitting || loadingCourses || !selectedCourse || !selectedOutcome || !remarks} 
                           // Make button full width on small screens, auto on medium+
                           className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           {submitting ? 'Submitting...' : 'Submit Logbook'}
                       </button>
                   </div>
               </>
           )}

        </form>
      </div>

      {/* Submitted Entries Section */}
      <div className="bg-white shadow-md rounded p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">My Submitted Logbooks</h2>
        {loadingEntries && <p className="text-gray-500">Loading submitted entries...</p>}
        {fetchEntriesError && <div className="p-2 mb-4 bg-red-100 text-red-600 text-sm rounded">{fetchEntriesError}</div>}
        {!loadingEntries && !fetchEntriesError && submittedEntries.length === 0 && (
            <p className="text-gray-500">You haven't submitted any logbook entries yet.</p>
        )}
        {!loadingEntries && !fetchEntriesError && submittedEntries.length > 0 && (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {submittedEntries.map((entry) => (
                            <tr key={entry._id}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(entry.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{entry.dayOfWeek}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{entry.timeSlot}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {entry.course ? `${entry.course.title} (${entry.course.code})` : 'N/A'}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entry.status === 'Cancelled' || entry.status === 'Absent' ? 'bg-red-100 text-red-800' : entry.status === 'Present' || entry.status === 'Lecture Held' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {entry.status}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500 whitespace-pre-wrap">{entry.remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default DelegateDashboard; 