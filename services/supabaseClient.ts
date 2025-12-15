import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dvroisnrkeqmulhlsfwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cm9pc25ya2VxbXVsaGxzZndtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODg5MTUsImV4cCI6MjA4MTM2NDkxNX0.ib1NulbhUMy_sMh7vRLRdg1rhL0eydAOKIzcX8PZoSs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
