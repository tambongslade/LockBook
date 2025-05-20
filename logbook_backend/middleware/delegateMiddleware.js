const delegateMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'DELEGATE') {
    return res.status(403).json({ 
      message: 'Access denied. Delegate privileges required.' 
    });
  }

  next();
};

module.exports = delegateMiddleware; 