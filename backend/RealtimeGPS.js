import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function subscribeGPS(callback) {

    const channel = supabase
        .channel("gps-channel")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "gps_logs"
            },
            (payload) => {

                console.log("New GPS:", payload.new);

                callback(payload.new);

            }
        )
        .subscribe();

    return channel;
}