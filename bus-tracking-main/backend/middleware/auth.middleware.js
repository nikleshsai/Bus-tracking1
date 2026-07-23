const { supabase } = require("../config/supabase");

/**
 * Authenticate requests by validating the Supabase access token.
 *
 * The frontend obtains this token by calling supabase.auth.signInWithPassword()
 * directly and passes it as:  Authorization: Bearer <supabase_access_token>
 */
exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const error = new Error("Authorization token required");
    error.status = 401;
    return next(error);
  }

  const token = authHeader.split(" ")[1];

  // Validate the token against Supabase – verifies signature, expiry,
  // and that the user still exists in the project.
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    const authError = new Error("Invalid or expired token");
    authError.status = 401;
    return next(authError);
  }

  // Attach the Supabase user to the request for downstream handlers
  req.user = {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role || "admin",
  };

  next();
};
