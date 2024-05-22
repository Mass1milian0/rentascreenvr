import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'
export default defineEventHandler(async (event) => {
    const data = await readBody(event);
    const client = await serverSupabaseClient<Database>(event);
    if(!data.session_id){
        return {user: {}, msg: 'session_id is required', status: 400}
    }
    const { data: user, error: userError } = await client
        .from('sessions')
        .select('data')
        .eq('session_id', data.session_id)
        //and not expired
        .gt('expires_at', new Date().toISOString())
        .single()

    if (!user) {
        return { user: {} , msg: 'session not found or expired', status: 400 }
    }

    return { user: user.data, msg:'session found', status: 200 }
});