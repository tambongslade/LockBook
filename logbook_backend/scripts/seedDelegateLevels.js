require('dotenv').config({ path: '../.env' }); // Adjust path if your .env is elsewhere
const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path to your User model

const MONGODB_URI = 'mongodb://localhost:27017/logbook';
const DEFAULT_LEVEL = 200; // Set the default level for delegates

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in your .env file.');
  process.exit(1);
}

const seedLevels = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully.');

    console.log('Finding delegates without a level set...');
    // Find delegates where level is null or does not exist
    const delegatesToUpdate = await User.find({
      role: 'DELEGATE',
      $or: [
        { level: { $exists: false } },
        { level: null }
      ]
    });

    if (delegatesToUpdate.length === 0) {
      console.log('All delegates already have a level field or no delegates found.');
      return;
    }

    console.log(`Found ${delegatesToUpdate.length} delegate(s) needing a default level.`);

    let updatedCount = 0;
    for (const delegate of delegatesToUpdate) {
      try {
        delegate.level = DEFAULT_LEVEL;
        await delegate.save();
        console.log(`  Updated level for delegate: ${delegate.email} (ID: ${delegate._id})`);
        updatedCount++;
      } catch (saveError) {
        console.error(`  Failed to update level for delegate ${delegate.email}:`, saveError.message);
      }
    }

    console.log(`Successfully updated level for ${updatedCount} delegate(s) to ${DEFAULT_LEVEL}.`);

  } catch (error) {
    console.error('Error during seeding process:', error);
  } finally {
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

seedLevels(); 