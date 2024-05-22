import userCheck from "../middlewere/userCheck"
import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/server/supabase';
export default defineEventHandler(async (event) => {
    await userCheck(event);
    const client = await serverSupabaseClient<Database>(event);

    const data = await readBody(event);
    client.auth.signOut();

    //expire the session
    client.from('sessions').update({ expires_at: new Date().toISOString() }).eq('session_id', data.session_id).single();

    return { msg: 'logged out', status: 200 }
});