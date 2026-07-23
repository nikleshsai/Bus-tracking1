const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');

router.get('/', locationController.getLocations);
router.put('/', locationController.updateLocation);

module.exports = router;
