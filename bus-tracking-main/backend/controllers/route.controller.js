// Route controller placeholder

exports.getRoutes = async (req, res, next) => {
  try {
    res.json({ message: 'Get routes' });
  } catch (error) {
    next(error);
  }
};

exports.createRoute = async (req, res, next) => {
  try {
    res.json({ message: 'Create route' });
  } catch (error) {
    next(error);
  }
};
