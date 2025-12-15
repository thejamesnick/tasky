import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    // We'll log a warning but not crash, so the app handles the "missing config" state gracefully
    console.warn('Missing Supabase URL or Anon Key. Authentication will not work.');
}

// Fallback to dummy values to prevent crash if env vars are missing. 
// The auth calls will simply fail, which is handled in the UI.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);
