const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const supabase = require("./supabase");


const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
    console.log("✅ Client Connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Client Disconnected:", socket.id);
    });
});

// Store latest GPS location (temporary)
let currentLocation = {};

// Store GPS history (temporary)
let gpsHistory = [];

// Home Route
app.get("/", (req, res) => {
    res.send("🚍 Bus Tracker Backend Running");
});

// ------------------------
// Update GPS Location
// ------------------------
app.post("/api/gps/update", async (req, res) => {

    try {

        const { bus_id, latitude, longitude, speed, heading } = req.body;

        // Validate required fields
        if (
            !bus_id ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "bus_id, latitude and longitude are required."
            });
        }

        const gpsData = {
            bus_id,
            latitude,
            longitude,
            speed,
            heading,
            received_at: new Date().toISOString()
        };

        // Update latest location
        currentLocation = gpsData;

        // Save to history
        gpsHistory.push(gpsData);

        // Save to Supabase
        const { data, error } = await supabase
            .from("gps_logs")
            .insert([gpsData])
            .select();

        console.log("Supabase data:", data);
        console.log("Supabase error:", error);
        // Broadcast the latest GPS data to all connected clients
        io.emit("gpsUpdate", gpsData);

        res.status(200).json({
            success: true,
            message: "GPS Location Saved Successfully",
            data
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ------------------------
// Get Latest GPS Location
// ------------------------
app.get("/api/gps/live", (req, res) => {

    if (Object.keys(currentLocation).length === 0) {
        return res.status(404).json({
            success: false,
            message: "No GPS data available."
        });
    }

    res.json({
        success: true,
        data: currentLocation
    });

});

// ------------------------
// Get GPS History (Memory)
// ------------------------
app.get("/api/gps/history", (req, res) => {

    res.json({
        success: true,
        totalLocations: gpsHistory.length,
        data: gpsHistory
    });

});

// ------------------------
// Get GPS History from Supabase
// ------------------------
app.get("/api/gps/history/db", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("gps_logs")
            .select("*")
            .order("received_at", { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        res.json({
            success: true,
            totalLocations: data.length,
            data
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ------------------------
// Clear Local Memory
// ------------------------
app.delete("/api/gps/history", (req, res) => {

    gpsHistory = [];
    currentLocation = {};

    res.json({
        success: true,
        message: "Local GPS History Cleared"
    });

});

// Start Server
const PORT = 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log("✅ Socket.IO Server Started");
});

//exp
app.use(express.json());

app.post("/traccar/webhook", async (req, res) => {

    try {

        console.log("🔥 TRACCAR WEBHOOK RECEIVED");

        const { device, position } = req.body;

        const gpsData = {
            bus_id: device.uniqueId,
            latitude: position.latitude,
            longitude: position.longitude,
            speed: position.speed,
            heading: position.course,
            received_at: position.fixTime
        };

        console.log(gpsData);

        const { data, error } = await supabase
            .from("gps_logs")
            .insert([gpsData])
            .select();

        if (error) {
            console.error("Supabase Error:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }

        // Update latest location
        currentLocation = gpsData;

        // Store in memory
        gpsHistory.push(gpsData);

        // Notify frontend
        io.emit("gpsUpdate", gpsData);

        console.log("✅ Saved to Supabase");

        res.sendStatus(200);

    } catch (err) {

        console.error(err);

        res.status(500).send(err.message);

    }

});