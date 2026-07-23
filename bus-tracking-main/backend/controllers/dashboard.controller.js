// Dashboard controller placeholder

exports.getStats = async (req, res, next) => {
  try {
    res.json({ message: 'Dashboard stats' });
  } catch (error) {
    next(error);
  }
};
