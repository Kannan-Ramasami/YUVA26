import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://fyvjpujprxyfbhruzdqx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dmpwdWpwcnh5ZmJocnV6ZHF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MjgxMjAsImV4cCI6MjEwNjIwNDEyMH0.YfNcvugvIHHdrkBE5HdKPeExFjgn8R9u1rwgG6hQvAw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: users, error } = await supabase.from('profiles').select('*');
  console.log("Profiles:", users, error);
}
test();
