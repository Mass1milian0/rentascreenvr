import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)

    //get post data
    const body = await readBody(event)

    //get user email by username , the mail is stored in auth.users table, the id is stored in public.users table as a foreign key
    //username is inside public.users table the id inside public.users table is the same as the id inside auth.users table

    //from the username get the id, using the id get the email from auth.users table, all in one query
    const { data: users, error: userError } = await client
        .from('users')
        .select('email')
        .eq('username', body.username)
        .single()

    //check if user exists
    if (!users || userError) {
        return { msg: 'user not found', status: 400 }
    }

    let email = users.email

    //try to login
    const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: body.password,
    })
    if (error) {
        return { msg: error.message, status: 500 }
    }

    //create a session for the user
    if(data.user){
        await setUserSession(event, {
            user:{
                id: data.user.id,
                username: body.username,
                loggedInAt: new Date().toISOString(),
            }
        })
    }
    await sendRedirect(event, body.redirect || '/')
    return { status: 200 }
})