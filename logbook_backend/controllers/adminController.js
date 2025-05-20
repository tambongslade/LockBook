const Course = require('../models/Course');
const LogbookEntry = require('../models/LogbookEntry');
const User = require('../models/User');
const ExcelJS = require('exceljs');

// Get all logbook entries for admin history view
const getAllLogbookHistory = async (req, res) => {
  try {
    console.log("[Admin Controller] Fetching all logbook history...");

    // Fetch all logbook entries, regardless of user or course
    const allLogbookHistory = await LogbookEntry.find({})
      .populate({ path: 'course', select: 'title code' })
      .populate({ path: 'delegate', select: 'firstName lastName email' })
      .populate({ path: 'reviewedBy', select: 'firstName lastName' }) // Populate who reviewed it
      .sort({ createdAt: -1 }); // Sort by newest first

    console.log(`[Admin Controller] Found ${allLogbookHistory.length} total logbook entries.`);
    res.json(allLogbookHistory);

  } catch (error) {
    console.error('[Admin Controller] Error fetching all logbook history:', error);
    res.status(500).json({ 
      message: 'Error fetching logbook history',
      error: error.message 
    });
  }
};

// --- ADD NEW FUNCTION for Progress Report ---
const getCoursesWithProgress = async (req, res) => {
  try {
    console.log("[AdminController /getCoursesWithProgress] Fetching courses...");
    const courses = await Course.find({})
                                .select('title code status department level')
                                .populate('department', 'name')
                                .sort('code')
                                .lean();
    console.log(`[AdminController /getCoursesWithProgress] Found ${courses.length} courses.`);

    if (courses.length === 0) {
      console.log("[AdminController /getCoursesWithProgress] No courses found, returning empty array.");
      return res.json([]);
    }

    console.log("[AdminController /getCoursesWithProgress] Starting progress calculation loop...");
    const coursesWithProgress = await Promise.all(courses.map(async (course, index) => {
      console.log(`[AdminController /getCoursesWithProgress] [${index+1}/${courses.length}] Calculating progress for course ID: ${course._id} (${course.code})`);
      try {
        const progressData = await Course.calculateProgress(course._id);
        console.log(`[AdminController /getCoursesWithProgress] [${index+1}/${courses.length}] Progress for ${course.code}:`, progressData);
        return {
          ...course,
          progress: progressData
        };
      } catch (progressError) {
         console.error(`[AdminController /getCoursesWithProgress] Error calculating progress for course ${course._id} (${course.code}):`, progressError);
          // Return course with default progress on error for this specific course
         return {
           ...course,
           progress: { completed: 0, total: 0, percentage: 0 }
         };
      }
    }));
    
    console.log("[AdminController /getCoursesWithProgress] Progress calculation loop complete. Sending response.");
    res.json(coursesWithProgress);

  } catch (error) {
    // Catch errors during the initial Course.find() or other unexpected issues
    console.error('[AdminController /getCoursesWithProgress] Unexpected error fetching courses with progress:', error);
    res.status(500).json({ message: 'Failed to fetch course progress report.', error: error.message });
  }
};
// --- END ADD NEW FUNCTION ---

// --- ADD NEW FUNCTION for Exporting Progress Report ---
const exportCoursesProgressReport = async (req, res) => {
  console.log("[AdminController /exportCoursesProgressReport] Starting export process...");
  try {
    // 1. Fetch courses and calculate progress (similar to getCoursesWithProgress)
    console.log("[AdminController /exportCoursesProgressReport] Fetching courses...");
    const courses = await Course.find({})
                                .select('title code status department level')
                                .populate('department', 'name') // Ensure department name is populated
                                .sort('code')
                                .lean();
    console.log(`[AdminController /exportCoursesProgressReport] Found ${courses.length} courses.`);

    if (courses.length === 0) {
      console.log("[AdminController /exportCoursesProgressReport] No courses found, returning 404.");
      return res.status(404).json({ message: "No courses found to export." });
    }

    console.log("[AdminController /exportCoursesProgressReport] Calculating progress for export...");
    const coursesWithProgress = await Promise.all(courses.map(async (course) => {
      try {
        const progressData = await Course.calculateProgress(course._id);
        return {
          ...course,
          progress: progressData,
          departmentName: course.department?.name || 'N/A' // Handle case where department might not be populated or exists
        };
      } catch (progressError) {
         console.error(`[AdminController /exportCoursesProgressReport] Error calculating progress for course ${course._id} (${course.code}):`, progressError);
         return {
           ...course,
           progress: { completed: 0, total: 0, percentage: 0 },
           departmentName: course.department?.name || 'N/A'
         };
      }
    }));
    console.log("[AdminController /exportCoursesProgressReport] Progress calculation complete.");

    // 2. Create Excel Workbook and Worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Course Progress Report');

    // Define columns
    worksheet.columns = [
      { header: 'Course Code', key: 'code', width: 15 },
      { header: 'Course Title', key: 'title', width: 40 },
      { header: 'Department', key: 'departmentName', width: 25 },
      { header: 'Level', key: 'level', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Completed Topics', key: 'completed', width: 18, style: { numFmt: '0' } },
      { header: 'Total Topics', key: 'total', width: 15, style: { numFmt: '0' } },
      { header: 'Progress (%)', key: 'percentage', width: 15, style: { numFmt: '0.00' } } // Format as percentage
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // 3. Add data rows
    coursesWithProgress.forEach(course => {
      worksheet.addRow({
        code: course.code,
        title: course.title,
        departmentName: course.departmentName,
        level: course.level,
        status: course.status,
        completed: course.progress.completed,
        total: course.progress.total,
        percentage: course.progress.percentage
      });
    });
    console.log(`[AdminController /exportCoursesProgressReport] Added ${coursesWithProgress.length} rows to Excel sheet.`);

    // 4. Set Response Headers for Download
    const fileName = `Course_Progress_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    // 5. Write workbook to response stream
    await workbook.xlsx.write(res);
    console.log(`[AdminController /exportCoursesProgressReport] Excel file "${fileName}" written to response.`);
    res.end(); // End the response after writing the file

  } catch (error) {
    console.error('[AdminController /exportCoursesProgressReport] Error generating Excel report:', error);
    // Avoid sending file headers if error occurs before writing
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate course progress report.', error: error.message });
    } else {
      // If headers already sent, we can't send JSON, just end the response.
      // The client might receive a corrupted file or download error.
      res.end();
    }
  }
};
// --- END ADD NEW FUNCTION ---

module.exports = {
  getAllLogbookHistory,
  getCoursesWithProgress,
  exportCoursesProgressReport
}; 