window.getSupabaseClient = () => {
  const { supabaseUrl, supabaseAnonKey } = window.APP_CONFIG || {};
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Add your Supabase project URL and anon key to supabase-config.js.');
  }
  let projectUrl;
  try {
    projectUrl = new URL(supabaseUrl.trim());
  } catch {
    throw new Error('Enter a valid Supabase project URL in supabase-config.js.');
  }
  const projectPath = projectUrl.pathname.replace(/\/+$/, '');
  if (!['https:', 'http:'].includes(projectUrl.protocol)
    || (projectPath !== '' && projectPath !== '/rest/v1')
    || projectUrl.search
    || projectUrl.hash) {
    throw new Error('Enter the Supabase project URL, optionally followed by /rest/v1, without a query string.');
  }
  if (!window.supabase?.createClient) {
    throw new Error('The Supabase client library could not be loaded. Check your internet connection.');
  }

  if (!window.appSupabase) {
    window.appSupabase = window.supabase.createClient(projectUrl.origin, supabaseAnonKey);
  }
  return window.appSupabase;
};
