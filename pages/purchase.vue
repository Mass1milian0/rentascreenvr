<template>
  <LandingContainer>
    <LandingSectionhead>
      <template v-slot:title>Rent A Screen</template>
      <template v-slot:desc>Get very own cinema screen.</template>
    </LandingSectionhead>
    <div class="flex lg:flex-row flex-wrap justify-center items-center gap-20 mt-10 w-full">
      <div v-if="loggedIn" class="w-full flex lg:flex-row flex-wrap justify-center items-center gap-20 mt-10">
        <div role="status" class="w-5/12" v-if="checkoutLoading">
          <svg aria-hidden="true" class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
            viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor" />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill" />
          </svg>
          <span class="sr-only">Loading...</span>
          <p>hey, this might take a while, if it doesn't load, try reloading the page</p>
        </div>
        <div id="payment" class="w-5/12">
          <!-- spinner loader v-if !checkout -->
        </div>
        <img src="~/assets/img/hero.png" alt="Rent a screen" class="w-4/12 h-fit" />
      </div>
      <div v-else class="flex flex-col justify-center items-center">
        <h2 class="text-xl font-bold">Hey We Are Really Sorry To Tell You This</h2>
        <p class="text-sm font-thin">We know it's annoying but you need to login before you can Rent A Screen</p>
        <p class="text-sm font-thin">if you bought a screen now without an account we wouldn't know to who give the screen.
        </p>
        <div class="flex items-center mt-3 gap-4">
          <LandingLink href="/login" styleName="muted" class="h-10 border-0" size="md">Log in</LandingLink>
          <LandingLink href="/signup" size="md" class="h-10 border-0">Sign up</LandingLink>
        </div>
      </div>
    </div>
  </LandingContainer>
</template>

<script lang="ts" setup>
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe, StripeEmbeddedCheckout } from '@stripe/stripe-js';
let { loggedIn, user, session, fetch, clear } = useUserSession();
definePageMeta({
  layout: "landing"
});

const runtimeConfigs = useRuntimeConfig();
const stripePromise = loadStripe(runtimeConfigs.public.STRIPE_PK ?? '');
let checkoutLoading = ref(true);
let clientSecret: { clientSecret: string } | null = null;
let checkout: StripeEmbeddedCheckout | null = null;

clientSecret = await $fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ amount: 250 })
})

let stripe: Stripe | null = null;

onMounted(async () => {
  if (loggedIn) {
    stripe = await stripePromise;
    const eventSource = new EventSource('/api/events');
    if (!stripe || !clientSecret) return console.error('Stripe or clientSecret not loaded');

    checkout = await stripe.initEmbeddedCheckout({
      clientSecret: clientSecret.clientSecret,
    })
    checkout.mount('#payment');
    checkoutLoading.value = false;

    eventSource.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (data.paymentSuccess){
        console.log('Payment success');
        eventSource.close();
        navigateTo(data.redir)
      }
    }

  }
});
onUnmounted(() => {
  if (checkout) {
    checkout.destroy();
  }
});
</script>