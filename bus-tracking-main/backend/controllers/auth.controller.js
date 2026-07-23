const authService = require('../services/auth.service');

exports.login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.register = async (req, res, next) => {
  try {
    await authService.register(req.body);
    res.status(201).json({ success: true, message: 'Admin created' });
  } catch (error) {
    next(error);
  }
};
