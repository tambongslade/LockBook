import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios'; // Ensure this points to your configured axios instance
import { getCourseOutline } from '../../services/api';
import { toggleSubtopicCompletion } from '../../services/api';
import { createModule } from '../../services/api';
import { createChapter } from '../../services/api';
import { createSubtopic } from '../../services/api';
import { updateModule } from '../../services/api';
import { updateChapter } from '../../services/api';
import { updateSubtopic } from '../../services/api';
import { deleteSubtopic } from '../../services/api';
import { deleteChapter } from '../../services/api';
import { deleteModule } from '../../services/api';

const TeacherCourseDetailPage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [outline, setOutline] = useState([]); // State for the full outline
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for Add Module Form
  const [showAddModuleForm, setShowAddModuleForm] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');

  // State for Add Chapter Form
  const [showAddChapterFormForModule, setShowAddChapterFormForModule] = useState(null); // Store Module ID or null
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDescription, setNewChapterDescription] = useState('');

  // State for Add Subtopic Form
  const [showAddSubtopicFormForChapter, setShowAddSubtopicFormForChapter] = useState(null); // Store Chapter ID or null
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');
  
  // State for Edit Module Form
  const [editingModuleId, setEditingModuleId] = useState(null); // Track which module is being edited
  const [editModuleTitle, setEditModuleTitle] = useState('');
  const [editModuleDescription, setEditModuleDescription] = useState('');
  // Note: We might need editModuleOrder later if reordering is implemented

  // State for Edit Chapter Form
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterDescription, setEditChapterDescription] = useState('');

  // State for Edit Subtopic Form
  const [editingSubtopicId, setEditingSubtopicId] = useState(null);
  const [editSubtopicTitle, setEditSubtopicTitle] = useState('');
  // Subtopics currently don't have descriptions in the model, but could be added

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      setError('');
      console.log(`[TeacherCourseDetail] Fetching data for course ID: ${courseId}`);
      try {
        // Fetch the full course outline
        const outlineResponse = await getCourseOutline(courseId);
        console.log('[TeacherCourseDetail] Fetched outline:', outlineResponse.data);
        setOutline(outlineResponse.data); // Set the full outline structure

        // If course details weren't fetched separately, maybe extract from the first module?
        // This is not ideal, best to have a dedicated course info endpoint/call
        if (outlineResponse.data.length > 0 && !course) {
             // Attempt to get course info if not already set - NEEDS a proper source
             console.warn("[TeacherCourseDetail] Course details not fetched separately, trying to infer.");
             // This might require adjusting models/endpoints if course details aren't readily available
        }


      } catch (err) {
        console.error('[TeacherCourseDetail] Error fetching course data:', err.response || err);
        setError(err.response?.data?.message || 'Failed to fetch course data. Check console for details.');
        setCourse(null); // Clear course state on error
        setOutline([]); // Clear outline state on error
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]); // Rerun effect if courseId changes

  // Separate useEffect for fetching basic course details might be cleaner
  useEffect(() => {
    const fetchBasicDetails = async () => {
        if (!courseId) return;
        try {
             // Assuming the old endpoint `/teacher/courses/:courseId/details` might still work for basic info
             // Or create/use a dedicated endpoint like `/courses/:courseId`
             const response = await api.get(`/teacher/courses/${courseId}/details`); // Reuse old call for now
             setCourse(response.data.course); // Only set the course part
        } catch (err) {
             console.error('[TeacherCourseDetail] Error fetching basic course details:', err.response || err);
             // Handle error specifically for basic details if needed
             setError(prev => prev || (err.response?.data?.message || 'Failed to fetch basic course details.'));
        }
    };
    fetchBasicDetails();
  }, [courseId]);

  // Handler for toggling subtopic completion
  const handleToggleSubtopic = async (subtopicId) => {
    console.log(`[TeacherCourseDetail] Toggling subtopic: ${subtopicId}`);
    // Consider adding temporary loading state for the specific subtopic if needed
    try {
      // Call the API to toggle the status
      await toggleSubtopicCompletion(subtopicId);
      
      // Refetch the entire outline to get updated statuses (including parent module)
      // This is simpler than updating the nested state manually and ensures consistency
      const outlineResponse = await getCourseOutline(courseId);
      setOutline(outlineResponse.data);
      
      // Optional: Add a success notification
      console.log(`[TeacherCourseDetail] Successfully toggled subtopic ${subtopicId} and refreshed outline.`);

    } catch (err) {
      console.error('[TeacherCourseDetail] Error toggling subtopic:', err.response || err);
      setError(err.response?.data?.message || 'Failed to update subtopic status. Please try again.');
      // Optional: Add an error notification to the user
    }
  };

  // Handler for submitting the Add Module form
  const handleAddModuleSubmit = async (e) => {
    e.preventDefault();
    if (!newModuleTitle) {
      setError('Module title is required.'); // Basic validation
      return;
    }
    
    const moduleData = {
      courseId: courseId,
      title: newModuleTitle,
      description: newModuleDescription,
      order: outline.length // Simple order based on current length
    };
    
    console.log("[TeacherCourseDetail] Creating module:", moduleData);
    // Consider adding specific loading state for this action
    try {
      await createModule(moduleData);
      // Clear form and hide
      setNewModuleTitle('');
      setNewModuleDescription('');
      setShowAddModuleForm(false);
      setError(''); // Clear previous errors
      
      // Refetch outline
      const outlineResponse = await getCourseOutline(courseId);
      setOutline(outlineResponse.data);
      
      console.log("[TeacherCourseDetail] Module created successfully, outline refreshed.");
      // Optional: Success notification
      
    } catch (err) {
      console.error('[TeacherCourseDetail] Error creating module:', err.response || err);
      setError(err.response?.data?.message || 'Failed to create module.');
      // Optional: Error notification
    }
  };

  // Handler for showing the Add Chapter form for a specific module
  const handleShowAddChapterForm = (moduleId) => {
    setShowAddChapterFormForModule(moduleId);
    setNewChapterTitle(''); // Clear previous input
    setNewChapterDescription('');
    setError(''); // Clear previous errors
  };
  
  // Handler for submitting the Add Chapter form
  const handleAddChapterSubmit = async (e, moduleId, currentChapters) => {
    e.preventDefault();
    if (!newChapterTitle) {
        setError('Chapter title is required.');
        return;
    }

    const chapterData = {
        moduleId: moduleId,
        title: newChapterTitle,
        description: newChapterDescription,
        order: currentChapters ? currentChapters.length : 0 // Simple order based on length
    };

    console.log("[TeacherCourseDetail] Creating chapter:", chapterData);
    try {
        await createChapter(chapterData);
        // Clear form and hide
        setShowAddChapterFormForModule(null);
        setError('');

        // Refetch outline
        const outlineResponse = await getCourseOutline(courseId);
        setOutline(outlineResponse.data);

        console.log("[TeacherCourseDetail] Chapter created successfully, outline refreshed.");

    } catch (err) {
        console.error('[TeacherCourseDetail] Error creating chapter:', err.response || err);
        setError(err.response?.data?.message || 'Failed to create chapter.');
    }
  };

  // Handler for showing the Add Subtopic form for a specific chapter
  const handleShowAddSubtopicForm = (chapterId) => {
    setShowAddSubtopicFormForChapter(chapterId);
    setNewSubtopicTitle(''); // Clear previous input
    setError(''); // Clear previous errors
  };

  // Handler for submitting the Add Subtopic form
  const handleAddSubtopicSubmit = async (e, chapterId, currentSubtopics) => {
    e.preventDefault();
    if (!newSubtopicTitle) {
      setError('Subtopic title is required.');
      return;
    }

    const subtopicData = {
      chapterId: chapterId,
      title: newSubtopicTitle,
      order: currentSubtopics ? currentSubtopics.length : 0 // Simple order based on length
    };

    console.log("[TeacherCourseDetail] Creating subtopic:", subtopicData);
    try {
      await createSubtopic(subtopicData);
      // Clear form and hide
      setShowAddSubtopicFormForChapter(null);
      setError('');

      // Refetch outline
      const outlineResponse = await getCourseOutline(courseId);
      setOutline(outlineResponse.data);

      console.log("[TeacherCourseDetail] Subtopic created successfully, outline refreshed.");

    } catch (err) {
      console.error('[TeacherCourseDetail] Error creating subtopic:', err.response || err);
      setError(err.response?.data?.message || 'Failed to create subtopic.');
    }
  };

  // --- Edit Handlers ---

  // Handler to show edit form for a module
  const handleShowEditModuleForm = (module) => {
    setEditingModuleId(module._id);
    setEditModuleTitle(module.title);
    setEditModuleDescription(module.description);
    setError(''); // Clear any previous errors
  };

  // Handler to submit module edits
  const handleUpdateModuleSubmit = async (e) => {
    e.preventDefault();
    if (!editingModuleId || !editModuleTitle) {
        setError('Module title is required for update.');
        return;
    }

    const moduleData = {
        title: editModuleTitle,
        description: editModuleDescription,
        // order: editModuleOrder // Include if order editing is added
    };

    console.log(`[TeacherCourseDetail] Updating module ${editingModuleId}:`, moduleData);
    try {
        await updateModule(editingModuleId, moduleData);
        // Clear editing state and hide form
        setEditingModuleId(null);
        setError('');

        // Refetch outline
        const outlineResponse = await getCourseOutline(courseId);
        setOutline(outlineResponse.data);

        console.log("[TeacherCourseDetail] Module updated successfully, outline refreshed.");

    } catch (err) {
        console.error('[TeacherCourseDetail] Error updating module:', err.response || err);
        setError(err.response?.data?.message || 'Failed to update module.');
    }
  };

  // Handler to show edit form for a chapter
  const handleShowEditChapterForm = (chapter) => {
    setEditingChapterId(chapter._id);
    setEditChapterTitle(chapter.title);
    setEditChapterDescription(chapter.description);
    setError(''); // Clear errors
  };

  // Handler to submit chapter edits
  const handleUpdateChapterSubmit = async (e) => {
    e.preventDefault();
    if (!editingChapterId || !editChapterTitle) {
        setError('Chapter title is required for update.');
        return;
    }

    const chapterData = {
        title: editChapterTitle,
        description: editChapterDescription,
        // order: editChapterOrder // If added
    };

    console.log(`[TeacherCourseDetail] Updating chapter ${editingChapterId}:`, chapterData);
    try {
        await updateChapter(editingChapterId, chapterData);
        // Clear editing state and hide form
        setEditingChapterId(null);
        setError('');

        // Refetch outline
        const outlineResponse = await getCourseOutline(courseId);
        setOutline(outlineResponse.data);

        console.log("[TeacherCourseDetail] Chapter updated successfully, outline refreshed.");

    } catch (err) {
        console.error('[TeacherCourseDetail] Error updating chapter:', err.response || err);
        setError(err.response?.data?.message || 'Failed to update chapter.');
    }
  };

  // Handler to show edit form for a subtopic
  const handleShowEditSubtopicForm = (subtopic) => {
    setEditingSubtopicId(subtopic._id);
    setEditSubtopicTitle(subtopic.title);
    setError(''); // Clear errors
  };

  // Handler to submit subtopic edits
  const handleUpdateSubtopicSubmit = async (e) => {
    e.preventDefault();
    if (!editingSubtopicId || !editSubtopicTitle) {
        setError('Subtopic title is required for update.');
        return;
    }

    const subtopicData = {
        title: editSubtopicTitle,
        // description: editSubtopicDescription, // If added
        // order: editSubtopicOrder // If added
    };

    console.log(`[TeacherCourseDetail] Updating subtopic ${editingSubtopicId}:`, subtopicData);
    try {
        await updateSubtopic(editingSubtopicId, subtopicData);
        // Clear editing state and hide form
        setEditingSubtopicId(null);
        setError('');

        // Refetch outline
        const outlineResponse = await getCourseOutline(courseId);
        setOutline(outlineResponse.data);

        console.log("[TeacherCourseDetail] Subtopic updated successfully, outline refreshed.");

    } catch (err) {
        console.error('[TeacherCourseDetail] Error updating subtopic:', err.response || err);
        setError(err.response?.data?.message || 'Failed to update subtopic.');
    }
  };

  // --- Delete Handlers ---

  const handleDeleteSubtopic = async (subtopicId, subtopicTitle) => {
    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete the subtopic: "${subtopicTitle}"?`)) {
      return;
    }

    console.log(`[TeacherCourseDetail] Deleting subtopic ${subtopicId}`);
    try {
      await deleteSubtopic(subtopicId);
      
      // Refetch outline
      const outlineResponse = await getCourseOutline(courseId);
      setOutline(outlineResponse.data);
      
      setError(''); // Clear any previous errors
      console.log("[TeacherCourseDetail] Subtopic deleted successfully, outline refreshed.");
      // Optional: Success notification

    } catch (err) {
      console.error('[TeacherCourseDetail] Error deleting subtopic:', err.response || err);
      setError(err.response?.data?.message || 'Failed to delete subtopic.');
      // Optional: Error notification
    }
  };

  const handleDeleteChapter = async (chapterId, chapterTitle) => {
    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete the chapter: "${chapterTitle}"? This will also delete all its subtopics.`)) {
      return;
    }

    console.log(`[TeacherCourseDetail] Deleting chapter ${chapterId}`);
    try {
      await deleteChapter(chapterId);
      
      // Refetch outline
      const outlineResponse = await getCourseOutline(courseId);
      setOutline(outlineResponse.data);
      
      setError(''); // Clear any previous errors
      console.log("[TeacherCourseDetail] Chapter deleted successfully, outline refreshed.");
      // Optional: Success notification

    } catch (err) {
      console.error('[TeacherCourseDetail] Error deleting chapter:', err.response || err);
      setError(err.response?.data?.message || 'Failed to delete chapter.');
      // Optional: Error notification
    }
  };

  const handleDeleteModule = async (moduleId, moduleTitle) => {
    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete the module: "${moduleTitle}"? This will also delete all its chapters and subtopics.`)) {
      return;
    }

    console.log(`[TeacherCourseDetail] Deleting module ${moduleId}`);
    try {
      await deleteModule(moduleId);
      
      // Refetch outline
      const outlineResponse = await getCourseOutline(courseId);
      setOutline(outlineResponse.data);
      
      setError(''); // Clear any previous errors
      console.log("[TeacherCourseDetail] Module deleted successfully, outline refreshed.");
      // Optional: Success notification

    } catch (err) {
      console.error('[TeacherCourseDetail] Error deleting module:', err.response || err);
      setError(err.response?.data?.message || 'Failed to delete module.');
      // Optional: Error notification
    }
  };

  if (loading) return <div className="p-6 text-center">Loading course data...</div>;
  // Keep error check generic for now
  if (error && !course && outline.length === 0) return <div className="p-6 text-red-500 text-center">Error: {error}</div>;
  // Allow showing outline even if basic course info failed? Or require course info?
  if (!course && !loading) return <div className="p-6 text-center">Course details not found or failed to load.</div>;


  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Display Course Info if available */}
      {course && (
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
        <p className="text-lg text-indigo-600 font-semibold mb-2">{course.code}</p>
        <p className="text-gray-600 mb-1">Department: {course.department?.name || 'N/A'}</p>
        <p className="text-gray-600 mb-4">Level: {course.level || 'N/A'}</p>
        <p className="text-gray-700 mb-4">Description: {course.description}</p>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${ 
          course.status === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800' 
        }`}>
          Status: {course.status}
        </span>
      </div>
      )}

      {/* Course Outline Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Course Outline</h2>
        {outline.length > 0 ? (
          <ul className="space-y-4">
            {outline.map((module) => (
              <li key={module._id} className="p-4 border rounded-md bg-gray-50 shadow-sm">
                {editingModuleId === module._id ? (
                    // --- Edit Module Form ---
                    <form onSubmit={handleUpdateModuleSubmit} className="space-y-3">
                        <h3 className="text-lg font-semibold mb-1">Editing Module</h3>
                         {error && <p className="text-red-500 text-xs italic mb-2">{error}</p>} 
                        <div>
                            <label htmlFor={`editModuleTitle-${module._id}`} className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                            <input
                                type="text"
                                id={`editModuleTitle-${module._id}`}
                                value={editModuleTitle}
                                onChange={(e) => setEditModuleTitle(e.target.value)}
                                className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor={`editModuleDescription-${module._id}`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                id={`editModuleDescription-${module._id}`}
                                value={editModuleDescription}
                                onChange={(e) => setEditModuleDescription(e.target.value)}
                                rows="2"
                                className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
                            />
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                            <button
                                type="button"
                                onClick={() => { setEditingModuleId(null); setError(''); }} // Cancel edit
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                ) : (
                    // --- Display Module View ---
                    <>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-lg">Module: {module.title}</h3>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    module.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                    module.status === 'Ongoing' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {module.status}
                                </span>
                                <button 
                                    onClick={() => handleShowEditModuleForm(module)}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    title="Edit Module"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDeleteModule(module._id, module.title)}
                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                    title="Delete Module"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                        
                        {/* Render Chapters */}
                        {module.chapters && module.chapters.length > 0 ? (
                          <ul className="space-y-3 ml-4 border-l-2 border-indigo-100 pl-4">
                            {module.chapters.map((chapter) => (
                              <li key={chapter._id} className="p-3 border rounded-md bg-white">
                                {editingChapterId === chapter._id ? (
                                    // --- Edit Chapter Form ---
                                    <form onSubmit={handleUpdateChapterSubmit} className="space-y-2">
                                        <h4 className="font-semibold mb-1">Editing Chapter</h4>
                                        {error && <p className="text-red-500 text-xs italic mb-1">{error}</p>}
                                        <div>
                                            <label htmlFor={`editChapterTitle-${chapter._id}`} className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                                            <input
                                                type="text"
                                                id={`editChapterTitle-${chapter._id}`}
                                                value={editChapterTitle}
                                                onChange={(e) => setEditChapterTitle(e.target.value)}
                                                className="shadow-sm appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring focus:border-blue-300"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`editChapterDescription-${chapter._id}`} className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                            <textarea
                                                id={`editChapterDescription-${chapter._id}`}
                                                value={editChapterDescription}
                                                onChange={(e) => setEditChapterDescription(e.target.value)}
                                                rows="2"
                                                className="shadow-sm appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring focus:border-blue-300"
                                            />
                                        </div>
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => { setEditingChapterId(null); setError(''); }}
                                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded text-xs"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                                            >
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    // --- Display Chapter View ---
                                    <>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-semibold">Chapter: {chapter.title}</h4>
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                <button 
                                                    onClick={() => handleShowEditChapterForm(chapter)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                    title="Edit Chapter"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteChapter(chapter._id, chapter.title)}
                                                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                                                    title="Delete Chapter"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 mb-2">{chapter.description}</p>

                                        {/* Render Subtopics */}
                                        {chapter.subtopics && chapter.subtopics.length > 0 ? (
                                          <ul className="space-y-2 ml-4">
                                            {chapter.subtopics.map((subtopic) => (
                                              <li key={subtopic._id} className="flex items-center justify-between space-x-2 py-1">
                                                {editingSubtopicId === subtopic._id ? (
                                                    // --- Edit Subtopic Form ---
                                                    <form onSubmit={handleUpdateSubtopicSubmit} className="flex-grow flex items-center space-x-1">
                                                        {/* Minimal form for title only */}
                                                        <input
                                                            type="text"
                                                            value={editSubtopicTitle}
                                                            onChange={(e) => setEditSubtopicTitle(e.target.value)}
                                                            className="shadow-sm appearance-none border rounded w-full py-0.5 px-1 text-gray-700 text-xs leading-tight focus:outline-none focus:ring focus:border-blue-300"
                                                            required
                                                            autoFocus
                                                        />
                                                         <button type="submit" className="text-xs p-1 bg-green-600 hover:bg-green-700 text-white rounded">Save</button>
                                                         <button type="button" onClick={() => setEditingSubtopicId(null)} className="text-xs p-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded">Cancel</button>
                                                         {error && editingSubtopicId === subtopic._id && <p className="text-red-500 text-xs italic ml-1">{error}</p>} 
                                                    </form>
                                                ) : (
                                                    // --- Display Subtopic View ---
                                                    <div className="flex items-center space-x-2 flex-grow">
                                                        <input
                                                            type="checkbox"
                                                            checked={subtopic.completed}
                                                            readOnly
                                                            className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out opacity-70 cursor-not-allowed"
                                                        />
                                                        <span className={`text-sm ${subtopic.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                                            {subtopic.title}
                                                        </span>
                                                    </div>
                                                )}
                                                 {editingSubtopicId !== subtopic._id && (
                                                    <div className="flex items-center space-x-1 flex-shrink-0"> {/* Container for buttons */}
                                                        <button 
                                                            onClick={() => handleShowEditSubtopicForm(subtopic)}
                                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium p-1"
                                                            title="Edit Subtopic"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteSubtopic(subtopic._id, subtopic.title)}
                                                            className="text-xs text-red-600 hover:text-red-800 font-medium p-1"
                                                            title="Delete Subtopic"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                 )}
                                              </li>
                                            ))}
                                          </ul>
                                        ) : <p className="text-xs text-gray-400 italic ml-4">No subtopics defined.</p>}
                                        
                                        {/* Add Subtopic Button / Form */} 
                                        {showAddSubtopicFormForChapter !== chapter._id ? (
                                            <button
                                              onClick={() => handleShowAddSubtopicForm(chapter._id)}
                                              className="mt-2 text-xs bg-green-100 hover:bg-green-200 text-green-800 font-medium py-1 px-2 rounded"
                                            >
                                              + Add Subtopic
                                            </button>
                                        ) : (
                                            <form 
                                                onSubmit={(e) => handleAddSubtopicSubmit(e, chapter._id, chapter.subtopics)} 
                                                className="mt-2 ml-4 p-2 border rounded bg-gray-50 shadow-sm"
                                            >
                                                <h5 className="text-sm font-semibold mb-1">Add New Subtopic</h5>
                                                {error && <p className="text-red-500 text-xs italic mb-1">{error}</p>}
                                                <div className="mb-1">
                                                    <label htmlFor={`subtopicTitle-${chapter._id}`} className="sr-only">Title*</label> {/* Screen reader only label */} 
                                                    <input
                                                        type="text"
                                                        id={`subtopicTitle-${chapter._id}`}
                                                        placeholder="Subtopic Title*"
                                                        value={newSubtopicTitle}
                                                        onChange={(e) => setNewSubtopicTitle(e.target.value)}
                                                        className="shadow-sm appearance-none border rounded w-full py-1 px-2 text-gray-700 text-xs leading-tight focus:outline-none focus:ring focus:border-blue-300"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex items-center justify-end space-x-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowAddSubtopicFormForChapter(null); setError(''); }}
                                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-0.5 px-2 rounded text-xs"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-0.5 px-2 rounded text-xs"
                                                    >
                                                        Save Subtopic
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                      </>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : <p className="text-sm text-gray-400 italic ml-4">No chapters defined.</p>}
                        
                        {/* Add Chapter Button / Form */} 
                        {showAddChapterFormForModule !== module._id ? (
                            <button
                              onClick={() => handleShowAddChapterForm(module._id)}
                              className="mt-3 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-3 rounded"
                            >
                              + Add Chapter
                            </button>
                        ) : (
                            <form 
                                onSubmit={(e) => handleAddChapterSubmit(e, module._id, module.chapters)} 
                                className="mt-3 ml-4 p-3 border rounded bg-white shadow-sm"
                            >
                                <h4 className="text-md font-semibold mb-2">Add New Chapter</h4>
                                {error && <p className="text-red-500 text-xs italic mb-2">{error}</p>}
                                <div className="mb-2">
                                    <label htmlFor={`chapterTitle-${module._id}`} className="block text-xs font-medium text-gray-700 mb-1">Title*</label>
                                    <input
                                        type="text"
                                        id={`chapterTitle-${module._id}`}
                                        value={newChapterTitle}
                                        onChange={(e) => setNewChapterTitle(e.target.value)}
                                        className="shadow-sm appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring focus:border-blue-300"
                                        required
                                    />
                                </div>
                                <div className="mb-2">
                                    <label htmlFor={`chapterDescription-${module._id}`} className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        id={`chapterDescription-${module._id}`}
                                        value={newChapterDescription}
                                        onChange={(e) => setNewChapterDescription(e.target.value)}
                                        rows="2"
                                        className="shadow-sm appearance-none border rounded w-full py-1 px-2 text-gray-700 text-sm leading-tight focus:outline-none focus:ring focus:border-blue-300"
                                    />
                                </div>
                                <div className="flex items-center justify-end space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowAddChapterFormForModule(null); setError(''); }}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-xs"
                                    >
                                        Save Chapter
                                    </button>
                                </div>
                            </form>
                        )}
                      </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No outline defined for this course yet.</p>
        )}
        
        {/* Add Module Button & Form */}
        <div className="mt-6">
            {!showAddModuleForm ? (
                <button
                    onClick={() => setShowAddModuleForm(true)} 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    + Add Module
                </button>
            ) : (
                <form onSubmit={handleAddModuleSubmit} className="mt-4 p-4 border rounded bg-gray-50">
                    <h3 className="text-lg font-semibold mb-2">Add New Module</h3>
                    {error && <p className="text-red-500 text-xs italic mb-2">{error}</p>} {/* Display errors */} 
                    <div className="mb-3">
                        <label htmlFor="moduleTitle" className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
                        <input
                            type="text"
                            id="moduleTitle"
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="moduleDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            id="moduleDescription"
                            value={newModuleDescription}
                            onChange={(e) => setNewModuleDescription(e.target.value)}
                            rows="2"
                            className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:border-blue-300"
                        />
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => { setShowAddModuleForm(false); setError(''); }} // Hide form and clear error
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Save Module
                        </button>
                    </div>
                </form>
            )}
        </div>
      </div>

      {/* Placeholder for Logbook Entries Section */}
      {/* <div className="bg-white shadow-md rounded-lg p-6 mt-6">
        <h2 className="text-2xl font-semibold mb-4">Submitted Logbooks</h2>
        {/* Fetch and display logbook entries here */}
      {/* </div> */}

    </div>
  );
};

export default TeacherCourseDetailPage; 