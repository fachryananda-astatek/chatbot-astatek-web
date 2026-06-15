// src/js/supabase-config.js
import { createClient } from '@supabase/supabase-js';

// Mengambil variabel dari file .env bawaan Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const sb = createClient(supabaseUrl, supabaseAnonKey);