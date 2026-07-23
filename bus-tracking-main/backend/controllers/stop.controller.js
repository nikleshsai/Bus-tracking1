// Stop controller placeholder

exports.getStops = async (req, res, next) => {
  try {
    res.json({ message: 'Get stops' });
  } catch (error) {
    next(error);
  }
};

exports.createStop = async (req, res, next) => {
  try {
    res.json({ message: 'Create stop' });
  } catch (error) {
    next(error);
  }
};
