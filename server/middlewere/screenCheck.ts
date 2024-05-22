import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'
import type { H3Event } from 'h3';
import { getCookie } from 'h3';

async function getUserSession(event: H3Event) {
    const session = getCookie(event, 'session');
    return session ? JSON.parse(session) : null;
}
export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const screen_id = body.screen_id

    if (!screen_id) {
        return { msg: 'screen_id is required', status: 400 }
    }

    const client = await serverSupabaseClient<Database>(event)
    const session = await getUserSession(event)
    const userid = (session.user as { id?: string })?.id || '000'

    const { data: screens, error: screenError } = await client
        .from('user_screens')
        .select('id, expires_in, name, status')
        .eq('screen_id', screen_id)
        .eq('user', userid)
        .neq('status', 'Expired')
        .single()

    if (!screens) {
        return { msg: 'screen not found', status: 400 }
    }
    event.context.screen = screens
    event.context.screenInterface = {
        id: screens.id,
        expires_in: screens.expires_in,
        name: screens.name,
        status: screens.status
    }
})