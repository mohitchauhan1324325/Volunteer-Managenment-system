const jwt = require('jsonwebtoken');
const { dbClient } = require('../database/dbClient');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'super_secret_key_for_volunteer_registration_system_2026';
    
    const decoded = jwt.verify(token, secret);
    
    const user = await dbClient.users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ message: 'Token is invalid or expired.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

module.exports = { verifyToken, isAdmin };
