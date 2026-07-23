const locationService = require('../services/location.service');

exports.getLocations = async (req, res, next) => {
  try {
    const data = await locationService.getLocations();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

/**
 * GPS device pushes location:
 * PUT /api/locations  { busId, latitude, longitude }
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const { busId, latitude, longitude } = req.body;
    const data = await locationService.updateLocation({ busId, latitude, longitude });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
