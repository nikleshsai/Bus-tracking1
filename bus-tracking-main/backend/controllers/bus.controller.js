const busService = require("../services/bus.service");

exports.getAllBuses = async (req, res) => {
    try {
        const buses = await busService.getAllBuses();
        res.status(200).json(buses);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.createBus = async (req, res) => {
    try {
        const bus = await busService.createBus(req.body);
        res.status(201).json({ success: true, data: bus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBus = async (req, res) => {
    try {
        const bus = await busService.updateBus(req.params.id, req.body);
        res.status(200).json({ success: true, data: bus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteBus = async (req, res) => {
    try {
        const result = await busService.deleteBus(req.params.id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};