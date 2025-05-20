require('dotenv').config({ path: '../.env' }); // Adjust path if your .env is elsewhere
const mongoose = require('mongoose');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Hall = require('../models/Hall');
const ScheduleEntry = require('../models/ScheduleEntry'); // Ensure this is the correct model

const MONGODB_URI = 'mongodb://localhost:27017/logbook';

// --- Configuration ---
const SAMPLE_SEMESTER = '1st';
const CLEAR_EXISTING_SCHEDULE = true; // Set to false to keep existing entries
const MAX_ENTRIES_PER_COURSE = 2; // Limit how many schedule entries to create per course
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']; // Days to potentially assign
const TIMESLOTS = ['08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00', '15:00 - 17:00']; // Timeslots to potentially assign
// --- End Configuration ---

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not found or invalid.');
  process.exit(1);
}

const seedTimetable = async () => {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully.');

    // 1. Find ALL Departments
    console.log('Finding all departments...');
    const allDepartments = await Department.find();
    if (!allDepartments || allDepartments.length === 0) {
        console.error("Error: No departments found in the database. Please add departments first.");
        return;
    }
    console.log(`Found ${allDepartments.length} departments.`);

    // 2. Find a Hall (still okay to use just one for simplicity)
    console.log('Finding a hall...');
    const hall = await Hall.findOne(); // Just grab the first one
    if (!hall) {
      console.error('Error: No halls found in the database. Please add at least one hall.');
      return;
    }
    console.log(`Using Hall: ${hall.name} (ID: ${hall._id})`);

    let allSampleEntries = [];
    let dayIndex = 0;
    let timeIndex = 0;

    // 3. Iterate through each department
    for (const department of allDepartments) {
        console.log(`Processing Department: ${department.name} (ID: ${department._id})...`);

        // 4. Find all courses in this department
        const coursesInDept = await Course.find({ department: department._id });
        if (!coursesInDept || coursesInDept.length === 0) {
            console.log(`  No courses found for department ${department.name}. Skipping.`);
            continue;
        }
        console.log(`  Found ${coursesInDept.length} courses in ${department.name}.`);

        // 5. Create sample entries for courses in this department
        for (const course of coursesInDept) {
            // Create a limited number of entries per course
            for (let i = 0; i < MAX_ENTRIES_PER_COURSE; i++) {
                // Cycle through days and times to distribute entries
                const assignedDay = DAYS[dayIndex % DAYS.length];
                const assignedTime = TIMESLOTS[timeIndex % TIMESLOTS.length];
                dayIndex++; // Increment to get different slots next time
                timeIndex++;

                const entryData = {
                    semester: SAMPLE_SEMESTER,
                    course: course._id,
                    day: assignedDay,
                    timeSlot: assignedTime,
                    hall: hall._id,
                    // teacher: null, // Can assign a teacher if needed/available
                };
                allSampleEntries.push(entryData);
                console.log(`    Defined entry: ${course.code} - ${assignedDay} - ${assignedTime}`);
            }
        }
    } // End loop through departments

    if (allSampleEntries.length === 0) {
        console.log("No sample schedule entries could be defined based on existing departments/courses.");
        return;
    }
    console.log(`Defined a total of ${allSampleEntries.length} sample schedule entries across all departments.`);

    // 6. Clear Existing Entries (Optional)
    if (CLEAR_EXISTING_SCHEDULE) {
      console.log('Clearing existing schedule entries...');
      const deleteResult = await ScheduleEntry.deleteMany({});
      console.log(`Cleared ${deleteResult.deletedCount} existing entries.`);
    }

    // 7. Insert New Entries
    if (allSampleEntries.length > 0) {
        console.log('Inserting new sample schedule entries...');
        const insertedEntries = await ScheduleEntry.insertMany(allSampleEntries);
        console.log(`Successfully inserted ${insertedEntries.length} new schedule entries.`);
    }

  } catch (error) {
    console.error('Error during timetable seeding process:', error);
  } finally {
    if (connection) {
      console.log('Disconnecting from database...');
      await mongoose.disconnect();
      console.log('Database disconnected.');
    }
  }
};

seedTimetable(); 