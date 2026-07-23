const express = require("express");

const router = express.Router();

const busController = require("../controllers/bus.controller");

// GET ALL BUSES
router.get("/", busController.getAllBuses);

// CREATE BUS
router.post("/", busController.createBus);

// UPDATE BUS
router.put("/:id", busController.updateBus);

// DELETE BUS
router.delete("/:id", busController.deleteBus);

module.exports = router;