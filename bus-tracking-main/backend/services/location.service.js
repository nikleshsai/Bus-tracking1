const { supabase, adminSupabase } = require('../config/supabase');

const client = () => adminSupabase || supabase;

exports.getLocations = async () => {
  const { data, error } = await client().from('buses').select('id, bus_number, route_name, latitude, longitude, status, last_seen_at');
  if (error) throw error;
  return data;
};

/**
 * Called when a GPS device pushes a location update.
 * Automatically sets status → 'active' when valid coordinates arrive,
 * or 'Pending (GPS)' when coordinates are missing.
 *
 * Expected body: { busId, latitude, longitude }
 */
exports.updateLocation = async ({ busId, latitude, longitude }) => {
  if (!busId) throw Object.assign(new Error('busId is required'), { status: 400 });

  const hasGps = latitude != null && longitude != null;
  const status = hasGps ? 'active' : 'Pending (GPS)';

  const updates = {
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    status,
    updated_at: new Date().toISOString(),
    ...(hasGps && { last_seen_at: new Date().toISOString() }),
  };

  const { data, error } = await client()
    .from('buses')
    .update(updates)
    .eq('id', busId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
