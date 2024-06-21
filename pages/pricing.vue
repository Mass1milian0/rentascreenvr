<script setup>
definePageMeta({
  layout: "landing"
});

const pricing = [
  {
    name: "Classic Screen",
    price: "2.50€",
    popular: true,
    features: [
      "Your own media server",
      "24 hours up time",
      "Unlimited Spectators",
      "Simple interface",
      "Customer Support",
      "Fast servers",
    ],
    button: {
      text: "Rent a screen",
      link: "/purchase",
    },
  }
];
</script>

<template>
  <LandingContainer>
    <LandingSectionhead>
      <template v-slot:title>Pricing</template>
      <template v-slot:desc>Simple & Predictable Pricing.<br>No Surprises.</template>
    </LandingSectionhead>

    <div class="grid md:grid-cols-1 gap-10 mx-auto max-w-screen-lg mt-12">
      <LandingPricing v-for="item of pricing" :plan="item" />
    </div>
  </LandingContainer>
</template>
