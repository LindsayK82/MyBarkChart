// MyBarkChart Supabase configuration
// The project URL and publishable key are safe to use in browser code when RLS is enabled.
const MYBARKCHART_SUPABASE_URL = 'https://kujeadlxcuawbpezhtwk.supabase.co';
const MYBARKCHART_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_GH5aoe9IVUnxQ8EidTFOew_CPswZpLR';

const myBarkChartSupabase = window.supabase.createClient(
  MYBARKCHART_SUPABASE_URL,
  MYBARKCHART_SUPABASE_PUBLISHABLE_KEY
);
