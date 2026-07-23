const express = require("express");
const cors = require("cors");

const { authenticate } = require("./middleware/auth.middleware");
const { errorHandler } = require("./middleware/error.middleware");
const { logger } = require("./middleware/logger.middleware");

const authRoutes = require("./routes/auth.routes");
const busRoutes = require("./routes/bus.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const locationRoutes = require("./routes/location.routes");
const routeRoutes = require("./routes/route.routes");
const stopRoutes = require("./routes/stop.routes");

const app = express();

// ─── Global middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(logger);

// ─── Health check ──────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ success: true, message: "Backend running 🚀" });
});

// ─── Public routes ────────────────────────────────────────────────────────
// Auth routes (login / register) are public – no JWT required.
app.use("/api/auth", authRoutes);

// ─── Protected routes ──────────────────────────────────────────────────────
// All routes below require a valid Supabase JWT in the Authorization header.
app.use("/api/buses", authenticate, busRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);
app.use("/api/locations", authenticate, locationRoutes);
app.use("/api/routes", authenticate, routeRoutes);
app.use("/api/stops", authenticate, stopRoutes);

// ─── 404 catch-all ─────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.url}`);
  err.status = 404;
  next(err);
});

// ─── Central error handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;