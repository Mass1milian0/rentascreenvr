import userCheck from "../../middlewere/userCheck"
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/server/supabase'
export default defineEventHandler(async (event) => {
    await userCheck(event);
    let user = event.context.user
    const server = serverSupabaseServiceRole<Database>(event)
    const screenId = getRouterParam(event, 'screenId')
    if(!screenId) {
        return { msg: 'Screen not found', status: 400 }
    }
    let { data, error } = await server.from('user_screens').select('*').eq('user', user.id).eq('screen_id', screenId).neq('status', 'Expired').single();
    if (error) {
        return { msg: error.message, status: 500 }
    }
    return { screens: data, status: 200 }
})