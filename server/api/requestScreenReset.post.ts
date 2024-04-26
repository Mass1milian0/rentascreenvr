import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'
import * as fs from 'fs/promises';

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
    //check if the screen folder exists
    try {
        await fs.access(`./screens/${screen_id}`)
    } catch (error) {
    }
    const filesInFolder = await fs.readdir(`./screens/${screen_id}`)
    for (const file of filesInFolder) {
        try {
            await fs.unlink(`./screens/${screen_id}/${file}`)
        } catch (error) {
            //if it fails to delete the file, try again max 3 times waiting 5 seconds between each try
            for (let i = 0; i < 3; i++) {
                try {
                    await fs.unlink(`./screens/${screen_id}/${file}`)
                    break
                } catch (error) {
                    await new Promise<void>((resolve) => {
                        setTimeout(() => {
                            resolve()
                        }, 5000)
                    })
                    if(i === 2) return { msg: 'failed to delete file', status: 500 }
                }
            }           
        }
    }
    return { status: 200 }
})