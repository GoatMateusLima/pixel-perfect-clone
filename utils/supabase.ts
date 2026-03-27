import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iuoihlxjvrcgjqftwnna.supabase.co"
const supabaseKey = "sb_publishable_9yxZJCujKv24MOMa49Yfug_OTK8MQeN"

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-my-custom-header': 'pixel-perfect',
    },
  },
});

export default supabase;