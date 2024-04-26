import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'
import { mkdir, rename } from 'fs/promises';

export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient<Database>(event)
    const session = await getUserSession(event)
    
    //get post data
    const body = await readBody(event)
    const screen_id = body.screen_id
    
    //check if screen exists, belongs to the user and is active
    
    if (!screen_id) {
        return { msg: 'screen_id is required', status: 400 }
    }
    
    if (!session.user) {
        return { msg: 'user not found', status: 400 }
    }
    const userid = (session.user as { id?: string })?.id || '000'

    const { data: screens, error: screenError } = await client
        .from('user_screens')
        .select('*')
        .eq('screen_id', screen_id)
        .eq('user', userid)
        .neq('status', 'Expired')
        .single()

    //delete the screen and regenerate it by reinserting it
    if (!screens) {
        return { msg: 'screen not found', status: 400 }
    }
    const { data: deleteData, error: deleteError } = await client.from('user_screens').delete().eq('id', screens.id).single()
    if (deleteError) {
        return { msg: deleteError.message, status: 500 }
    }
    const { data, error } = await client.from('user_screens').insert([
        {
            expires_in: screens.expires_in,
            user: userid,
            name: screens.name
        }
    ]).select().single()


    //rename the screen folder
    if(!data) return { msg: 'error creating screen', status: 500 }
    await rename(`${process.cwd()}/screens/${screen_id}`, `${process.cwd()}/screens/${data.screen_id}`)
    if (error) {
        return { msg: error, status: 500 }
    }
    return { newId: `${data.screen_id}`, status: 302 }
})