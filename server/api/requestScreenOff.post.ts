import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'
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

  //update the screen status
  const { data, error } = await client.from('user_screens').update({ status: 'Offline' }).eq('id', screen_id).select().single()

  if (error) {
    return { msg: error.message, status: 500 }
  }

  return { newStatus: data.status, status: 200 }
})
