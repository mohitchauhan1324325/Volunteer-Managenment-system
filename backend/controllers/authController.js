const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbClient } = require('../database/dbClient');

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_key_for_volunteer_registration_system_2026',
    { expiresIn: '24h' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    const existingUser = await dbClient.users.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await dbClient.users.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'volunteer',
      isVerified: false,
      hoursVolunteered: 0,
      skills: [],
      availability: 'Flexible',
      bio: ''
    });

    const token = signToken(newUser._id.toString());

    res.status(201).json({
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isVerified: newUser.isVerified,
        hoursVolunteered: newUser.hoursVolunteered,
        skills: newUser.skills,
        availability: newUser.availability,
        bio: newUser.bio,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = await dbClient.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user._id.toString());

    res.status(200).json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        hoursVolunteered: user.hoursVolunteered,
        skills: user.skills,
        availability: user.availability,
        bio: user.bio,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await dbClient.users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      hoursVolunteered: user.hoursVolunteered,
      skills: user.skills,
      availability: user.availability,
      bio: user.bio,
      phone: user.phone
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile details.' });
  }
};
