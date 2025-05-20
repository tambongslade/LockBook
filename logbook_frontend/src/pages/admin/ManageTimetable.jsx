import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api/axios';
import { FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import AsyncSelect from 'react-select/async';

// Reusable Modal Component
const Modal = ({ children, isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="relative mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {children}
        </div>
      </div>
    </div>
  );
};

// Constants for Grid Structure (TUE-SAT)
const DAYS_OF_WEEK = ['TUE', 'WED', 'THU', 'FRI', 'SAT'];
const TIME_SLOTS = [
    '07:00-09:00',
    '09:00-11:00',
    '11:00-13:00',
    '13:00-15:00',
    '15:00-17:00',
    '17:00-19:00'
];

const ManageTimetable = () => {
  // Data states
  const [scheduleEntries, setScheduleEntries] = useState([]);
  const [courses, setCourses] = useState([]);
  const [halls, setHalls] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('1st');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [modalTarget, setModalTarget] = useState({ day: null, timeSlot: null });
  const [formError, setFormError] = useState('');
  const [modalFormData, setModalFormData] = useState({});
  const [selectedTeacherOption, setSelectedTeacherOption] = useState(null);

  // Fetch initial data
  const fetchData = useCallback(async (semester) => {
    setLoading(true);
    setError('');
    try {
      const [entriesRes, coursesRes, hallsRes] = await Promise.all([
        api.get(`/admin/schedule?semester=${semester}`),
        api.get('/admin/courses'),
        api.get('/admin/halls'),
      ]);
      setScheduleEntries(entriesRes.data);
      setCourses(coursesRes.data || []);
      setHalls(hallsRes.data || []);
    } catch (err) {
      console.error("Fetch timetable data error:", err);
      setError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
      setScheduleEntries([]); setCourses([]); setHalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedSemester);
  }, [selectedSemester, fetchData]);

  // Process fetched entries into a grid structure
  const gridData = useMemo(() => {
    const grid = {};
    DAYS_OF_WEEK.forEach(day => {
      grid[day] = {};
      TIME_SLOTS.forEach(slot => {
        grid[day][slot] = []; // Initialize each cell with an empty array
      });
    });

    scheduleEntries.forEach(entry => {
      // Ensure entry.day and entry.timeSlot are valid keys for the grid
      if (grid[entry.day] && grid[entry.day][entry.timeSlot]) {
         grid[entry.day][entry.timeSlot].push(entry);
       } else {
         // Log if an entry doesn't fit the expected grid structure
         console.warn(`Entry with day "${entry.day}" and time "${entry.timeSlot}" doesn't fit grid structure.`);
      }
    });
    return grid;
  }, [scheduleEntries]);

  // --- Teacher Autocomplete Function ---
  const loadTeachers = async (inputValue) => {
    console.log("Loading teachers for input:", inputValue);
    try {
      console.log(`[loadTeachers] Attempting API call: GET /admin/users?role=TEACHER&search=${inputValue}`);
      const response = await api.get('/admin/users', {
        params: {
          role: 'TEACHER',
          search: inputValue
        }
      });
      // Map response to { value: id, label: name } format for react-select
      const options = response.data.map(teacher => ({
        value: teacher._id,
        label: `${teacher.firstName} ${teacher.lastName} (${teacher.email})`
      }));
      console.log("Teacher options loaded:", options);
      return options;
    } catch (error) {
      console.error('Failed to load teachers:', error);
      return []; // Return empty array on error
    }
  };

  // --- Modal and Form Handlers (Updated openModal) ---
  const openModal = (entry = null, day = null, timeSlot = null) => {
    setFormError('');
    setSelectedTeacherOption(null);
    if (entry) {
      setEditingEntry({
        ...entry,
        course: entry.course?._id || '',
        hall: entry.hall?._id || '',
        teacher: entry.teacher?._id || ''
      });
      if(entry.teacher) {
          setSelectedTeacherOption({
              value: entry.teacher._id,
              label: `${entry.teacher.firstName} ${entry.teacher.lastName} (${entry.teacher.email})`
          });
      }
      setModalTarget({ day: entry.day, timeSlot: entry.timeSlot });
    } else if (day && timeSlot) {
      setEditingEntry(null);
      setModalTarget({ day, timeSlot });
    } else {
        console.error("Cannot open modal without target entry or cell");
        return;
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
     setIsModalOpen(false);
    setEditingEntry(null);
    setModalTarget({ day: null, timeSlot: null });
    setFormError('');
    setModalFormData({});
    setSelectedTeacherOption(null);
  };

  // When modal opens, initialize its form data
  useEffect(() => {
    if (isModalOpen) {
      const initialData = editingEntry 
        ? {
            _id: editingEntry._id,
            semester: editingEntry.semester || selectedSemester,
            course: editingEntry.course || '',
            day: editingEntry.day || modalTarget.day,
            timeSlot: editingEntry.timeSlot || modalTarget.timeSlot,
            hall: editingEntry.hall || '',
            teacher: editingEntry.teacher || ''
          }
        : {
            semester: selectedSemester,
            course: courses.length > 0 ? courses[0]._id : '',
            day: modalTarget.day,
            timeSlot: modalTarget.timeSlot,
            hall: halls.length > 0 ? halls[0]._id : '',
            teacher: ''
          };
      setModalFormData(initialData);
      
      if (editingEntry?.teacher) {
        if (editingEntry.teacher.firstName) { 
             setSelectedTeacherOption({
                value: editingEntry.teacher._id,
                label: `${editingEntry.teacher.firstName} ${editingEntry.teacher.lastName} (${editingEntry.teacher.email})`
            });
        } else {
            console.warn("Editing entry doesn't have full teacher details populated for AsyncSelect default value.");
        }
      }
    }
  }, [isModalOpen, editingEntry, modalTarget, selectedSemester, courses, halls]);

  const handleModalInputChange = (e) => {
    const { name, value } = e.target;
    setModalFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTeacherSelectChange = (selectedOption) => {
    setSelectedTeacherOption(selectedOption);
    setModalFormData(prev => ({ 
      ...prev, 
      teacher: selectedOption ? selectedOption.value : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const entryData = { ...modalFormData };

    if (!entryData.course || !entryData.day || !entryData.timeSlot || !entryData.hall) {
      setFormError('Please fill in all required fields (Course, Day, Time Slot, Hall).');
      return;
    }

    if (entryData.teacher === '') entryData.teacher = null;

    try {
      if (entryData._id) {
        const response = await api.put(`/admin/schedule/${entryData._id}`, entryData);
        const index = scheduleEntries.findIndex(item => item._id === entryData._id);
        if (index !== -1) {
            const updatedEntries = [...scheduleEntries];
            updatedEntries[index] = response.data; 
            setScheduleEntries(updatedEntries);
        } else {
             fetchData(selectedSemester);
        }
      } else {
        const response = await api.post('/admin/schedule', entryData);
        setScheduleEntries([...scheduleEntries, response.data]);
      }
      closeModal();
    } catch (err) {
      console.error("Form submission error:", err.response);
      setFormError(`Operation failed: ${err.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this schedule entry?')) return;
    setError('');
    try {
      await api.delete(`/admin/schedule/${entryId}`);
      setScheduleEntries(scheduleEntries.filter(entry => entry._id !== entryId));
    } catch (err) {
      console.error("Delete entry error:", err.response);
      setError(`Failed to delete entry: ${err.response?.data?.message || err.message}`);
    }
  };

  // --- Render Logic ---
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Timetable</h1>

      {/* Semester Selector */}
      <div className="mb-4 flex space-x-2 border-b">
        <button
          onClick={() => setSelectedSemester('1st')}
          className={`py-2 px-4 text-sm font-medium ${selectedSemester === '1st' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >1st Semester</button>
        <button
           onClick={() => setSelectedSemester('2nd')}
           className={`py-2 px-4 text-sm font-medium ${selectedSemester === '2nd' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >2nd Semester</button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Timetable Grid */} 
      <div className="bg-white shadow-md rounded-lg overflow-x-auto"> 
        {loading ? (
           <div className="p-6 text-center text-gray-500">Loading schedule...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 w-28 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">Time</th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300 min-w-[180px]">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {TIME_SLOTS.map(slot => (
                <tr key={slot} className="divide-x divide-gray-300">
                  <td className="px-2 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300 align-top">{slot}</td>
                  {DAYS_OF_WEEK.map(day => (
                    <td key={day} className="px-2 py-2 whitespace-normal text-xs text-gray-700 border-r border-gray-300 align-top h-28 relative"> {/* Adjusted padding/height AND ADDED relative */}
                      {/* Render existing entries for this cell */} 
                      {gridData[day]?.[slot]?.map(entry => (
                        <div key={entry._id} className="mb-1 p-1 border border-blue-200 rounded bg-blue-50 text-blue-800 relative group text-[11px] leading-tight">
                          <p className="font-semibold truncate">{entry.hall?.name || 'N/A'}</p>
                          <p className="truncate">{entry.course?.code || 'N/A'}</p>
                          <p className="truncate italic">
                             {entry.teacher ? `${entry.teacher.firstName} ${entry.teacher.lastName}` : 'No Teacher'}
                          </p>
                           {/* Edit/Delete Buttons */} 
                           <div className="absolute top-0 right-0 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 rounded-bl">
                             <button 
                                onClick={(e) => { e.stopPropagation(); openModal(entry); }} // Prevent cell click
                                className="text-indigo-600 hover:text-indigo-800 mr-1" 
                                title="Edit">
                                <FaEdit size="0.9em" />
                              </button>
                             <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }} // Prevent cell click
                                className="text-red-600 hover:text-red-800" 
                                title="Delete">
                                <FaTrashAlt size="0.9em"/>
                              </button>
                            </div>
                        </div>
                      ))}
                      {/* Add Button for the cell (always visible at bottom) */} 
                      <button 
                         onClick={() => openModal(null, day, slot)} 
                         className="absolute bottom-1 right-1 p-0.5 text-gray-400 hover:text-green-600" 
                         title="Add new entry to this slot"
                      >
                        <FaPlus size="1.1em"/>
                       </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */} 
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            {editingEntry ? 'Edit' : 'Add'} Schedule Entry for {modalTarget?.day} @ {modalTarget?.timeSlot} ({selectedSemester} Sem)
          </h3>
          {formError && <div className="mb-4 p-2 bg-red-100 text-red-600 text-sm rounded">{formError}</div>}

          {/* Hidden fields for pre-filled data */} 
          <input type="hidden" name="_id" value={modalFormData?._id || ''} />
          <input type="hidden" name="semester" value={modalFormData?.semester || selectedSemester} />
          <input type="hidden" name="day" value={modalFormData?.day || ''} />
          <input type="hidden" name="timeSlot" value={modalFormData?.timeSlot || ''} />

          {/* Course Dropdown */}
          <div>
             <label htmlFor="course" className="block text-sm font-medium text-gray-700">Course:</label>
             <select name="course" id="course" value={modalFormData?.course || ''} onChange={handleModalInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                 <option value="" disabled>Select Course</option>
                 {courses.map(c => (
                   <option key={c._id} value={c._id}>{c.code} - {c.title}</option>
                 ))}
             </select>
           </div>
           
           {/* Hall Dropdown */}
           <div>
             <label htmlFor="hall" className="block text-sm font-medium text-gray-700">Hall:</label>
             <select name="hall" id="hall" value={modalFormData?.hall || ''} onChange={handleModalInputChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                 <option value="" disabled>Select Hall</option>
                 {halls.map(h => (
                   <option key={h._id} value={h._id}>{h.name}</option>
                 ))}
             </select>
           </div>

           {/* Teacher Dropdown (Optional) */}
           <div>
             <label htmlFor="teacher" className="block text-sm font-medium text-gray-700">Teacher (Optional):</label>
             <AsyncSelect
               id="teacher"
               name="teacher"
               cacheOptions
               loadOptions={loadTeachers}
               value={selectedTeacherOption}
               onChange={handleTeacherSelectChange}
               isClearable
               placeholder="Type to search teachers..."
               className="mt-1"
               classNamePrefix="react-select"
               styles={{
                   control: (provided) => ({
                       ...provided,
                       borderColor: '#D1D5DB',
                       borderRadius: '0.375rem',
                       minHeight: '38px', 
                       boxShadow: 'none', 
                       '&:hover': {
                           borderColor: '#D1D5DB'
                       }
                   }),
                   input: (provided) => ({
                       ...provided,
                       margin: '0px', 
                       padding: '0px',
                   }),
                   valueContainer: (provided) => ({
                       ...provided,
                       padding: '0 6px'
                   }),
                   indicatorsContainer: (provided) => ({
                      ...provided,
                      height: '38px'
                   })
               }}
             />
           </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {editingEntry ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageTimetable;