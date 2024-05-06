import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'
import { rename, mkdir } from 'fs/promises';
import screenCheck from "../middlewere/screenCheck"
import userCheck from "../middlewere/userCheck"
export default defineEventHandler(async (event) => {
    const client = await serverSupabaseClient<Database>(event)
    
    //get post data
    const body = await readBody(event)
    const screen_id = body.screen_id
    
    //check if screen exists, belongs to the user and is active
    await userCheck(event);
    await screenCheck(event);
    let screenInterface = event.context.screenInterface
    let screen : typeof screenInterface = event.context.screen
    let user = event.context.user

    const { data: deleteData, error: deleteError } = await client.from('user_screens').delete().eq('screen_id', screen_id).single()
    if (deleteError) {
        return { msg: deleteError.message, status: 500 }
    }
    const { data, error } = await client.from('user_screens').insert([
        {
            expires_in: screen.expires_in,
            user: user.id,
            name: screen.name
        }
    ]).select().single()


    //rename the screen folder
    if(!data) return { msg: 'error creating screen', status: 500 }
    try {
        await rename(`${process.cwd()}/screens/${screen_id}`, `${process.cwd()}/screens/${data.screen_id}`)
    } catch (error : any) {
        //see if the screen folder exists
        if (error.code === 'ENOENT') {
            //create the screen folder
            await mkdir(`${process.cwd()}/screens/${data.screen_id}`)
        }        
    }
    if (error) {
        return { msg: error, status: 500 }
    }
    return { newId: `${data.screen_id}`, status: 302 }
})