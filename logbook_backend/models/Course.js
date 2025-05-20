const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  level: {
    type: Number,
    required: true,
    enum: [200, 300, 400, 500, 600]
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// --- Add Static Method for Progress Calculation ---
// Note: This requires importing the necessary outline models
const CourseOutlineModule = require('./CourseOutlineModule'); // Adjust path if needed
const Chapter = require('./Chapter'); // Adjust path if needed
const Subtopic = require('./Subtopic'); // Adjust path if needed

courseSchema.statics.calculateProgress = async function(courseId) {
  console.log(`[Course.calculateProgress] Calculating for courseId: ${courseId}`);
  try {
    console.log(`[Course.calculateProgress ${courseId}] Finding modules...`);
    const modules = await CourseOutlineModule.find({ course: courseId });
    console.log(`[Course.calculateProgress ${courseId}] Found ${modules.length} modules.`);
    if (!modules.length) return { completed: 0, total: 0, percentage: 0 };

    const moduleIds = modules.map(m => m._id);
    console.log(`[Course.calculateProgress ${courseId}] Finding chapters for module IDs: ${moduleIds.join(', ')}`);
    const chapters = await Chapter.find({ module: { $in: moduleIds } });
    console.log(`[Course.calculateProgress ${courseId}] Found ${chapters.length} chapters.`);
    if (!chapters.length) return { completed: 0, total: 0, percentage: 0 };

    const chapterIds = chapters.map(c => c._id);
     console.log(`[Course.calculateProgress ${courseId}] Finding subtopics for chapter IDs: ${chapterIds.join(', ')}`);
    const subtopics = await Subtopic.find({ chapter: { $in: chapterIds } });
    console.log(`[Course.calculateProgress ${courseId}] Found ${subtopics.length} subtopics.`);
    
    const totalSubtopics = subtopics.length;
    if (totalSubtopics === 0) {
        console.log(`[Course.calculateProgress ${courseId}] No subtopics found, returning 0 progress.`);
        return { completed: 0, total: 0, percentage: 0 };
    }
    
    const completedSubtopics = subtopics.filter(st => st.completed === true).length;
    console.log(`[Course.calculateProgress ${courseId}] Completed subtopics: ${completedSubtopics}`);
    const percentage = Math.round((completedSubtopics / totalSubtopics) * 100);
    console.log(`[Course.calculateProgress ${courseId}] Calculated percentage: ${percentage}%`);

    const result = {
        completed: completedSubtopics,
        total: totalSubtopics,
        percentage: percentage
    };
     console.log(`[Course.calculateProgress ${courseId}] Returning progress:`, result);
     return result;

  } catch (error) {
    // Log the specific error within calculateProgress
    console.error(`[Course.calculateProgress ${courseId}] Error during calculation:`, error);
    // Return 0 progress on error to avoid breaking the frontend
    return { completed: 0, total: 0, percentage: 0 }; 
  }
};
// --- End Static Method ---

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 