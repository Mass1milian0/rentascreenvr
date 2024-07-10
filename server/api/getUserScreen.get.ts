import userCheck from "../middlewere/userCheck"
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/server/supabase'
export default defineEventHandler(async (event) => {
    await userCheck(event);
    let user = event.context.user
    const server = serverSupabaseServiceRole<Database>(event)
    let { data, error } = await server.from('user_screens').select('*').eq('user', user.id).neq('status', 'Expired')
    if (error) {
        return { msg: error.message, status: 500 }
    }
    return { screens: data, status: 200 }
})