import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/server/supabase'
import Stripe from 'stripe';
const runtimeConfig = useRuntimeConfig();
const stripe = new Stripe(runtimeConfig.STRIPE_SK ?? '');
import { mkdir } from 'fs/promises';



export default defineEventHandler(async (event) => {
    const client = serverSupabaseServiceRole<Database>(event)
    const root = process.cwd()


    const body = await readRawBody(event)
    const headers = getRequestHeaders(event)
    const sig = headers['stripe-signature']

    let stripeEvent;
    if (!sig) return { msg: 'No stripe signature', status: 400 }
    try {
        stripeEvent = stripe.webhooks.constructEvent(body ?? '', sig, runtimeConfig.STRIPE_WEBHOOK_SECRET ?? '');
    } catch (err: any) {
        return { msg: `Webhook Error: ${err.message}`, status: 400 }
    }
    // Handle the checkout.session.completed event
    if (stripeEvent.type === 'checkout.session.completed') {
        let name;
        try {
            name = await fetch('https://makemeapassword.ligos.net/api/v1/readablepassphrase/plain?pc1&s=RandomShort').then(res => res.text())
        } catch (e) {
            name = 'Your own screen'
        }
        if (!stripeEvent.data.object.metadata || !stripeEvent.data.object.metadata.userid) return { msg: 'No user id', status: 400 }
        const { data, error } = await client.from('user_screens').insert([
            {
                expires_in: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
                user: stripeEvent.data.object.metadata.userid,
                name: name
            }
        ]).select().single()
        if (!data) return { msg: 'error creating screen', status: 500 }
        try {
            await mkdir(`${root}/screens`)
            await mkdir(`${root}/screens/${data.screen_id}`)
        } catch (error) {
        }
        global?.eventEmitter?.emit('stripe-event', {
            paymentSuccess: true,
            session: stripeEvent.data.object,
            redir: `/screens/${data.screen_id}`
        });
    }
    return { status: 200 }
})