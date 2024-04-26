import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/server/supabase'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient<Database>(event)

  //get post data
  const body = await readBody(event)

  //validate post data
  if (!body.username || !body.password) {
    return { msg: 'username and password are required', status: 400 }
  }
  if (body.username.length < 4) {
    return { msg: 'username must be longer or equal 4 characters', status: 400 }
  }
  if (!body.password.match(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/)) {
    return { msg: 'password must contain at least one number and one uppercase and lowercase letter, and at least 8 or more characters', status: 400 }
  }

  //check mail format
  if (!body.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return { msg: 'invalid email format', status: 400 }
  }

  //check if username or mail or both are already taken
  const { data: users, error } = await client
    .from('users')
    .select('id')
    .eq('username', body.username)
  if (error) {
    return { msg: error.message, status: 500 }
  }
  if (users.length > 0) {
    return { msg: 'username or email already taken', status: 400 }
  }

  //create user
  const { data, error: createError } = await client.auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      emailRedirectTo: 'https://rentascreenvr.com',
    }
  })

  //return error if user creation failed
  if (createError) {
    return { msg: createError.message, status: 500 }
  }

  //create a session for the user
  if(data.user){
    await client.from('users').insert({ id: data.user.id, username: body.username, email: body.email})
    await setUserSession(event, {
      user:{
        id: data.user.id,
        username: body.username,
        loggedInAt: new Date().toISOString(),
      }
    })
  }

  //redirect to await email verification
  return { status: 302 }
})