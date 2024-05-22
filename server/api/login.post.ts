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
    if (!users) {
        return { msg: 'user not found', status: 400, session_id: '' }
    }

    let email = users.email

    //try to login
    const { data, error } = await client.auth.signInWithPassword({
        email: email,
        password: body.password,
    })
    if (error) {
        return { msg: error.message, status: 500, session_id: '' }
    }

    //create a session for the user
    if (data.user) {
        const {data : session, error: session_error } = await client.from('sessions').insert({
            user_id: data.user.id,
            data: {
                id: data.user.id,
                email: data.user.email,
                username: body.username,
                lastlogin: new Date().toISOString()
            },
            expires_at: new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(), //7 days
        }).select('session_id').single()
        if (session_error) {
            return { msg: session_error.message, status: 500 }
        }
        return { msg: 'logged in', status: 200, session_id: session.session_id}
    } else {
        return { msg: 'user not found', status: 400, session_id: '' }
    }
})