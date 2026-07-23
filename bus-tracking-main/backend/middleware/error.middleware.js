/**
 * Central Express error handler.
 * Always returns a JSON response so clients never receive an HTML error page.
 */
exports.errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[${status}] ${req.method} ${req.url} –`, err.message);
  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
};
