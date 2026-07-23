const { supabase, adminSupabase } = require('../config/supabase');

/**
 * Login an admin using Supabase Auth.
 * Returns a Supabase session token that the client must send
 * as  Authorization: Bearer <access_token>  on subsequent requests.
 */
exports.login = async (credentials) => {
  const { email, password } = credentials || {};

  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.status = 400;
    throw error;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data?.session) {
    const authError = new Error(error?.message || 'Invalid credentials');
    authError.status = 401;
    throw authError;
  }

  const { session, user } = data;

  return {
    success: true,
    message: 'Login successful',
    token: session.access_token,
    admin: {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'admin',
    },
  };
};

/**
 * Register a new admin user.
 * Requires SUPABASE_SERVICE_ROLE_KEY to be set in .env
 * because only the service-role client can create users
 * without going through email confirmation.
 */
exports.register = async (body) => {
  const { email, password, name } = body || {};

  if (!email || !password) {
    const error = new Error('Email and password are required');
    error.status = 400;
    throw error;
  }

  if (!adminSupabase) {
    const error = new Error(
      'Admin registration is unavailable – SUPABASE_SERVICE_ROLE_KEY is not configured'
    );
    error.status = 503;
    throw error;
  }

  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,           // skip email-verification step
    user_metadata: { name, role: 'admin' },
  });

  if (error) {
    const regError = new Error(error.message);
    regError.status = 400;
    throw regError;
  }

  return {
    success: true,
    message: 'Admin user created successfully',
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  };
};
