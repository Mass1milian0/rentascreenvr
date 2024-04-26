// server/api/create-payment-intent.js
import Stripe from 'stripe';
const runtimeConfig = useRuntimeConfig();
const stripe = new Stripe(runtimeConfig.STRIPE_SK ?? '');

export default defineEventHandler(async (event) => {
  const { amount } = await readBody(event);
  const userSession = await getUserSession(event)
  const userid = (userSession.user as { id?: string })?.id || '000'

  if (!Object.keys(userSession).length) {
    await sendRedirect(event, '/login', 301)
    return { status: 301 }
  }
  const session = await stripe.checkout.sessions.create({
    currency: 'eur',
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Screen',
        },
        unit_amount: amount,
      },
      quantity: 1,
    }],
    mode: 'payment',
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    metadata: {
      'userid': userid
    }
  });

  return { clientSecret: session.client_secret };
});
