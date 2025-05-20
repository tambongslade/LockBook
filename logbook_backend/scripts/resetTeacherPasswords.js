require('dotenv').config({ path: '../.env' }); // Adjust path if your .env is elsewhere
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path to your User model

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/logbook'; // Use env or fallback
const NEW_TEACHER_PASSWORD = 'teacher123'; // The password to set

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not found or invalid.');
  process.exit(1);
}
if (!NEW_TEACHER_PASSWORD || NEW_TEACHER_PASSWORD.length < 6) {
    console.error('Error: New password is too short or not defined.');
    process.exit(1);
}


const resetPasswords = async () => {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully.');

    // 1. Find all teachers
    console.log('Finding all users with role TEACHER...');
    const teachers = await User.find({ role: 'TEACHER' });

    if (!teachers || teachers.length === 0) {
      console.log('No users with role TEACHER found.');
      return;
    }
    console.log(`Found ${teachers.length} teacher(s).`);

    // 2. Iterate and update each teacher's password
    let updatedCount = 0;
    let errorCount = 0;
    console.log(`Attempting to reset password to "${NEW_TEACHER_PASSWORD}" for each teacher...`);

    for (const teacher of teachers) {
      try {
        teacher.password = NEW_TEACHER_PASSWORD;
        await teacher.save(); // IMPORTANT: .save() triggers the pre-save hook for hashing
        console.log(`  Successfully updated password for: ${teacher.email}`);
        updatedCount++;
      } catch (saveError) {
        console.error(`  Failed to update password for ${teacher.email}:`, saveError.message);
        errorCount++;
      }
    }

    console.log('------------------------------------');
    console.log('Password Reset Summary:');
    console.log(`  Teachers found: ${teachers.length}`);
    console.log(`  Successfully updated: ${updatedCount}`);
    console.log(`  Failed updates: ${errorCount}`);
    console.log('------------------------------------');

  } catch (error) {
    console.error('Error during password reset process:', error);
  } finally {
    if (connection) {
      console.log('Disconnecting from database...');
      await mongoose.disconnect();
      console.log('Database disconnected.');
    }
  }
};

resetPasswords(); 