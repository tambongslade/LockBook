const Hall = require('../../models/Hall');

// Get all Halls
exports.getAllHalls = async (req, res) => {
  try {
    // Sort by name for consistent dropdown order
    const halls = await Hall.find().sort({ name: 1 }); 
    res.json(halls);
  } catch (error) {
    console.error("Error fetching halls:", error);
    res.status(500).json({ message: 'Error fetching halls', error: error.message });
  }
};

// Add create, update, delete later if full Hall management is needed 