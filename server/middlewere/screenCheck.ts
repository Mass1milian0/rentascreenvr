import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/server/supabase'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const screen_id = body.screen_id

    if (!screen_id) {
        return { msg: 'screen_id is required', status: 400 }
    }

    const client = serverSupabaseServiceRole<Database>(event)
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