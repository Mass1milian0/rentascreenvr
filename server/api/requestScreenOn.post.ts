import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'

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
    .select('id')
    .eq('screen_id', screen_id)
    .eq('user', userid)
    .eq('status', 'Offline')
    .single()

  if (!screens) {
    return { msg: 'screen not found', status: 400 }
  }

  //update the screen status
  const { data, error } = await client.from('user_screens').update({ status: 'Online' }).eq('id', screens.id).select().single()

  if (error) {
    return { msg: error.message, status: 500 }
  }

  return { newStatus: data.status, status: 200 }
})
