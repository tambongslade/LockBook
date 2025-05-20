const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password, // Will be hashed by the pre-save middleware
      role,
      department
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    console.log('Login attempt received:', { 
      email: req.body.email,
      password: req.body.password 
    });
    
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      console.log('Missing credentials:', { email: !!email, password: !!password });
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    console.log('User found:', user ? {
      email: user.email,
      role: user.role,
      hashedPassword: user.password
    } : 'No');
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password using the User model's method
    const isMatch = await user.comparePassword(password);
    console.log('Password comparison:', {
      inputPassword: password,
      storedHash: user.password,
      isMatch: isMatch
    });
    
    if (!isMatch) {
      console.log('Password mismatch for user:', user.email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('Token generated successfully for user:', user.email);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log('Login successful for user:', user.email);
    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
}; 