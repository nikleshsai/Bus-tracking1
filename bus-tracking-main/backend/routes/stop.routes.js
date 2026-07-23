const express = require('express');
const router = express.Router();
const stopController = require('../controllers/stop.controller');

router.get('/', stopController.getStops);
router.post('/', stopController.createStop);

module.exports = router;
