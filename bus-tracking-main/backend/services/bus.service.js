const { supabase, adminSupabase } = require("../config/supabase");
const fetch = require("node-fetch");

const ensureWriteClient = () => {
    if (!adminSupabase) {
        throw new Error("Supabase write access is not configured. Add SUPABASE_SERVICE_ROLE_KEY to backend/.env or backend/src/.env, or enable insert/update/delete permissions in your Supabase RLS policy for the buses table.");
    }

    return adminSupabase;
};

const directSupabaseRequest = async (method, path, body) => {
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
        method,
        headers: {
            apikey: process.env.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(`Supabase request failed: ${response.status} ${text}`);
    }

    return text ? JSON.parse(text) : null;
};

const mapBusPayload = (busData) => {
    // NOTE: 'status' is intentionally NOT set here.
    // A Supabase BEFORE INSERT/UPDATE trigger (set_bus_status) auto-computes it:
    //   lat + lng present  →  'active'
    //   lat + lng null     →  'Pending (GPS)'
    //   status was 'inactive' →  kept as 'inactive'
    const hasGps = (busData.latitude != null && busData.longitude != null);

    const payload = {
        bus_number: busData.bus_number || busData.busId || null,
        registration_number: busData.registration_number || busData.busNo || null,
        driver_name: busData.driver_name || busData.driver || null,
        driver_phone: busData.driver_phone || busData.contact || null,
        route_name: busData.route_name || busData.route || null,
        latitude: busData.latitude ?? null,
        longitude: busData.longitude ?? null,
        license_number: busData.license_number || busData.license || null,
        capacity: busData.capacity ?? null,
        updated_at: new Date().toISOString(),
        ...(hasGps && { last_seen_at: new Date().toISOString() }),
    };

    if (busData.id) {
        payload.id = busData.id;
    }

    return payload;
};

const client = () => (adminSupabase || supabase);

exports.getAllBuses = async () => {
    const { data, error } = await supabase.from("buses").select("*").order("id", { ascending: true });

    if (error) {
        throw error;
    }

    return data;
};

exports.createBus = async (busData) => {
    const payload = mapBusPayload(busData);

    try {
        const data = await directSupabaseRequest('post', 'buses', [payload]);
        return Array.isArray(data) ? data[0] : data;
    } catch (error) {
        try {
            const { data, error: writeError } = await ensureWriteClient().from("buses").insert([payload]).select().single();
            if (writeError) {
                throw writeError;
            }
            return data;
        } catch (writeError) {
            throw new Error(writeError.message || 'Unable to create the bus in Supabase.');
        }
    }
};

exports.updateBus = async (id, busData) => {
    const payload = mapBusPayload({ ...busData, id });

    try {
        const data = await directSupabaseRequest('patch', `buses?id=eq.${id}`, payload);
        return Array.isArray(data) ? data[0] : data;
    } catch (error) {
        try {
            const { data, error: writeError } = await ensureWriteClient().from("buses").update(payload).eq("id", id).select().single();
            if (writeError) {
                throw writeError;
            }
            return data;
        } catch (writeError) {
            throw new Error(writeError.message || 'Unable to update the bus in Supabase.');
        }
    }
};

exports.deleteBus = async (id) => {
    try {
        const data = await directSupabaseRequest('delete', `buses?id=eq.${id}`);
        return data;
    } catch (error) {
        try {
            const { data, error: writeError } = await ensureWriteClient().from("buses").delete().eq("id", id).select();
            if (writeError) {
                throw writeError;
            }
            return data;
        } catch (writeError) {
            throw new Error(writeError.message || 'Unable to delete the bus in Supabase.');
        }
    }
};

