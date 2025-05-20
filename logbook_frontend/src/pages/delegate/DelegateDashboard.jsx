import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

const getCurrentDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const DelegateDashboard = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  const fetchTodaySchedule = async () => {
    console.log('[DelegateDashboard] fetchTodaySchedule function called.');
    try {
      const response = await api.get('/delegate/dashboard/today');
      setSchedule(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch today\'s schedule');
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Today's Schedule ({getCurrentDayName()})</h1>
      
      {/* Table for Medium screens and up */} 
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hall</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedule.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-4 text-gray-500">No schedule found for today.</td></tr>
            ) : (
                schedule.map((entry) => {
                    const dayOfWeek = getCurrentDayName();
                    const timeSlot = entry.timeSlot;
                    const courseId = entry.course?._id;
                    
                    console.log(`[DelegateDashboard] Entry Data:`, {
                        entryId: entry._id,
                        timeSlot: entry.timeSlot,
                        courseId: courseId,
                        calculatedDay: dayOfWeek
                    });

                    const canSubmit = courseId && dayOfWeek && timeSlot;
                    
                    const linkTo = canSubmit ? `/delegate/logbook/entry/${courseId}/${dayOfWeek}/${timeSlot}` : '#';
                    console.log(`[DelegateDashboard] Rendering Link for Entry ${entry._id}: to="${linkTo}"`);

                    return (
                        <tr key={entry._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {entry.timeSlot || 'N/A'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {entry.course?.code || 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {entry.course?.name || 'No Name'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                    {entry.teacher ? `${entry.teacher.firstName || ''} ${entry.teacher.lastName || ''}`.trim() : 'N/A'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                    {entry.hall?.name || 'N/A'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                {canSubmit ? (
                                    <Link to={linkTo} className="text-indigo-600 hover:text-indigo-900">Submit Logbook</Link>
                                ) : (
                                    <span className="text-gray-400">Cannot Submit</span>
                                )}
                            </td>
                        </tr>
                    );
                })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Cards for Small screens */} 
      <div className="md:hidden space-y-4">
        {schedule.length === 0 ? (
          <div className="text-center py-4 text-gray-500 bg-white shadow-md rounded-lg">No schedule found for today.</div>
        ) : (
          schedule.map((entry) => {
            const dayOfWeek = getCurrentDayName();
            const timeSlot = entry.timeSlot;
            const courseId = entry.course?._id;
            const canSubmit = courseId && dayOfWeek && timeSlot;
            const linkTo = canSubmit ? `/delegate/logbook/entry/${courseId}/${dayOfWeek}/${timeSlot}` : '#';

            return (
              <div key={entry._id} className="bg-white shadow-md rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg text-gray-900">{entry.timeSlot || 'N/A'}</span>
                   {/* Action Button - moved up */} 
                   <div className="text-sm font-medium">
                    {canSubmit ? (
                        <Link to={linkTo} className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-3 py-1 rounded-md">Submit Logbook</Link>
                    ) : (
                        <span className="text-gray-400 italic">Info missing</span>
                    )}
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-sm font-medium text-gray-800">{entry.course?.code || 'N/A'} - {entry.course?.name || 'No Name'}</p>
                </div>
                 <div className="mb-1">
                  <p className="text-sm text-gray-600">Teacher: {entry.teacher ? `${entry.teacher.firstName || ''} ${entry.teacher.lastName || ''}`.trim() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hall: {entry.hall?.name || 'N/A'}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default DelegateDashboard; 