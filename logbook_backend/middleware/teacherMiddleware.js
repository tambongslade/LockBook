const teacherMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'TEACHER') {
    return res.status(403).json({ message: 'Access denied. Teacher role required' });
  }

  next();
};

module.exports = teacherMiddleware; 